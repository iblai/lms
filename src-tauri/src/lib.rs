// Hide console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod model_manager;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
mod offline_server;
mod ollama_installer;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
mod web_cache;

use model_manager::{
    cancel_download, check_disk_space, check_ollama_installed, get_timestamp, is_model_installed,
    is_ollama_running, pull_model, start_ollama_server, DiskSpaceError, DownloadProgress,
    InstallationLog, OllamaStatus, REQUIRED_FREE_SPACE_GB,
};
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use offline_server::{get_server_url, start_offline_server};
use ollama_installer::download_and_install_ollama;
use std::sync::Arc;
#[cfg(any(target_os = "ios", target_os = "android"))]
use std::sync::Mutex;
use tauri::{command, AppHandle, Emitter, Manager, WebviewWindowBuilder};
#[cfg(any(target_os = "ios", target_os = "android", target_os = "macos"))]
use tauri::Url;
#[cfg(any(target_os = "ios", target_os = "android"))]
use tauri_plugin_deep_link::DeepLinkExt;
#[cfg(any(target_os = "ios", target_os = "android"))]
use tauri::Listener;
#[cfg(not(any(target_os = "ios", target_os = "macos")))]
use tauri_plugin_shell::ShellExt;
use tokio::sync::RwLock;
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use web_cache::WebCache;
#[cfg(any(target_os = "ios", target_os = "macos"))]
use {
    block::ConcreteBlock,
    objc::{class, msg_send, sel, sel_impl},
    objc::runtime::{Class, Object, BOOL, YES},
    objc::declare::ClassDecl,
    std::ffi::{CStr, CString},
    std::ptr,
    std::sync::Once,
    tokio::sync::oneshot,
};

// Global web cache instance (desktop only)
#[cfg(not(any(target_os = "ios", target_os = "android")))]
static WEB_CACHE: std::sync::OnceLock<Arc<RwLock<Option<web_cache::WebCache>>>> = std::sync::OnceLock::new();

// Global storage for last skills route (persists across origins)
static LAST_SKILLS_ROUTE: std::sync::OnceLock<Arc<RwLock<Option<String>>>> = std::sync::OnceLock::new();

#[cfg(any(target_os = "ios", target_os = "android"))]
static PENDING_DEEP_LINK: std::sync::OnceLock<Mutex<Option<String>>> = std::sync::OnceLock::new();

// File name for persisting the last route
#[cfg(not(any(target_os = "ios", target_os = "android")))]
const LAST_ROUTE_FILE: &str = "last_skills_route.txt";

// App URL - configurable via TAURI_APP_URL env variable, with sensible defaults
fn get_app_url() -> String {
    // First check environment variable
    if let Ok(url) = std::env::var("TAURI_APP_URL") {
        return url;
    }

    // Mobile platforms always use production URL (localhost doesn't work on device)
    #[cfg(any(target_os = "ios", target_os = "android"))]
    return "https://skillsai.iblai.app".to_string();

    // Desktop: localhost for debug, production URL for release
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        #[cfg(debug_assertions)]
        return "https://skillsai.iblai.app".to_string();

        #[cfg(not(debug_assertions))]
        return "https://skills.iblai.app".to_string();
    }
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn get_web_cache() -> &'static Arc<RwLock<Option<WebCache>>> {
    WEB_CACHE.get_or_init(|| Arc::new(RwLock::new(None)))
}

fn get_last_route_storage() -> &'static Arc<RwLock<Option<String>>> {
    LAST_SKILLS_ROUTE.get_or_init(|| Arc::new(RwLock::new(None)))
}

#[cfg(any(target_os = "ios", target_os = "android"))]
fn get_pending_deep_link() -> &'static Mutex<Option<String>> {
    PENDING_DEEP_LINK.get_or_init(|| Mutex::new(None))
}

const OAUTH_URL_PATTERNS: &[&str] = &[
    // Google OAuth
    "accounts.google.com",
    "google.com/o/oauth",
    "googleapis.com/oauth",
    "google-oauth2",
    "/auth/login/google",
    "/login/google",
    // Apple OAuth
    "appleid.apple.com",
    "/auth/login/apple",
    "/login/apple",
];

fn is_oauth_url(url: &str) -> bool {
    OAUTH_URL_PATTERNS.iter().any(|pattern| url.contains(pattern))
}

#[cfg(any(target_os = "ios", target_os = "macos"))]
#[link(name = "AuthenticationServices", kind = "framework")]
extern "C" {}

#[cfg(target_os = "ios")]
#[link(name = "SafariServices", kind = "framework")]
extern "C" {}

#[cfg(target_os = "ios")]
#[allow(unexpected_cfgs)]
fn open_url_via_application(ns_url: *mut Object) -> Result<(), String> {
    println!("[ibl.ai] open_url_via_application called (FALLBACK - will open in Safari app)");

    unsafe {
        if ns_url.is_null() {
            return Err("NSURL was null".to_string());
        }

        let app: *mut Object = msg_send![class!(UIApplication), sharedApplication];
        if app.is_null() {
            return Err("Failed to access UIApplication".to_string());
        }

        let responds: BOOL =
            msg_send![app, respondsToSelector: sel!(openURL:options:completionHandler:)];
        if responds == YES {
            let _: () = msg_send![
                app,
                openURL: ns_url
                options: ptr::null::<Object>()
                completionHandler: ptr::null::<Object>()
            ];
        } else {
            let _: BOOL = msg_send![app, openURL: ns_url];
        }
    }

    Ok(())
}

#[cfg(target_os = "ios")]
#[allow(unexpected_cfgs)]
unsafe fn get_presentation_window() -> *mut Object {
    let app: *mut Object = msg_send![class!(UIApplication), sharedApplication];
    let windows: *mut Object = msg_send![app, windows];
    let window_count: usize = msg_send![windows, count];

    if window_count > 0 {
        let window: *mut Object = msg_send![windows, objectAtIndex: 0usize];
        println!("[ibl.ai] Got window for presentation (count: {})", window_count);
        window
    } else {
        println!("[ibl.ai] No windows available");
        ptr::null_mut()
    }
}

#[cfg(target_os = "ios")]
#[allow(unexpected_cfgs)]
unsafe fn get_context_provider_class() -> &'static Class {
    static REGISTER_CLASS: Once = Once::new();
    static mut CONTEXT_PROVIDER_CLASS: Option<&'static Class> = None;

    REGISTER_CLASS.call_once(|| {
        let superclass = class!(NSObject);
        let mut decl = ClassDecl::new("IBLAuthContextProvider", superclass).unwrap();

        extern "C" fn presentation_anchor_for_session(_: &Object, _: objc::runtime::Sel, _session: *mut Object) -> *mut Object {
            unsafe { get_presentation_window() }
        }

        unsafe {
            decl.add_method(
                sel!(presentationAnchorForWebAuthenticationSession:),
                presentation_anchor_for_session as extern "C" fn(&Object, objc::runtime::Sel, *mut Object) -> *mut Object,
            );
        }

        let class = decl.register();
        CONTEXT_PROVIDER_CLASS = Some(class);
    });

    unsafe { CONTEXT_PROVIDER_CLASS.unwrap() }
}

#[cfg(target_os = "ios")]
#[allow(unexpected_cfgs)]
fn open_with_auth_session(url: &str, app_handle: &AppHandle) -> Result<(), String> {
    println!("[ibl.ai] open_with_auth_session called with URL: {}", url);

    unsafe {
        let c_url = CString::new(url).map_err(|_| "Failed to create CString from URL".to_string())?;
        let ns_string: *mut Object =
            msg_send![class!(NSString), stringWithUTF8String: c_url.as_ptr()];
        if ns_string.is_null() {
            return Err("Failed to create NSString".to_string());
        }

        let ns_url: *mut Object = msg_send![class!(NSURL), URLWithString: ns_string];
        if ns_url.is_null() {
            return Err("Failed to create NSURL".to_string());
        }
        println!("[ibl.ai] NSURL created successfully");

        let scheme_c = CString::new("iblai-skills").unwrap();
        let scheme_ns: *mut Object = msg_send![class!(NSString), stringWithUTF8String: scheme_c.as_ptr()];

        let auth_session_class = match Class::get("ASWebAuthenticationSession") {
            Some(class) => {
                println!("[ibl.ai] ASWebAuthenticationSession class found");
                class
            },
            None => {
                println!("[ibl.ai] ASWebAuthenticationSession class NOT found, falling back to Safari app");
                return open_url_via_application(ns_url);
            }
        };

        let app_handle_clone = app_handle.clone();
        let block = ConcreteBlock::new(move |callback_url: *mut Object, error: *mut Object| {
            unsafe {
                if !callback_url.is_null() {
                    let url_string_ns: *mut Object = msg_send![callback_url, absoluteString];
                    let url_c_str: *const i8 = msg_send![url_string_ns, UTF8String];
                    if !url_c_str.is_null() {
                        let url_str = CStr::from_ptr(url_c_str).to_string_lossy().to_string();
                        println!("[ibl.ai] ASWebAuthenticationSession completed with callback URL: {}", url_str);
                        handle_deep_link_url(&app_handle_clone, &url_str);
                    }
                } else if !error.is_null() {
                    let description: *mut Object = msg_send![error, localizedDescription];
                    let c_str: *const i8 = msg_send![description, UTF8String];
                    if !c_str.is_null() {
                        let error_str = CStr::from_ptr(c_str);
                        println!("[ibl.ai] ASWebAuthenticationSession error: {:?}", error_str);
                    }
                }
            }
        });
        let block = block.copy();

        let session: *mut Object = msg_send![auth_session_class, alloc];
        let session: *mut Object = msg_send![
            session,
            initWithURL: ns_url
            callbackURLScheme: scheme_ns
            completionHandler: &*block
        ];

        if session.is_null() {
            return Err("Failed to create ASWebAuthenticationSession".to_string());
        }
        println!("[ibl.ai] ASWebAuthenticationSession created successfully");

        let responds: BOOL = msg_send![session, respondsToSelector: sel!(setPrefersEphemeralWebBrowserSession:)];
        if responds == YES {
            println!("[ibl.ai] Setting prefersEphemeralWebBrowserSession = YES");
            let _: () = msg_send![session, setPrefersEphemeralWebBrowserSession: YES];
        }

        let provider_class = get_context_provider_class();
        let provider: *mut Object = msg_send![provider_class, new];
        if !provider.is_null() {
            let responds_to_provider: BOOL = msg_send![session, respondsToSelector: sel!(setPresentationContextProvider:)];
            if responds_to_provider == YES {
                println!("[ibl.ai] Setting presentation context provider");
                let _: () = msg_send![session, setPresentationContextProvider: provider];
            }
        }

        let started: BOOL = msg_send![session, start];
        if started == YES {
            println!("[ibl.ai] ASWebAuthenticationSession started successfully");
            Ok(())
        } else {
            Err("Failed to start ASWebAuthenticationSession".to_string())
        }
    }
}

// macOS-specific implementations for ASWebAuthenticationSession
#[cfg(target_os = "macos")]
#[allow(unexpected_cfgs)]
unsafe fn get_presentation_window_macos() -> *mut Object {
    let app: *mut Object = msg_send![class!(NSApplication), sharedApplication];
    let key_window: *mut Object = msg_send![app, keyWindow];

    if !key_window.is_null() {
        println!("[ibl.ai] Got key window for macOS presentation");
        key_window
    } else {
        let main_window: *mut Object = msg_send![app, mainWindow];
        if !main_window.is_null() {
            println!("[ibl.ai] Got main window for macOS presentation");
            main_window
        } else {
            let windows: *mut Object = msg_send![app, windows];
            let window_count: usize = msg_send![windows, count];
            if window_count > 0 {
                let window: *mut Object = msg_send![windows, objectAtIndex: 0usize];
                println!("[ibl.ai] Got first window for macOS presentation (count: {})", window_count);
                window
            } else {
                println!("[ibl.ai] No windows available on macOS");
                ptr::null_mut()
            }
        }
    }
}

#[cfg(target_os = "macos")]
#[allow(unexpected_cfgs)]
unsafe fn get_context_provider_class_macos() -> &'static Class {
    static REGISTER_CLASS: Once = Once::new();
    static mut CONTEXT_PROVIDER_CLASS: Option<&'static Class> = None;

    REGISTER_CLASS.call_once(|| {
        let superclass = class!(NSObject);
        let mut decl = ClassDecl::new("IBLAuthContextProviderMac", superclass).unwrap();

        extern "C" fn presentation_anchor_for_session(_: &Object, _: objc::runtime::Sel, _session: *mut Object) -> *mut Object {
            unsafe { get_presentation_window_macos() }
        }

        unsafe {
            decl.add_method(
                sel!(presentationAnchorForWebAuthenticationSession:),
                presentation_anchor_for_session as extern "C" fn(&Object, objc::runtime::Sel, *mut Object) -> *mut Object,
            );
        }

        let class = decl.register();
        CONTEXT_PROVIDER_CLASS = Some(class);
    });

    unsafe { CONTEXT_PROVIDER_CLASS.unwrap() }
}

#[cfg(target_os = "macos")]
#[allow(unexpected_cfgs)]
fn open_with_auth_session_macos(url: &str, app_handle: &AppHandle) -> Result<(), String> {
    println!("[ibl.ai] open_with_auth_session_macos called with URL: {}", url);

    unsafe {
        let c_url = CString::new(url).map_err(|_| "Failed to create CString from URL".to_string())?;
        let ns_string: *mut Object =
            msg_send![class!(NSString), stringWithUTF8String: c_url.as_ptr()];
        if ns_string.is_null() {
            return Err("Failed to create NSString".to_string());
        }

        let ns_url: *mut Object = msg_send![class!(NSURL), URLWithString: ns_string];
        if ns_url.is_null() {
            return Err("Failed to create NSURL".to_string());
        }
        println!("[ibl.ai] NSURL created successfully");

        let scheme_c = CString::new("iblai-skills").unwrap();
        let scheme_ns: *mut Object = msg_send![class!(NSString), stringWithUTF8String: scheme_c.as_ptr()];

        let auth_session_class = match Class::get("ASWebAuthenticationSession") {
            Some(class) => {
                println!("[ibl.ai] ASWebAuthenticationSession class found on macOS");
                class
            },
            None => {
                println!("[ibl.ai] ASWebAuthenticationSession class NOT found on macOS");
                return Err("ASWebAuthenticationSession not available".to_string());
            }
        };

        let app_handle_clone = app_handle.clone();
        let block = ConcreteBlock::new(move |callback_url: *mut Object, error: *mut Object| {
            unsafe {
                if !callback_url.is_null() {
                    let url_string_ns: *mut Object = msg_send![callback_url, absoluteString];
                    let url_c_str: *const i8 = msg_send![url_string_ns, UTF8String];
                    if !url_c_str.is_null() {
                        let url_str = CStr::from_ptr(url_c_str).to_string_lossy().to_string();
                        println!("[ibl.ai] macOS ASWebAuthenticationSession completed with callback URL: {}", url_str);
                        handle_auth_session_callback_macos(&app_handle_clone, &url_str);
                    }
                } else if !error.is_null() {
                    let description: *mut Object = msg_send![error, localizedDescription];
                    let c_str: *const i8 = msg_send![description, UTF8String];
                    if !c_str.is_null() {
                        let error_str = CStr::from_ptr(c_str);
                        println!("[ibl.ai] macOS ASWebAuthenticationSession error: {:?}", error_str);
                    }
                }
            }
        });
        let block = block.copy();

        let session: *mut Object = msg_send![auth_session_class, alloc];
        let session: *mut Object = msg_send![
            session,
            initWithURL: ns_url
            callbackURLScheme: scheme_ns
            completionHandler: &*block
        ];

        if session.is_null() {
            return Err("Failed to create ASWebAuthenticationSession on macOS".to_string());
        }
        println!("[ibl.ai] ASWebAuthenticationSession created successfully on macOS");

        let responds: BOOL = msg_send![session, respondsToSelector: sel!(setPrefersEphemeralWebBrowserSession:)];
        if responds == YES {
            println!("[ibl.ai] Setting prefersEphemeralWebBrowserSession = YES on macOS");
            let _: () = msg_send![session, setPrefersEphemeralWebBrowserSession: YES];
        }

        let provider_class = get_context_provider_class_macos();
        let provider: *mut Object = msg_send![provider_class, new];
        if !provider.is_null() {
            let responds_to_provider: BOOL = msg_send![session, respondsToSelector: sel!(setPresentationContextProvider:)];
            if responds_to_provider == YES {
                println!("[ibl.ai] Setting macOS presentation context provider");
                let _: () = msg_send![session, setPresentationContextProvider: provider];
            }
        }

        let started: BOOL = msg_send![session, start];
        if started == YES {
            println!("[ibl.ai] macOS ASWebAuthenticationSession started successfully");
            Ok(())
        } else {
            Err("Failed to start ASWebAuthenticationSession on macOS".to_string())
        }
    }
}

/// Handle ASWebAuthenticationSession callback URL on macOS
#[cfg(target_os = "macos")]
fn handle_auth_session_callback_macos(app_handle: &AppHandle, raw_url: &str) {
    println!("[ibl.ai] macOS auth session callback: {}", raw_url);

    let parsed = match tauri::Url::parse(raw_url) {
        Ok(url) => url,
        Err(e) => {
            println!("[ibl.ai] Failed to parse callback URL: {}", e);
            return;
        }
    };

    let scheme = parsed.scheme();
    let host = parsed.host_str().unwrap_or("");
    let path = parsed.path();
    println!("[ibl.ai] Parsed callback - scheme: {}, host: {}, path: {}", scheme, host, path);

    let is_custom_scheme = scheme == "iblai-skills" || scheme == "ai.ibl.skills";
    if !is_custom_scheme {
        println!("[ibl.ai] Not a custom scheme callback, ignoring");
        return;
    }

    let mut final_path = parsed.path().to_string();
    if final_path.is_empty() || final_path == "/" {
        if !host.is_empty() {
            final_path = format!("/{}", host);
        }
    }

    if !final_path.starts_with("/sso-login") && !final_path.starts_with("/mobile-sso-login") && !final_path.starts_with("/sso-login-complete") {
        println!("[ibl.ai] Path '{}' not SSO-related, ignoring", final_path);
        return;
    }

    // Normalize /sso-login to /sso-login-complete for all SSO callbacks
    let final_path = if final_path.starts_with("/sso-login") && !final_path.starts_with("/sso-login-complete") {
        let normalized = final_path.replacen("/sso-login", "/sso-login-complete", 1);
        println!("[ibl.ai] Normalized path: {} -> {}", final_path, normalized);
        normalized
    } else {
        final_path
    };

    // Extract query params from raw URL, fully decode them, and use JS URLSearchParams
    let base_url = format!("{}{}", get_app_url(), final_path);
    let raw_query = raw_url.find('?').map(|i| &raw_url[i + 1..]).unwrap_or("");

    let mut params: Vec<(String, String)> = Vec::new();
    for part in raw_query.split('&') {
        if part.is_empty() { continue; }
        let (key, value) = match part.find('=') {
            Some(i) => (&part[..i], &part[i + 1..]),
            None => (part, ""),
        };
        let mut decoded = value.to_string();
        loop {
            match urlencoding::decode(&decoded) {
                Ok(d) if d != decoded => decoded = d.into_owned(),
                _ => break,
            }
        }
        let decoded_key = urlencoding::decode(key).unwrap_or_else(|_| key.into()).into_owned();
        params.push((decoded_key, decoded));
    }

    println!("[ibl.ai] Target base URL: {}, params: {:?}", base_url, params.iter().map(|(k, _)| k.as_str()).collect::<Vec<_>>());

    if let Some(window) = app_handle.get_webview_window("main") {
        let js_base = serde_json::to_string(&base_url).unwrap_or_default();
        let mut js_parts = vec![format!("var u = new URL({});", js_base)];
        for (key, value) in &params {
            let js_key = serde_json::to_string(key).unwrap_or_default();
            let js_val = serde_json::to_string(value).unwrap_or_default();
            js_parts.push(format!("u.searchParams.set({}, {});", js_key, js_val));
        }
        js_parts.push("window.location.href = u.toString();".to_string());
        let js = js_parts.join(" ");

        match window.eval(&js) {
            Ok(_) => println!("[ibl.ai] Successfully navigated via URLSearchParams"),
            Err(e) => println!("[ibl.ai] Failed to navigate: {}", e),
        }
    } else {
        println!("[ibl.ai] Main window not found for callback navigation");
    }
}

fn open_oauth_url(app: &AppHandle, url: &str) -> Result<(), String> {
    #[cfg(target_os = "ios")]
    {
        let url_for_main = url.to_string();
        let app_handle = app.clone();

        app.run_on_main_thread(move || {
            if let Err(err) = open_with_auth_session(&url_for_main, &app_handle) {
                println!("[ibl.ai] Failed to open auth session: {}", err);
            }
        })
        .map_err(|e| format!("Failed to schedule auth session: {}", e))
    }

    #[cfg(target_os = "macos")]
    {
        let url_for_main = url.to_string();
        let app_handle = app.clone();

        app.run_on_main_thread(move || {
            if let Err(err) = open_with_auth_session_macos(&url_for_main, &app_handle) {
                println!("[ibl.ai] Failed to open auth session on macOS: {}", err);
            }
        })
        .map_err(|e| format!("Failed to schedule auth session: {}", e))
    }

    #[cfg(not(any(target_os = "ios", target_os = "macos")))]
    {
        app.shell()
            .open(url, None)
            .map_err(|e| format!("Failed to open URL: {}", e))
    }
}

/// Open OAuth URL in an in-app popup window (desktop only)
/// The window monitors for callback URLs and closes automatically when auth completes
#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn open_oauth_in_popup(url: &str, app_handle: &AppHandle) -> Result<(), String> {
    println!("[IBL Skills] Opening OAuth in popup window: {}", url);

    let app_handle_clone = app_handle.clone();

    let _auth_window = WebviewWindowBuilder::new(
        app_handle,
        "oauth-popup",
        tauri::WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?),
    )
    .title("Sign In")
    .inner_size(500.0, 700.0)
    .center()
    .focused(true)
    .on_navigation(move |nav_url| {
        let url_str = nav_url.as_str();
        println!("[OAuth Popup] Navigation to: {}", url_str);

        // Check if this is a callback URL (auth completed)
        let is_callback = url_str.contains("login.iblai.app") &&
            (url_str.contains("/callback") ||
             url_str.contains("code=") ||
             url_str.contains("token=") ||
             url_str.contains("access_token="));

        // Also check for custom scheme callbacks
        let is_custom_scheme = url_str.starts_with("iblai-skills://") ||
                               url_str.starts_with("ai.ibl.skills://");

        if is_callback || is_custom_scheme {
            println!("[OAuth Popup] Auth callback detected: {}", url_str);

            // Navigate the main window to the callback URL
            if let Some(main_win) = app_handle_clone.get_webview_window("main") {
                let target_url = if is_custom_scheme {
                    // Convert custom scheme to app URL
                    let path = url_str
                        .replace("iblai-skills://", "/")
                        .replace("ai.ibl.skills://", "/");
                    format!("{}{}", get_app_url(), path)
                } else {
                    url_str.to_string()
                };

                println!("[OAuth Popup] Navigating main window to: {}", target_url);
                let _ = main_win.eval(&format!("window.location.href = '{}';", target_url));
                let _ = main_win.set_focus();
            }

            // Close the OAuth popup
            if let Some(oauth_win) = app_handle_clone.get_webview_window("oauth-popup") {
                println!("[OAuth Popup] Closing popup window");
                let _ = oauth_win.close();
            }

            return false;
        }

        true
    })
    .build()
    .map_err(|e| format!("Failed to create OAuth popup: {}", e))?;

    println!("[IBL Skills] OAuth popup window created");
    Ok(())
}

#[cfg(any(target_os = "ios", target_os = "android"))]
fn handle_deep_link_url(app_handle: &AppHandle, raw_url: &str) {
    let window = app_handle.get_webview_window("main");
    println!("[ibl.ai] Deep link received: {}", raw_url);

    let parsed = match Url::parse(raw_url) {
        Ok(url) => url,
        Err(e) => {
            println!("[ibl.ai] Failed to parse URL: {}", e);
            return;
        }
    };

    let scheme = parsed.scheme();
    let host = parsed.host_str().unwrap_or("");
    let path = parsed.path();
    println!("[ibl.ai] Parsed URL - scheme: {}, host: {}, path: {}", scheme, host, path);

    // Handle both custom URI schemes and Universal Links (https with our domain)
    let is_custom_scheme = scheme == "iblai-skills" || scheme == "ai.ibl.skills";
    let is_universal_link = scheme == "https" && (host == "skillsai.iblai.app" || host == "skills.iblai.app");
    println!("[ibl.ai] is_custom_scheme: {}, is_universal_link: {}", is_custom_scheme, is_universal_link);

    if !is_custom_scheme && !is_universal_link {
        println!("[ibl.ai] URL not a custom scheme or universal link, ignoring");
        return;
    }

    let mut path = parsed.path().to_string();

    // For custom schemes, the host might be part of the path
    if is_custom_scheme && (path.is_empty() || path == "/") {
        if !host.is_empty() {
            path = format!("/{}", host);
            println!("[ibl.ai] Adjusted path from host: {}", path);
        }
    }

    println!("[ibl.ai] Final path: {}", path);

    // Only handle SSO-related paths
    if !path.starts_with("/sso-login") && !path.starts_with("/mobile-sso-login") && !path.starts_with("/sso-login-complete") {
        println!("[ibl.ai] Path does not start with SSO-related paths, ignoring");
        return;
    }

    // Normalize /sso-login to /sso-login-complete for all SSO callbacks
    let final_path = if path.starts_with("/sso-login") && !path.starts_with("/sso-login-complete") {
        let normalized = path.replacen("/sso-login", "/sso-login-complete", 1);
        println!("[ibl.ai] Normalized path: {} -> {}", path, normalized);
        normalized
    } else {
        path
    };

    // Extract query params from raw URL, fully decode them, and use JS URLSearchParams
    // to construct the target URL (avoids browser re-encoding percent-encoded chars)
    let base_url = format!("{}{}", get_app_url(), final_path);
    let raw_query = raw_url.find('?').map(|i| &raw_url[i + 1..]).unwrap_or("");

    // Parse individual query params and fully decode their values
    let mut params: Vec<(String, String)> = Vec::new();
    for part in raw_query.split('&') {
        if part.is_empty() { continue; }
        let (key, value) = match part.find('=') {
            Some(i) => (&part[..i], &part[i + 1..]),
            None => (part, ""),
        };
        // Fully decode: keep decoding until no more percent-encoded chars remain
        let mut decoded = value.to_string();
        loop {
            match urlencoding::decode(&decoded) {
                Ok(d) if d != decoded => decoded = d.into_owned(),
                _ => break,
            }
        }
        let decoded_key = urlencoding::decode(key).unwrap_or_else(|_| key.into()).into_owned();
        params.push((decoded_key, decoded));
    }

    println!("[ibl.ai] Target base URL: {}, params: {:?}", base_url, params.iter().map(|(k, _)| k.as_str()).collect::<Vec<_>>());

    if let Some(window) = window {
        println!("[ibl.ai] Main window found, attempting navigation");

        // Build JS that uses URLSearchParams to properly encode the URL
        let js_base = serde_json::to_string(&base_url).unwrap_or_default();
        let mut js_parts = vec![format!("var u = new URL({});", js_base)];
        for (key, value) in &params {
            let js_key = serde_json::to_string(key).unwrap_or_default();
            let js_val = serde_json::to_string(value).unwrap_or_default();
            js_parts.push(format!("u.searchParams.set({}, {});", js_key, js_val));
        }
        js_parts.push("window.location.href = u.toString();".to_string());
        let js = js_parts.join(" ");

        let eval_result = window.eval(&js);
        match eval_result {
            Ok(_) => println!("[ibl.ai] Successfully navigated via URLSearchParams"),
            Err(e) => println!("[ibl.ai] Failed to navigate: {}", e),
        }
    } else {
        println!("[ibl.ai] Main window not found, storing as pending deep link");

        // Store the raw URL for later processing when the window is available
        if let Ok(mut pending) = get_pending_deep_link().lock() {
            *pending = Some(raw_url.to_string());
            println!("[ibl.ai] Stored pending deep link: {}", raw_url);
        } else {
            println!("[ibl.ai] Failed to store pending deep link");
        }
    }
}

// Event name constants
const EVENT_DOWNLOAD_PROGRESS: &str = "model:download-progress";
const EVENT_INSTALLATION_LOG: &str = "model:installation-log";
const EVENT_DISK_SPACE_ERROR: &str = "model:disk-space-error";
const EVENT_OLLAMA_STATUS: &str = "model:ollama-status";

/// Install Ollama on the system
#[command]
async fn install_ollama() -> Result<String, String> {
    // Check if already installed using the same logic as model_manager
    if check_ollama_installed() {
        return Ok("Ollama already installed".into());
    }

    download_and_install_ollama().await?;

    // Start Ollama server using the correct path
    start_ollama_server().map_err(|e| e.to_string())?;

    Ok("Ollama installed and started".into())
}

/// Check Ollama installation and model status
#[command]
async fn check_ollama_status(app: AppHandle) -> Result<OllamaStatus, String> {
    let installed = check_ollama_installed();
    let running = if installed {
        is_ollama_running().await
    } else {
        false
    };
    let model_installed = if running {
        is_model_installed("phi3:mini").await
    } else {
        false
    };

    let status = OllamaStatus {
        installed,
        running,
        model_installed,
    };

    // Emit status update event
    let _ = app.emit(EVENT_OLLAMA_STATUS, &status);

    Ok(status)
}

/// Check if there's enough disk space for the model download
#[command]
async fn check_disk_space_for_model(app: AppHandle) -> Result<bool, String> {
    let available_gb = check_disk_space()?;

    if available_gb < REQUIRED_FREE_SPACE_GB {
        let error = DiskSpaceError {
            required_gb: REQUIRED_FREE_SPACE_GB,
            available_gb,
            message: format!(
                "Insufficient disk space. {:.1} GB available, {:.1} GB required.",
                available_gb, REQUIRED_FREE_SPACE_GB
            ),
        };
        let _ = app.emit(EVENT_DISK_SPACE_ERROR, &error);
        return Ok(false);
    }

    Ok(true)
}

/// Download the Phi3 Mini model
#[command]
async fn download_phi3_model(app: AppHandle) -> Result<(), String> {
    let app_progress = Arc::new(app.clone());
    let app_log = Arc::new(app.clone());

    // Emit initial log
    let _ = app.emit(
        EVENT_INSTALLATION_LOG,
        InstallationLog {
            timestamp: get_timestamp(),
            level: "info".to_string(),
            message: "Checking Ollama status...".to_string(),
        },
    );

    // Check if Ollama is running
    if !is_ollama_running().await {
        let _ = app.emit(
            EVENT_INSTALLATION_LOG,
            InstallationLog {
                timestamp: get_timestamp(),
                level: "info".to_string(),
                message: "Starting Ollama server...".to_string(),
            },
        );

        // Try to start it
        start_ollama_server()?;

        // Wait for it to start
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        if !is_ollama_running().await {
            return Err("Could not start Ollama server. Please start Ollama manually.".to_string());
        }

        let _ = app.emit(
            EVENT_INSTALLATION_LOG,
            InstallationLog {
                timestamp: get_timestamp(),
                level: "info".to_string(),
                message: "Ollama server started successfully".to_string(),
            },
        );
    }

    // Check disk space
    let available_gb = check_disk_space()?;
    if available_gb < REQUIRED_FREE_SPACE_GB {
        let error = DiskSpaceError {
            required_gb: REQUIRED_FREE_SPACE_GB,
            available_gb,
            message: format!(
                "Insufficient disk space. {:.1} GB available, {:.1} GB required.",
                available_gb, REQUIRED_FREE_SPACE_GB
            ),
        };
        let _ = app.emit(EVENT_DISK_SPACE_ERROR, &error);
        return Err(error.message);
    }

    // Check if already installed
    if is_model_installed("phi3:mini").await {
        let _ = app.emit(
            EVENT_DOWNLOAD_PROGRESS,
            DownloadProgress {
                status: "completed".to_string(),
                completed: 0,
                total: 0,
                percentage: 100.0,
                digest: None,
                message: "Model already installed".to_string(),
            },
        );

        let _ = app.emit(
            EVENT_INSTALLATION_LOG,
            InstallationLog {
                timestamp: get_timestamp(),
                level: "info".to_string(),
                message: "Phi3 Mini model is already installed".to_string(),
            },
        );

        return Ok(());
    }

    // Start the model download
    pull_model(
        "phi3:mini",
        move |progress| {
            let _ = app_progress.emit(EVENT_DOWNLOAD_PROGRESS, &progress);
        },
        move |log| {
            let _ = app_log.emit(EVENT_INSTALLATION_LOG, &log);
        },
    )
    .await
}

/// Check network connectivity by attempting to reach a reliable endpoint
#[command]
async fn check_network_status() -> Result<bool, String> {
    // Try to reach a reliable endpoint with a short timeout
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    // Try multiple endpoints for reliability
    let endpoints = [
        "https://www.google.com/generate_204",
        "https://connectivity-check.ubuntu.com/",
        "https://www.apple.com/library/test/success.html",
    ];

    for endpoint in endpoints {
        match client.head(endpoint).send().await {
            Ok(response) => {
                if response.status().is_success() || response.status().as_u16() == 204 {
                    return Ok(true);
                }
            }
            Err(_) => continue,
        }
    }

    Ok(false)
}

/// Cancel an ongoing model download
#[command]
async fn cancel_model_download(app: AppHandle) -> Result<(), String> {
    let _ = app.emit(
        EVENT_INSTALLATION_LOG,
        InstallationLog {
            timestamp: get_timestamp(),
            level: "info".to_string(),
            message: "Cancelling download...".to_string(),
        },
    );

    cancel_download()?;

    let _ = app.emit(
        EVENT_DOWNLOAD_PROGRESS,
        DownloadProgress {
            status: "cancelled".to_string(),
            completed: 0,
            total: 0,
            percentage: 0.0,
            digest: None,
            message: "Download cancelled".to_string(),
        },
    );

    Ok(())
}

/// Set the online/offline status for the web cache
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn set_cache_online_status(is_online: bool) -> Result<(), String> {
    let cache_lock = get_web_cache().read().await;
    if let Some(cache) = cache_lock.as_ref() {
        cache.set_online(is_online).await;
        Ok(())
    } else {
        Err("Cache not initialized".to_string())
    }
}

/// Clear the web cache
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn clear_web_cache() -> Result<(), String> {
    let cache_lock = get_web_cache().read().await;
    if let Some(cache) = cache_lock.as_ref() {
        cache.clear().await
    } else {
        Err("Cache not initialized".to_string())
    }
}

/// Get web cache statistics
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn get_web_cache_stats() -> Result<web_cache::CacheStats, String> {
    let cache_lock = get_web_cache().read().await;
    if let Some(cache) = cache_lock.as_ref() {
        Ok(cache.get_stats().await)
    } else {
        Err("Cache not initialized".to_string())
    }
}

/// Get the offline server URL
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
fn get_offline_server_url() -> String {
    get_server_url()
}

/// Check if the offline server is running
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn is_offline_server_ready() -> bool {
    // Try a few times with small delays to handle startup timing
    for i in 0..5 {
        if offline_server::is_server_running().await {
            println!("[SkillsAI] Offline server is ready (attempt {})", i + 1);
            return true;
        }
        if i < 4 {
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        }
    }
    println!("[SkillsAI] Offline server not ready after 5 attempts");
    false
}

/// Pre-cache the app and all its assets for offline use
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn precache_app(app: AppHandle, url: String) -> Result<web_cache::PrecacheResult, String> {
    // Extract the route from the URL and save it
    // URL format: https://skills.iblai.app/platform/<tenant>/<mentorId>
    if let Some(path_start) = url.find("/platform/") {
        let route = &url[path_start..];
        println!("[SkillsAI] Extracting route from precache URL: {}", route);

        // Save to memory
        let storage = get_last_route_storage();
        let mut lock = storage.write().await;
        *lock = Some(route.to_string());
        drop(lock);

        // Save to file
        if let Ok(app_data_dir) = app.path().app_data_dir() {
            let route_file = app_data_dir.join(LAST_ROUTE_FILE);
            if let Err(e) = std::fs::write(&route_file, route) {
                println!("[SkillsAI] Failed to save route to file: {}", e);
            } else {
                println!("[SkillsAI] Saved route from precache: {:?}", route_file);
            }
        }
    }

    let cache_lock = get_web_cache().read().await;
    if let Some(cache) = cache_lock.as_ref() {
        cache.precache_with_assets(&url).await
    } else {
        Err("Cache not initialized".to_string())
    }
}

/// Save the last skills route (persists across origins and app restarts)
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn save_last_skills_route(app: AppHandle, route: String) -> Result<(), String> {
    println!("[SkillsAI] Saving last skills route: {}", route);

    // Save to memory
    let storage = get_last_route_storage();
    let mut lock = storage.write().await;
    *lock = Some(route.clone());
    drop(lock);

    // Save to file for persistence across app restarts
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let route_file = app_data_dir.join(LAST_ROUTE_FILE);
    std::fs::write(&route_file, &route).map_err(|e| e.to_string())?;

    println!("[SkillsAI] Saved route to: {:?}", route_file);
    Ok(())
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
const OFFLINE_CONTEXT_FILE: &str = "offline_context.json";

/// Save the full offline context (localStorage data needed for offline mode)
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn save_offline_context(app: AppHandle, context: String) -> Result<(), String> {
    println!("[SkillsAI] Saving offline context ({} bytes)", context.len());

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let context_file = app_data_dir.join(OFFLINE_CONTEXT_FILE);
    std::fs::write(&context_file, &context).map_err(|e| e.to_string())?;

    println!("[SkillsAI] Saved offline context to: {:?}", context_file);
    Ok(())
}

/// Get the saved offline context
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn get_offline_context(app: AppHandle) -> Option<String> {
    let app_data_dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => return None,
    };
    let context_file = app_data_dir.join(OFFLINE_CONTEXT_FILE);

    match std::fs::read_to_string(&context_file) {
        Ok(context) => {
            println!("[SkillsAI] Loaded offline context ({} bytes)", context.len());
            Some(context)
        }
        Err(e) => {
            println!("[SkillsAI] No offline context found: {}", e);
            None
        }
    }
}

/// Get the operating system type
#[command]
fn get_os_type() -> String {
    #[cfg(target_os = "windows")]
    return "windows".to_string();

    #[cfg(target_os = "macos")]
    return "macos".to_string();

    #[cfg(target_os = "linux")]
    return "linux".to_string();

    #[cfg(target_os = "ios")]
    return "ios".to_string();

    #[cfg(target_os = "android")]
    return "android".to_string();

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux", target_os = "ios", target_os = "android")))]
    return "unknown".to_string();
}

/// Open an external URL using ASWebAuthenticationSession (iOS/macOS) or system browser
/// This is needed for OAuth flows (like Google login) that don't work in WebViews
#[command]
async fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    println!("[ibl.ai] Opening external URL for OAuth: {}", url);
    #[cfg(target_os = "ios")]
    {
        let (tx, rx) = oneshot::channel();
        let url_for_main = url.clone();
        let app_handle = app.clone();
        app.run_on_main_thread(move || {
            let _ = tx.send(open_with_auth_session(&url_for_main, &app_handle));
        })
        .map_err(|e| format!("Failed to schedule auth session: {}", e))?;
        return rx
            .await
            .unwrap_or_else(|_| Err("Failed to open auth session".to_string()));
    }

    #[cfg(not(target_os = "ios"))]
    {
        open_oauth_in_popup(&url, &app)
    }
}

/// Navigate back in the webview history
#[command]
async fn navigate_back(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // Evaluate JavaScript to go back in history
        window
            .eval("window.history.back()")
            .map_err(|e| format!("Failed to navigate back: {}", e))?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

/// Navigate to a specific URL in the webview
#[command]
async fn navigate_to(app: AppHandle, url: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .eval(&format!("window.location.href = '{}'", url))
            .map_err(|e| format!("Failed to navigate: {}", e))?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

/// Proxy a chat request to Ollama
/// This is needed because the app runs on HTTPS but Ollama runs on HTTP (localhost)
/// Browsers block mixed content, so we proxy through Tauri
#[command]
async fn ollama_chat(messages: Vec<serde_json::Value>, model: Option<String>) -> Result<String, String> {
    let model = model.unwrap_or_else(|| "phi3:mini".to_string());
    let ollama_url = "http://localhost:11434/api/chat";

    println!("[SkillsAI] Proxying Ollama chat request with {} messages", messages.len());

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": false
    });

    let response = client
        .post(ollama_url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}. Is Ollama running?", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama returned error {}: {}", status, error_text));
    }

    let response_body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Ollama response: {}", e))?;

    println!("[SkillsAI] Ollama chat response received");
    Ok(response_body)
}

/// Stream a chat request to Ollama (returns chunks via events)
/// For streaming responses, we emit events instead of returning all at once
#[command]
async fn ollama_chat_stream(
    app: AppHandle,
    messages: Vec<serde_json::Value>,
    model: Option<String>,
    generation_id: String,
) -> Result<(), String> {
    let model = model.unwrap_or_else(|| "phi3:mini".to_string());
    let ollama_url = "http://localhost:11434/api/chat";

    println!("[SkillsAI] Proxying Ollama streaming chat request with {} messages", messages.len());

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true
    });

    let response = client
        .post(ollama_url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}. Is Ollama running?", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama returned error {}: {}", status, error_text));
    }

    // Stream the response
    let mut stream = response.bytes_stream();
    let mut full_content = String::new();

    use futures_util::StreamExt;

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let chunk_str = String::from_utf8_lossy(&chunk);
                // Ollama returns newline-delimited JSON
                for line in chunk_str.lines() {
                    if line.trim().is_empty() {
                        continue;
                    }
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                        if let Some(content) = json.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                            full_content.push_str(content);
                            // Emit token event
                            let _ = app.emit("ollama:token", serde_json::json!({
                                "generation_id": generation_id,
                                "token": content,
                                "full_content": full_content
                            }));
                        }
                        if json.get("done").and_then(|d| d.as_bool()).unwrap_or(false) {
                            // Emit done event
                            let _ = app.emit("ollama:done", serde_json::json!({
                                "generation_id": generation_id,
                                "full_content": full_content
                            }));
                            return Ok(());
                        }
                    }
                }
            }
            Err(e) => {
                let _ = app.emit("ollama:error", serde_json::json!({
                    "generation_id": generation_id,
                    "error": format!("Stream error: {}", e)
                }));
                return Err(format!("Stream error: {}", e));
            }
        }
    }

    // If we get here without done=true, still emit done
    let _ = app.emit("ollama:done", serde_json::json!({
        "generation_id": generation_id,
        "full_content": full_content
    }));

    Ok(())
}

/// Get the last skills route
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn get_last_skills_route(app: AppHandle) -> Option<String> {
    // Try memory first
    let storage = get_last_route_storage();
    let lock = storage.read().await;
    if let Some(route) = lock.as_ref() {
        println!("[SkillsAI] Got last skills route from memory: {}", route);
        return Some(route.clone());
    }
    drop(lock);

    // Try file
    let app_data_dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => return None,
    };
    let route_file = app_data_dir.join(LAST_ROUTE_FILE);

    if let Ok(route) = std::fs::read_to_string(&route_file) {
        let route = route.trim().to_string();
        if !route.is_empty() {
            println!("[SkillsAI] Got last skills route from file: {}", route);
            // Store in memory for faster access next time
            let mut lock = storage.write().await;
            *lock = Some(route.clone());
            return Some(route);
        }
    }

    println!("[SkillsAI] No last skills route found");
    None
}

/// Cache an API response for offline use
/// For POST requests, include the request body hash in the cache key
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn cache_api_response(
    _app: AppHandle,
    url: String,
    body: String,
    content_type: String,
    method: Option<String>,
    request_body: Option<String>,
) -> Result<(), String> {
    use crate::web_cache::CacheResponse;
    use sha2::{Digest, Sha256};

    let method = method.unwrap_or_else(|| "GET".to_string());

    // For POST requests, create a cache key that includes method and request body hash
    let cache_key = if method == "POST" {
        if let Some(ref req_body) = request_body {
            let mut hasher = Sha256::new();
            hasher.update(req_body.as_bytes());
            let body_hash = hex::encode(hasher.finalize());
            format!("{}#POST#{}", url, body_hash)
        } else {
            format!("{}#POST", url)
        }
    } else {
        url.clone()
    };

    println!("[SkillsAI] Caching {} response for: {} (key: {})", method, url, cache_key);

    let cache_lock = get_web_cache().read().await;
    if let Some(cache) = cache_lock.as_ref() {
        let response = CacheResponse {
            status: 200,
            content_type,
            headers: std::collections::HashMap::new(),
            body: body.into_bytes(),
        };
        cache.store_response(&cache_key, &response).await;
        println!("[SkillsAI] Cached {} response for: {}", method, url);
        Ok(())
    } else {
        Err("Cache not initialized".to_string())
    }
}

/// Get a cached API response
/// For POST requests, include method and request_body to look up the correct cached response
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[command]
async fn get_cached_api_response(
    url: String,
    method: Option<String>,
    request_body: Option<String>,
) -> Result<Option<String>, String> {
    use sha2::{Digest, Sha256};

    let method = method.unwrap_or_else(|| "GET".to_string());

    // For POST requests, create the same cache key format used when storing
    let cache_key = if method == "POST" {
        if let Some(ref req_body) = request_body {
            let mut hasher = Sha256::new();
            hasher.update(req_body.as_bytes());
            let body_hash = hex::encode(hasher.finalize());
            format!("{}#POST#{}", url, body_hash)
        } else {
            format!("{}#POST", url)
        }
    } else {
        url.clone()
    };

    println!(
        "[SkillsAI] Looking up cached {} response for: {} (key: {})",
        method, url, cache_key
    );

    let cache_lock = get_web_cache().read().await;
    if let Some(cache) = cache_lock.as_ref() {
        if let Some(response) = cache.get_cached(&cache_key).await {
            println!("[SkillsAI] Found cached {} response for: {}", method, url);
            return Ok(Some(String::from_utf8_lossy(&response.body).to_string()));
        }

        // If POST request with body not found, try without body hash (fallback)
        if method == "POST" && request_body.is_some() {
            let fallback_key = format!("{}#POST", url);
            if let Some(response) = cache.get_cached(&fallback_key).await {
                println!(
                    "[SkillsAI] Found cached POST response (fallback) for: {}",
                    url
                );
                return Ok(Some(String::from_utf8_lossy(&response.body).to_string()));
            }
        }
    }

    println!("[SkillsAI] No cached {} response found for: {}", method, url);
    Ok(None)
}

/// JavaScript that monitors URL changes and saves skills routes via Tauri (online mode)
/// Also intercepts fetch requests to cache API responses for offline use
const URL_MONITOR_SCRIPT_ONLINE: &str = r#"
(function() {
    console.log('[SkillsRouteMonitor] Script starting...', {
        alreadyInstalled: window.__mentorRouteMonitorInstalled,
        hasTauri: typeof window.__TAURI__ !== 'undefined',
        location: window.location.href
    });

    // Only run once per page
    if (window.__mentorRouteMonitorInstalled) {
        console.log('[SkillsRouteMonitor] Already installed, skipping');
        return;
    }
    window.__mentorRouteMonitorInstalled = true;

    // Mark as online mode
    window.__TAURI_OFFLINE_MODE__ = false;
    localStorage.setItem('tauri_offline_mode', 'false');

    // Intercept fetch to cache API responses for offline use (GET and POST)
    var originalFetch = window.fetch;
    window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input : (input && input.url ? input.url : (input && input.href ? input.href : String(input)));
        var method = (init && init.method) ? init.method.toUpperCase() : 'GET';
        var requestBody = (init && init.body) ? init.body : null;

        // Only cache when on the skills app domain - prevents errors on auth app
        var isSkillsDomain = window.location.hostname === 'skillsai.iblai.app' ||
                            window.location.hostname === 'skills.iblai.app' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';

        var isApiCall = url.includes('/api/') && (
            url.includes('manager.iblai') ||
            url.includes('learn.iblai') ||
            url.includes('ai-mentor') ||
            url.includes('custom-domains') ||
            url.includes('mentor') ||
            url.includes('tenant') ||
            url.includes('ibl/users') ||
            url.includes('rbac')
        );

        // Also cache JavaScript and CSS chunks for offline use
        var isAsset = url.includes('/_next/static/') || url.includes('/static/');

        // Cache API calls (GET and POST) and static assets (GET only)
        // BUT only when on skills domain and desktop (cache commands not available on mobile)
        var shouldCache = !window.__TAURI_MOBILE__ && isSkillsDomain && (
            (isApiCall && (method === 'GET' || method === 'POST')) ||
            (isAsset && method === 'GET')
        );

        return originalFetch.apply(this, arguments).then(function(response) {
            // Cache successful API responses (both GET and POST)
            if (shouldCache && response.ok) {
                // Clone the response so we can read the body
                var clonedResponse = response.clone();
                clonedResponse.text().then(function(body) {
                    // Cache via Tauri command
                    if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
                        var cacheParams = {
                            url: url,
                            body: body,
                            contentType: response.headers.get('Content-Type') || 'application/json',
                            method: method
                        };

                        // For POST requests, include the request body for cache key generation
                        if (method === 'POST' && requestBody) {
                            // Convert request body to string if it's not already
                            if (typeof requestBody === 'string') {
                                cacheParams.requestBody = requestBody;
                            } else if (requestBody instanceof FormData) {
                                // Skip caching FormData for now (complex to serialize)
                                console.log('[SkillsRouteMonitor] Skipping FormData POST cache for:', url);
                                return;
                            } else {
                                try {
                                    cacheParams.requestBody = JSON.stringify(requestBody);
                                } catch (e) {
                                    cacheParams.requestBody = null;
                                }
                            }
                        }

                        window.__TAURI__.core.invoke('cache_api_response', cacheParams)
                            .then(function() {
                                console.log('[SkillsRouteMonitor] Cached', method, 'response for:', url);
                            })
                            .catch(function(e) {
                                // Silently fail - caching is best effort
                            });
                    }
                });
            }
            return response;
        });
    };

    console.log('[SkillsRouteMonitor] Fetch interceptor installed for API caching (GET + POST)');

    // Cache the current page HTML and assets for offline use
    // Wait for the page to fully load and render before caching
    function cachePageHtml() {
        // precache_app is a desktop-only command, skip on mobile
        if (window.__TAURI_MOBILE__) return;

        console.log('[SkillsRouteMonitor] cachePageHtml called', {
            hasTauri: typeof window.__TAURI__ !== 'undefined',
            hasCore: window.__TAURI__ && typeof window.__TAURI__.core !== 'undefined',
            hasInvoke: window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function'
        });

        if (!window.__TAURI__ || !window.__TAURI__.core || !window.__TAURI__.core.invoke) {
            console.error('[SkillsRouteMonitor] Tauri API not available, cannot cache page');
            return;
        }

        // Only cache when on skills app domain - prevents IPC errors on auth app
        var isSkillsDomain = window.location.hostname === 'skillsai.iblai.app' ||
                            window.location.hostname === 'skills.iblai.app' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';

        if (!isSkillsDomain) {
            console.log('[SkillsRouteMonitor] Not on skills domain, skipping page cache');
            return;
        }

        var currentUrl = window.location.href;
        console.log('[SkillsRouteMonitor] Starting precache for:', currentUrl);

        // Use the precache_app command which caches both HTML and assets
        window.__TAURI__.core.invoke('precache_app', {
            url: currentUrl
        }).then(function(result) {
            console.log('[SkillsRouteMonitor] Pre-cache complete:', result);
        }).catch(function(e) {
            console.error('[SkillsRouteMonitor] Pre-cache failed:', e);
        });
    }

    // Wait for Next.js to finish rendering before caching HTML
    // Try multiple approaches to ensure we cache after the page is ready
    console.log('[SkillsRouteMonitor] Setting up page load handlers, readyState:', document.readyState);

    if (document.readyState === 'complete') {
        // Page already loaded, wait a bit for React to hydrate
        console.log('[SkillsRouteMonitor] Page already complete, scheduling cache in 2s');
        setTimeout(cachePageHtml, 2000);
    } else {
        // Wait for load event, then wait for React hydration
        console.log('[SkillsRouteMonitor] Waiting for load event');
        window.addEventListener('load', function() {
            console.log('[SkillsRouteMonitor] Load event fired, scheduling cache in 2s');
            setTimeout(cachePageHtml, 2000);
        });
    }

    var MENTOR_ROUTE_PATTERN = /^\/platform\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
    var lastSavedRoute = null;

    // Save offline context (localStorage snapshot) for offline mode
    function saveOfflineContext() {
        // save_offline_context is a desktop-only command, skip on mobile
        if (window.__TAURI_MOBILE__) return;
        if (!window.__TAURI__ || !window.__TAURI__.core) return;

        // Only save when on skills app domain - prevents IPC errors on auth app
        var isSkillsDomain = window.location.hostname === 'skillsai.iblai.app' ||
                            window.location.hostname === 'skills.iblai.app' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';

        if (!isSkillsDomain) {
            console.log('[SkillsRouteMonitor] Not on skills domain, skipping offline context save');
            return;
        }

        try {
            // Collect important localStorage keys for offline mode
            var keysToSave = [
                'axd_token', 'dm_token', 'axd_token_expires', 'dm_token_expires',
                'user_data', 'username', 'tenant', 'current_tenant', 'tenants',
                'user_object', 'auth', 'ibl_user', 'visiting_tenant'
            ];

            var context = {};
            for (var i = 0; i < keysToSave.length; i++) {
                var value = localStorage.getItem(keysToSave[i]);
                if (value) {
                    context[keysToSave[i]] = value;
                }
            }

            // Also save any ibl-related keys
            for (var j = 0; j < localStorage.length; j++) {
                var key = localStorage.key(j);
                if (key && (key.indexOf('ibl') !== -1 || key.indexOf('token') !== -1 || key.indexOf('user') !== -1)) {
                    context[key] = localStorage.getItem(key);
                }
            }

            var contextStr = JSON.stringify(context);
            window.__TAURI__.core.invoke('save_offline_context', { context: contextStr })
                .then(function() {
                    console.log('[SkillsRouteMonitor] Offline context saved (' + Object.keys(context).length + ' keys)');
                })
                .catch(function(e) {
                    console.error('[SkillsRouteMonitor] Failed to save offline context:', e);
                });
        } catch (e) {
            console.error('[SkillsRouteMonitor] Error saving offline context:', e);
        }
    }

    function saveSkillsRoute(route) {
        // save_last_skills_route is a desktop-only command, skip on mobile
        if (window.__TAURI_MOBILE__) return;
        if (route === lastSavedRoute) return;
        lastSavedRoute = route;

        console.log('[SkillsRouteMonitor] Saving route:', route);

        // Only save when on skills app domain - prevents IPC errors on auth app
        var isSkillsDomain = window.location.hostname === 'skillsai.iblai.app' ||
                            window.location.hostname === 'skills.iblai.app' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';

        if (!isSkillsDomain) {
            console.log('[SkillsRouteMonitor] Not on skills domain, skipping route save');
            return;
        }

        if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
            window.__TAURI__.core.invoke('save_last_skills_route', { route: route })
                .then(function() {
                    console.log('[SkillsRouteMonitor] Route saved successfully');
                    // Also save the offline context when we save a route
                    saveOfflineContext();
                })
                .catch(function(e) {
                    console.error('[SkillsRouteMonitor] Failed to save route:', e);
                });
        }
    }

    function checkAndSaveRoute() {
        var path = window.location.pathname;
        var match = path.match(MENTOR_ROUTE_PATTERN);
        if (match) {
            // Extract route without query params
            var route = '/platform/' + match[1] + '/' + match[2];
            saveSkillsRoute(route);
        }
    }

    // Check on load
    checkAndSaveRoute();

    // Monitor for SPA navigation (history changes)
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        setTimeout(checkAndSaveRoute, 100);
    };

    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        setTimeout(checkAndSaveRoute, 100);
    };

    window.addEventListener('popstate', function() {
        setTimeout(checkAndSaveRoute, 100);
    });

    // Also check periodically in case of any missed navigations
    setInterval(checkAndSaveRoute, 5000);

    console.log('[SkillsRouteMonitor] Installed (online mode) - monitoring URL changes');
})();
"#;

/// JavaScript for offline mode - intercepts fetch calls and routes API calls through offline server
/// CRITICAL: This script must restore localStorage context BEFORE the app initializes
const URL_MONITOR_SCRIPT_OFFLINE: &str = r#"
(function() {
    // Only run once per page
    if (window.__mentorRouteMonitorInstalled) return;
    window.__mentorRouteMonitorInstalled = true;

    // Mark as offline mode FIRST - critical for the app to skip auth checks
    window.__TAURI_OFFLINE_MODE__ = true;
    localStorage.setItem('tauri_offline_mode', 'true');

    var OFFLINE_SERVER = 'http://127.0.0.1:3456';

    // Override __ENV__ to route API calls through our offline server
    window.__ENV__ = window.__ENV__ || {};
    window.__ENV__.NEXT_PUBLIC_API_BASE_URL = OFFLINE_SERVER;

    console.log('[OfflineMode] Starting offline mode initialization...');

    // CRITICAL: Restore localStorage context from saved file
    // This runs synchronously to ensure data is available before app initialization
    function restoreOfflineContext() {
        console.log('[OfflineMode] Checking for saved offline context...');

        // We need to wait for Tauri to be ready
        function waitForTauri(callback, maxAttempts) {
            maxAttempts = maxAttempts || 50;
            var attempts = 0;

            function check() {
                attempts++;
                if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
                    console.log('[OfflineMode] Tauri ready after', attempts, 'attempts');
                    callback();
                } else if (attempts < maxAttempts) {
                    setTimeout(check, 100);
                } else {
                    console.error('[OfflineMode] Tauri not available after', maxAttempts, 'attempts');
                }
            }
            check();
        }

        waitForTauri(function() {
            window.__TAURI__.core.invoke('get_offline_context')
                .then(function(contextStr) {
                    if (!contextStr) {
                        console.warn('[OfflineMode] No saved offline context found');
                        return;
                    }

                    try {
                        var context = JSON.parse(contextStr);
                        var restoredCount = 0;

                        // Restore all saved localStorage keys
                        for (var key in context) {
                            if (context.hasOwnProperty(key)) {
                                var existingValue = localStorage.getItem(key);
                                // Only restore if the value doesn't exist or is different
                                if (!existingValue || existingValue !== context[key]) {
                                    localStorage.setItem(key, context[key]);
                                    restoredCount++;
                                    console.log('[OfflineMode] Restored localStorage key:', key);
                                }
                            }
                        }

                        console.log('[OfflineMode] Restored', restoredCount, 'localStorage keys from offline context');

                        // Dispatch a custom event to notify the app that context is ready
                        window.dispatchEvent(new CustomEvent('offlineContextRestored', { detail: { count: restoredCount } }));

                    } catch (e) {
                        console.error('[OfflineMode] Error parsing offline context:', e);
                    }
                })
                .catch(function(e) {
                    console.error('[OfflineMode] Error loading offline context:', e);
                });
        });
    }

    // Start context restoration immediately
    restoreOfflineContext();

    // CRITICAL: Intercept ALL fetch calls and redirect external API calls to offline server
    var originalFetch = window.fetch;
    window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');

        // Check if this is an API call to external services
        var apiPatterns = [
            'base.manager.iblai.app',
            'base.manager.iblai.org',
            'api.iblai.app',
            'api.iblai.org',
            'learn.iblai.app',
            'learn.iblai.org'
        ];

        var isExternalApi = apiPatterns.some(function(pattern) {
            return url.indexOf(pattern) !== -1;
        });

        if (isExternalApi && url.indexOf('/api/') !== -1) {
            // Extract the path from the URL and redirect to offline server
            try {
                var urlObj = new URL(url);
                var newUrl = OFFLINE_SERVER + urlObj.pathname + urlObj.search;
                console.log('[OfflineMode] Redirecting API call:', url, '->', newUrl);

                // Create new input with redirected URL
                if (typeof input === 'string') {
                    input = newUrl;
                } else if (input && input.url) {
                    input = new Request(newUrl, input);
                }
            } catch (e) {
                console.error('[OfflineMode] Error redirecting URL:', e);
            }
        }

        return originalFetch.call(this, input, init);
    };

    console.log('[OfflineMode] Fetch interceptor installed, API calls routed to:', OFFLINE_SERVER);

    // Save route same as online mode
    var MENTOR_ROUTE_PATTERN = /^\/platform\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;

    function checkAndSaveRoute() {
        var path = window.location.pathname;
        var match = path.match(MENTOR_ROUTE_PATTERN);
        if (match) {
            var route = '/platform/' + match[1] + '/' + match[2];
            if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
                window.__TAURI__.core.invoke('save_last_skills_route', { route: route }).catch(function() {});
            }
        }
    }

    checkAndSaveRoute();

    console.log('[OfflineMode] Initialization complete');
})();
"#;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env file if present (for local development and custom builds)
    // First try current directory (dev mode), then try next to the executable (bundled app)
    if dotenvy::dotenv().is_err() {
        // Try loading from executable directory (for bundled apps)
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let env_path = exe_dir.join(".env");
                if env_path.exists() {
                    println!("[SkillsAI] Loading .env from: {:?}", env_path);
                    let _ = dotenvy::from_path(&env_path);
                }
            }
        }
    }

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let app_url = get_app_url();

            #[cfg(any(target_os = "ios", target_os = "android"))]
            {
                let app_handle = app.handle().clone();
                if let Ok(Some(urls)) = app.deep_link().get_current() {
                    for url in urls {
                        handle_deep_link_url(&app_handle, url.as_str());
                    }
                }

                let app_handle = app.handle().clone();
                app.listen("deep-link://new-url", move |event: tauri::Event| {
                    if let Ok(urls) = serde_json::from_str::<Vec<String>>(event.payload()) {
                        for url in urls {
                            handle_deep_link_url(&app_handle, &url);
                        }
                    }
                });
            }

            // =====================
            // DESKTOP SETUP (Windows, macOS, Linux)
            // =====================
            #[cfg(not(any(target_os = "ios", target_os = "android")))]
            {
                // Initialize web cache with app data directory
                let app_data_dir = app
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data directory");

                // Ensure app data directory exists
                if let Err(e) = std::fs::create_dir_all(&app_data_dir) {
                    println!("[SkillsAI] Failed to create app data dir: {}", e);
                }

                let cache = WebCache::new(app_data_dir.clone());

                // Store cache in global state
                let cache_holder = get_web_cache();
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    let mut lock = cache_holder.write().await;
                    *lock = Some(cache);
                });

                // Start the offline HTTP server in a background thread
                let cache_for_server = get_web_cache().clone();
                std::thread::spawn(move || {
                    println!("[SkillsAI] Starting offline server thread...");
                    match tokio::runtime::Runtime::new() {
                        Ok(rt) => {
                            println!("[SkillsAI] Tokio runtime created, starting server...");
                            rt.block_on(async {
                                start_offline_server(cache_for_server).await;
                            });
                            println!("[SkillsAI] Server exited");
                        }
                        Err(e) => {
                            println!("[SkillsAI] Failed to create tokio runtime: {}", e);
                        }
                    }
                });

                // Give the server a moment to start
                std::thread::sleep(std::time::Duration::from_millis(500));
                println!("[SkillsAI] Offline server should be running at {}", get_server_url());

                // Check network status to decide initial URL
                let is_online = reqwest::blocking::Client::builder()
                    .timeout(std::time::Duration::from_secs(3))
                    .build()
                    .ok()
                    .and_then(|client| {
                        client.head(&app_url)
                            .send()
                            .ok()
                    })
                    .is_some();

                println!("[SkillsAI] Network check: is_online = {} (checking {})", is_online, app_url);

                // Determine initial URL
                let initial_url = if is_online {
                    // Online - go directly to the app
                    tauri::WebviewUrl::External(app_url.parse().unwrap())
                } else {
                    // Offline - check for last skills route and use offline server
                    let rt = tokio::runtime::Runtime::new().unwrap();
                    let last_route = rt.block_on(async {
                        let storage = get_last_route_storage();
                        let lock = storage.read().await;
                        lock.clone()
                    });

                    // Try to read from file if not in memory
                    let route = last_route.or_else(|| {
                        let route_file = app_data_dir.join(LAST_ROUTE_FILE);
                        std::fs::read_to_string(&route_file)
                            .ok()
                            .map(|r| r.trim().to_string())
                            .filter(|r| !r.is_empty())
                    });

                    let offline_url = match route {
                        Some(r) => format!("http://127.0.0.1:3456{}", r),
                        None => "http://127.0.0.1:3456".to_string(),
                    };
                    println!("[SkillsAI] Using offline URL: {}", offline_url);
                    tauri::WebviewUrl::External(offline_url.parse().unwrap())
                };

                let app_handle = app.handle().clone();

                // Create main window with appropriate URL monitoring script
                let init_script = if is_online {
                    URL_MONITOR_SCRIPT_ONLINE
                } else {
                    URL_MONITOR_SCRIPT_OFFLINE
                };

                let _window = tauri::WebviewWindowBuilder::new(
                    app,
                    "main",
                    initial_url,
                )
                .title("SkillsAI")
                .inner_size(1200.0, 800.0)
                .min_inner_size(800.0, 600.0)
                .maximized(true)
                .center()
                .initialization_script(init_script)
                .on_navigation(move |url| {
                    let url_str = url.as_str();
                    println!("[IBL Skills] [DESKTOP] on_navigation: {}", url_str);
                    if is_oauth_url(url_str) {
                        println!("[IBL Skills] [DESKTOP] OAuth URL detected, opening in popup: {}", url_str);
                        if let Err(e) = open_oauth_in_popup(url_str, &app_handle) {
                            println!("[IBL Skills] [DESKTOP] Failed to open OAuth popup: {}", e);
                            return true; // Allow navigation as last resort
                        }
                        return false; // Prevent webview navigation in main window
                    }
                    true
                })
                .build()
                .expect("Failed to create main window");

                println!("[SkillsAI] Main window created with URL monitor script (online={})", is_online);
            }

            // =====================
            // MOBILE SETUP (iOS, Android)
            // =====================
            #[cfg(any(target_os = "ios", target_os = "android"))]
            {
                println!("[IBL Skills] Mobile platform detected, using simplified setup");

                // On mobile, always go to the online app URL
                let initial_url = tauri::WebviewUrl::External(app_url.parse().unwrap());
                let app_base_url_json = serde_json::to_string(&app_url).unwrap();

                // Safe area handling script for iOS - ensures content doesn't scroll behind notch/home indicator
                // Also handles Google OAuth by opening in system browser
                let safe_area_script = r#"
(function() {
    // Only run once
    if (window.__safeAreaSetup) return;
    window.__safeAreaSetup = true;

    var appBaseUrl = __IBL_APP_BASE_URL__;

    console.log('[IBL Skills] Setting up safe area handling...');

    // Wait for document.head to be available before DOM operations
    function waitForHead(callback) {
        if (document.head) {
            callback();
        } else {
            setTimeout(function() { waitForHead(callback); }, 10);
        }
    }

    // DOM setup deferred until document.head is available
    waitForHead(function() {

    // Add CSS for safe area handling
    var style = document.createElement('style');
    style.id = 'ibl-safe-area-styles';
    style.textContent = `
        /* Safe area support for iOS */
        :root {
            --sat: env(safe-area-inset-top, 0px);
            --sar: env(safe-area-inset-right, 0px);
            --sab: env(safe-area-inset-bottom, 0px);
            --sal: env(safe-area-inset-left, 0px);
        }

        /* Apply safe area padding to html/body */
        html {
            padding-top: env(safe-area-inset-top, 0px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
            padding-left: env(safe-area-inset-left, 0px);
            padding-right: env(safe-area-inset-right, 0px);
        }

        body {
            /* Ensure body doesn't scroll the entire page */
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
        }

        /* Main app container should fill the safe area */
        body > div:first-child,
        #__next,
        #root,
        [data-radix-portal],
        main {
            height: 100%;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* Ensure fixed elements respect safe areas */
        [style*="position: fixed"],
        [style*="position:fixed"] {
            padding-top: env(safe-area-inset-top, 0px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
        }

    `;
    document.head.appendChild(style);
    console.log('[IBL Skills] Safe area CSS applied');
    }); // end waitForHead

    // Wait for document.body before adding body event listeners
    function waitForBody(callback) {
        if (document.body) {
            callback();
        } else {
            setTimeout(function() { waitForBody(callback); }, 10);
        }
    }

    waitForBody(function() {
        // Prevent overscroll/bounce effect on iOS
        document.body.addEventListener('touchmove', function(e) {
            // Allow scrolling within scrollable elements
            var target = e.target;
            while (target && target !== document.body) {
                var style = window.getComputedStyle(target);
                if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                    style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    return; // Allow scroll within this element
                }
                target = target.parentElement;
            }
            // Prevent bounce on body
            e.preventDefault();
        }, { passive: false });

        console.log('[IBL Skills] Safe area setup complete');
    }); // end waitForBody

    // =====================
    // GOOGLE OAUTH HANDLING
    // =====================
    // Google blocks OAuth in WebViews, so we need to open Google login in the system browser
    // The app uses window.location.href = provider.url to redirect, so we need to intercept that

    function isOAuthUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return (
            url.includes('accounts.google.com') ||
            url.includes('google.com/o/oauth') ||
            url.includes('googleapis.com/oauth') ||
            url.includes('/auth/login/google') ||
            url.includes('/login/google') ||
            url.includes('google-oauth2') ||
            url.includes('appleid.apple.com') ||
            url.includes('/auth/login/apple') ||
            url.includes('/login/apple')
        );
    }

    function openInSystemBrowser(url) {
        console.log('[IBL Skills] Opening OAuth URL via ASWebAuthenticationSession:', url);

        var invoker = null;

        // Primary: window.__TAURI__ (available when withGlobalTauri: true)
        if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
            console.log('[IBL Skills] IPC: using window.__TAURI__.core.invoke');
            invoker = window.__TAURI__.core.invoke.bind(window.__TAURI__.core);
        }
        // Fallback: window.__TAURI_INTERNALS__ (always available in any Tauri webview)
        else if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.transformCallback && window.__TAURI_INTERNALS__.postMessage) {
            console.log('[IBL Skills] IPC: using __TAURI_INTERNALS__ raw IPC (withGlobalTauri may be missing)');
            invoker = function(cmd, payload) {
                return new Promise(function(resolve, reject) {
                    var cb = window.__TAURI_INTERNALS__.transformCallback(resolve, true);
                    var err = window.__TAURI_INTERNALS__.transformCallback(reject, true);
                    window.__TAURI_INTERNALS__.postMessage({
                        cmd: cmd,
                        callback: cb,
                        error: err,
                        payload: payload || {}
                    });
                });
            };
        }

        if (invoker) {
            invoker('open_external_url', { url: url })
                .then(function() {
                    console.log('[IBL Skills] Successfully opened URL via ASWebAuthenticationSession');
                })
                .catch(function(e) {
                    console.error('[IBL Skills] Failed to open URL:', e);
                });
            return true;
        }

        console.error('[IBL Skills] No Tauri IPC available - cannot intercept OAuth URL');
        return false;
    }

    // CRITICAL: Intercept window.location.href assignments
    // This is how the auth app redirects to OAuth providers
    (function() {
        var currentHref = window.location.href;

        // Create a proxy for location to intercept href changes
        var locationProxy = {
            get href() {
                return currentHref;
            },
            set href(url) {
                console.log('[IBL Skills] Intercepted location.href =', url);
                if (isOAuthUrl(url)) {
                    console.log('[IBL Skills] Detected OAuth redirect, opening in system browser');
                    // Make URL absolute if relative
                    var absoluteUrl = url;
                    if (url.startsWith('/')) {
                        absoluteUrl = window.location.origin + url;
                    }
                    openInSystemBrowser(absoluteUrl);
                    // Don't actually navigate - we opened in external browser
                    return;
                }
                // Allow normal navigation
                currentHref = url;
                Object.getOwnPropertyDescriptor(window, 'location').set.call(window, url);
            },
            get origin() { return window.location.origin; },
            get protocol() { return window.location.protocol; },
            get host() { return window.location.host; },
            get hostname() { return window.location.hostname; },
            get port() { return window.location.port; },
            get pathname() { return window.location.pathname; },
            get search() { return window.location.search; },
            get hash() { return window.location.hash; },
            assign: function(url) {
                console.log('[IBL Skills] Intercepted location.assign()', url);
                if (isOAuthUrl(url)) {
                    var absoluteUrl = url.startsWith('/') ? window.location.origin + url : url;
                    openInSystemBrowser(absoluteUrl);
                    return;
                }
                window.location.assign(url);
            },
            replace: function(url) {
                console.log('[IBL Skills] Intercepted location.replace()', url);
                if (isOAuthUrl(url)) {
                    var absoluteUrl = url.startsWith('/') ? window.location.origin + url : url;
                    openInSystemBrowser(absoluteUrl);
                    return;
                }
                window.location.replace(url);
            },
            reload: function() { window.location.reload(); },
            toString: function() { return window.location.toString(); }
        };

        // Try to override window.location (may not work in all browsers)
        try {
            // This approach works better: intercept direct href setting via defineProperty
            var originalLocation = window.location;

            // Wrap the location object's href setter
            var hrefDescriptor = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
            if (hrefDescriptor && hrefDescriptor.set) {
                var originalHrefSetter = hrefDescriptor.set;
                Object.defineProperty(Location.prototype, 'href', {
                    get: hrefDescriptor.get,
                    set: function(url) {
                        console.log('[IBL Skills] Location.href setter intercepted:', url);
                        if (isOAuthUrl(url)) {
                            console.log('[IBL Skills] OAuth URL detected, redirecting to system browser');
                            var absoluteUrl = url;
                            if (url.startsWith('/')) {
                                absoluteUrl = this.origin + url;
                            }
                            if (openInSystemBrowser(absoluteUrl)) {
                                return; // Prevent WebView navigation
                            }
                        }
                        // Normal navigation
                        originalHrefSetter.call(this, url);
                    },
                    configurable: true,
                    enumerable: true
                });
                console.log('[IBL Skills] Location.href setter intercepted successfully');
            }

            // Also intercept assign and replace
            var originalAssign = Location.prototype.assign;
            Location.prototype.assign = function(url) {
                console.log('[IBL Skills] location.assign() intercepted:', url);
                if (isOAuthUrl(url)) {
                    var absoluteUrl = url.startsWith('/') ? this.origin + url : url;
                    if (openInSystemBrowser(absoluteUrl)) return;
                }
                originalAssign.call(this, url);
            };

            var originalReplace = Location.prototype.replace;
            Location.prototype.replace = function(url) {
                console.log('[IBL Skills] location.replace() intercepted:', url);
                if (isOAuthUrl(url)) {
                    var absoluteUrl = url.startsWith('/') ? this.origin + url : url;
                    if (openInSystemBrowser(absoluteUrl)) return;
                }
                originalReplace.call(this, url);
            };

        } catch (e) {
            console.error('[IBL Skills] Failed to intercept location:', e);
        }
    })();

    // Also intercept window.open for OAuth popups
    var originalWindowOpen = window.open;
    window.open = function(url, target, features) {
        console.log('[IBL Skills] window.open() intercepted:', url);
        if (url && isOAuthUrl(url)) {
            var absoluteUrl = url;
            if (url.startsWith('/')) {
                absoluteUrl = window.location.origin + url;
            }
            if (openInSystemBrowser(absoluteUrl)) {
                return null; // Return null as if popup was blocked
            }
        }
        return originalWindowOpen.call(window, url, target, features);
    };

    // Click interceptor as backup for buttons that might trigger OAuth
    document.addEventListener('click', function(e) {
        var target = e.target;
        var depth = 0;

        while (target && depth < 10) {
            // Check for links with OAuth URLs
            if (target.tagName === 'A' && target.href && isOAuthUrl(target.href)) {
                e.preventDefault();
                e.stopPropagation();
                openInSystemBrowser(target.href);
                return false;
            }
            target = target.parentElement;
            depth++;
        }
    }, true);

    console.log('[IBL Skills] OAuth interceptor installed (location.href + window.open + click)');

    console.log('[IBL Skills] Mobile setup complete (safe area + OAuth)');
})();
"#;
                let safe_area_script =
                    safe_area_script.replace("__IBL_APP_BASE_URL__", &app_base_url_json);

                // Combine safe area script with online monitoring script
                // Set mobile flag so desktop-only IPC commands (precache_app, cache_api_response, etc.) are skipped
                let combined_script = format!("window.__TAURI_MOBILE__ = true;\n{}\n{}", safe_area_script, URL_MONITOR_SCRIPT_ONLINE);
                let app_handle = app.handle().clone();

                // Use online monitoring script with safe area handling
                let window = tauri::WebviewWindowBuilder::new(
                    app,
                    "main",
                    initial_url,
                )
                .initialization_script(&combined_script)
                .on_navigation(move |url| {
                    let url_str = url.as_str();
                    println!("[IBL Skills] [MOBILE] on_navigation: {}", url_str);
                    let is_oauth = is_oauth_url(url_str);
                    println!("[IBL Skills] [MOBILE] is_oauth_url: {}", is_oauth);
                    if is_oauth {
                        println!("[IBL Skills] [MOBILE] OAuth navigation intercepted, opening ASWebAuthenticationSession: {}", url_str);
                        if let Err(e) = open_oauth_url(&app_handle, url_str) {
                            println!("[IBL Skills] [MOBILE] Failed to open auth session: {} — blocking navigation anyway", e);
                        }
                        return false;
                    }
                    true
                })
                .build()
                .expect("Failed to create main window");

                if let Ok(mut pending) = get_pending_deep_link().lock() {
                    if let Some(pending_url) = pending.take() {
                        if let Ok(js_url) = serde_json::to_string(&pending_url) {
                            let _ = window.eval(&format!("window.location.href = {};", js_url));
                        }
                    }
                }

                println!("[IBL Skills] Mobile window created with safe area support");
            }

            Ok(())
        });

        // Register the custom URI scheme protocol for offline cache (desktop only)
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        let builder = builder.register_asynchronous_uri_scheme_protocol("mentor", |ctx, request, responder| {
            // Extract the URL path - format: mentor://fetch/<encoded_url>
            let uri = request.uri();
            let path = uri.path();

            // Handle the fetch protocol
            if path.starts_with("/fetch/") {
                let encoded_url = &path[7..]; // Skip "/fetch/"
                let url = match urlencoding::decode(encoded_url) {
                    Ok(u) => u.to_string(),
                    Err(_) => {
                        responder.respond(
                            http::Response::builder()
                                .status(http::StatusCode::BAD_REQUEST)
                                .body(b"Invalid URL encoding".to_vec())
                                .unwrap(),
                        );
                        return;
                    }
                };

                // Get app handle for accessing cache (unused but kept for future use)
                let _app = ctx.app_handle().clone();

                std::thread::spawn(move || {
                    let rt = tokio::runtime::Runtime::new().unwrap();
                    rt.block_on(async {
                        let cache_lock = get_web_cache().read().await;
                        if let Some(cache) = cache_lock.as_ref() {
                            match cache.fetch(&url).await {
                                Ok(response) => {
                                    let mut builder = http::Response::builder()
                                        .status(response.status)
                                        .header("Content-Type", response.content_type);

                                    // Add CORS headers to allow the shell to access
                                    builder = builder
                                        .header("Access-Control-Allow-Origin", "*")
                                        .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                                        .header("Access-Control-Allow-Headers", "*");

                                    responder.respond(builder.body(response.body).unwrap());
                                }
                                Err(e) => {
                                    responder.respond(
                                        http::Response::builder()
                                            .status(http::StatusCode::SERVICE_UNAVAILABLE)
                                            .header("Content-Type", "application/json")
                                            .body(
                                                format!(
                                                    r#"{{"error": "{}",  "offline": true}}"#,
                                                    e.replace('"', "\\\"")
                                                )
                                                .into_bytes(),
                                            )
                                            .unwrap(),
                                    );
                                }
                            }
                        } else {
                            responder.respond(
                                http::Response::builder()
                                    .status(http::StatusCode::INTERNAL_SERVER_ERROR)
                                    .body(b"Cache not initialized".to_vec())
                                    .unwrap(),
                            );
                        }
                    });
                });
            } else {
                responder.respond(
                    http::Response::builder()
                        .status(http::StatusCode::NOT_FOUND)
                        .body(b"Not found".to_vec())
                        .unwrap(),
                );
            }
        });

        // Desktop platforms get all commands including offline/cache features
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        let builder = builder.invoke_handler(tauri::generate_handler![
            install_ollama,
            check_ollama_status,
            check_disk_space_for_model,
            download_phi3_model,
            cancel_model_download,
            check_network_status,
            set_cache_online_status,
            clear_web_cache,
            get_web_cache_stats,
            get_offline_server_url,
            is_offline_server_ready,
            precache_app,
            save_last_skills_route,
            get_last_skills_route,
            cache_api_response,
            get_cached_api_response,
            save_offline_context,
            get_offline_context,
            get_os_type,
            open_external_url,
            navigate_back,
            navigate_to,
            ollama_chat,
            ollama_chat_stream,
        ]);

        // Mobile platforms get only basic commands (no offline/cache features)
        #[cfg(any(target_os = "ios", target_os = "android"))]
        let builder = builder.invoke_handler(tauri::generate_handler![
            install_ollama,
            check_ollama_status,
            check_disk_space_for_model,
            download_phi3_model,
            cancel_model_download,
            check_network_status,
            get_os_type,
            open_external_url,
            navigate_back,
            navigate_to,
            ollama_chat,
            ollama_chat_stream,
        ]);

        builder.run(tauri::generate_context!())
            .expect("error while running tauri app");
}
