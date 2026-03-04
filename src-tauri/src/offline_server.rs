use axum::{
    body::{Body, Bytes},
    extract::{Path, State},
    http::{header, Response, StatusCode},
    response::IntoResponse,
    routing::get,
    Router,
};
use sha2::{Digest, Sha256};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};

use crate::web_cache::WebCache;

const OFFLINE_SERVER_PORT: u16 = 3456;

/// Get the app origin URL for cache lookups
/// Uses TAURI_APP_URL env var, with sensible defaults
fn get_app_origin() -> String {
    // First check environment variable
    if let Ok(url) = std::env::var("TAURI_APP_URL") {
        return url;
    }

    // Default: localhost for debug, production URL for release
    #[cfg(debug_assertions)]
    return "https://skillsai.iblai.app".to_string();

    #[cfg(not(debug_assertions))]
    return "https://skillsai.iblai.app".to_string();
}

#[derive(Clone)]
struct AppState {
    cache: Arc<RwLock<Option<WebCache>>>,
    app_origin: String,
}

/// Start the offline HTTP server
pub async fn start_offline_server(cache: Arc<RwLock<Option<WebCache>>>) {
    println!("[OfflineServer] start_offline_server called");

    let app_origin = get_app_origin();
    println!("[OfflineServer] Using app origin for cache lookups: {}", app_origin);

    let state = AppState { cache, app_origin };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/_health", get(health_check))
        .route("/", get(serve_index))
        .route("/{*path}", get(serve_file).post(handle_post_with_body))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], OFFLINE_SERVER_PORT));
    println!("[OfflineServer] Attempting to bind to http://{}", addr);

    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(l) => {
            println!("[OfflineServer] Successfully bound to port {}", OFFLINE_SERVER_PORT);
            l
        }
        Err(e) => {
            println!("[OfflineServer] Failed to bind to port {}: {}", OFFLINE_SERVER_PORT, e);
            return;
        }
    };

    println!("[OfflineServer] Server is now listening on http://{}", addr);

    if let Err(e) = axum::serve(listener, app).await {
        println!("[OfflineServer] Server error: {}", e);
    }

    println!("[OfflineServer] Server stopped");
}

async fn health_check() -> impl IntoResponse {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/plain")
        .body(Body::from("ok"))
        .unwrap()
}

async fn serve_index(State(state): State<AppState>) -> impl IntoResponse {
    let app_origin = &state.app_origin;
    serve_cached_url(&state, app_origin).await
}

async fn serve_file(
    State(state): State<AppState>,
    Path(path): Path<String>,
) -> impl IntoResponse {
    // URL-decode the path to handle encoded characters like %5B ([) and %5D (])
    // This is critical for matching Next.js dynamic routes like [tenantKey]/[mentorId]
    let decoded_path = urlencoding::decode(&path).unwrap_or(std::borrow::Cow::Borrowed(&path));
    let decoded_path = decoded_path.as_ref();

    // Handle API routes specially - check cache first, then return mock responses
    if decoded_path.starts_with("api/") {
        return handle_api_offline_with_cache(&state, decoded_path).await;
    }

    // Check if this is a static asset or a page route
    let is_static_asset = decoded_path.starts_with("_next/")
        || decoded_path.starts_with("static/")
        || decoded_path.contains('.')
        || decoded_path == "env.js"
        || decoded_path == "favicon.ico";

    let app_origin = &state.app_origin;

    if is_static_asset {
        // Serve static assets directly
        // IMPORTANT: Use the ORIGINAL encoded path for cache lookup, not the decoded path!
        // The cache stores URLs exactly as they appear in the HTML (with %5B, %5D, etc.)
        let url = format!("{}/{}", app_origin, path);
        println!("[OfflineServer] Static asset request: {} (decoded would be: /{}, using original for cache)", url, decoded_path);
        serve_cached_url(&state, &url).await
    } else {
        // For page routes (SPA), try to serve the cached HTML for the specific route first
        // This ensures Next.js has the correct initial state with route params
        let route_url = format!("{}/{}", app_origin, decoded_path);
        println!("[OfflineServer] SPA route detected: /{}, trying route-specific HTML first (original: {})", decoded_path, path);

        // Check if we have cached HTML for this specific route
        let cache_guard = state.cache.read().await;
        let has_route_html = if let Some(cache) = cache_guard.as_ref() {
            cache.get_cached(&route_url).await.is_some()
        } else {
            false
        };
        drop(cache_guard);

        if has_route_html {
            println!("[OfflineServer] Found cached HTML for route: {}", route_url);
            serve_cached_url(&state, &route_url).await
        } else {
            // Fall back to main page HTML - Next.js will handle client-side routing
            println!("[OfflineServer] No route-specific HTML, falling back to main page");
            serve_cached_url(&state, app_origin).await
        }
    }
}

/// Handle POST requests with body - needed for RBAC permissions check and other POST APIs
/// This extracts the request body to use for cache key lookup
async fn handle_post_with_body(
    State(state): State<AppState>,
    Path(path): Path<String>,
    body: Bytes,
) -> impl IntoResponse {
    let body_str = String::from_utf8_lossy(&body).to_string();
    println!(
        "[OfflineServer] POST request in offline mode: /{} (body: {} bytes)",
        path,
        body_str.len()
    );

    // Handle API routes
    if path.starts_with("api/") {
        return handle_post_api_offline_with_cache(&state, &path, &body_str).await;
    }

    // For non-API POST requests, return method not allowed
    Response::builder()
        .status(StatusCode::METHOD_NOT_ALLOWED)
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(Body::from(
            r#"{"error":"POST not supported for this path in offline mode"}"#,
        ))
        .unwrap()
}

/// Handle POST API requests in offline mode
/// First tries to find cached response, then falls back to mock responses
async fn handle_post_api_offline_with_cache(
    state: &AppState,
    path: &str,
    request_body: &str,
) -> Response<Body> {
    println!(
        "[OfflineServer] POST API request in offline mode: /{}",
        path
    );

    // Generate cache key with body hash (same format as in main.rs caching)
    let body_hash = {
        let mut hasher = Sha256::new();
        hasher.update(request_body.as_bytes());
        hex::encode(hasher.finalize())
    };

    // Try to find cached POST response
    let cache_guard = state.cache.read().await;
    if let Some(cache) = cache_guard.as_ref() {
        // Log cached POST URLs for debugging (first request only)
        static LOGGED_POST_CACHE: std::sync::atomic::AtomicBool =
            std::sync::atomic::AtomicBool::new(false);
        if !LOGGED_POST_CACHE.load(std::sync::atomic::Ordering::Relaxed) {
            LOGGED_POST_CACHE.store(true, std::sync::atomic::Ordering::Relaxed);
            let cached_urls = cache.get_cached_urls().await;
            println!(
                "[OfflineServer] === CACHED POST URLs ({} total) ===",
                cached_urls.len()
            );
            for url in &cached_urls {
                if url.contains("#POST") {
                    println!("[OfflineServer]   {}", url);
                }
            }
            println!("[OfflineServer] === END CACHED POST URLs ===");
        }

        // Try different URL patterns that might have been cached
        let api_hosts = [
            "https://base.manager.iblai.app",
            "https://base.manager.iblai.org",
            "https://learn.iblai.app",
            "https://learn.iblai.org",
        ];

        for host in api_hosts {
            // Try with full body hash
            let cache_key_with_hash = format!("{}/{}#POST#{}", host, path, body_hash);
            if let Some(response) = cache.get_cached(&cache_key_with_hash).await {
                println!(
                    "[OfflineServer] Found cached POST response (with body hash) for: {}",
                    cache_key_with_hash
                );
                return Response::builder()
                    .status(response.status)
                    .header(header::CONTENT_TYPE, response.content_type)
                    .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .body(Body::from(response.body))
                    .unwrap();
            }

            // Try without body hash (fallback)
            let cache_key_no_hash = format!("{}/{}#POST", host, path);
            if let Some(response) = cache.get_cached(&cache_key_no_hash).await {
                println!(
                    "[OfflineServer] Found cached POST response (no body hash) for: {}",
                    cache_key_no_hash
                );
                return Response::builder()
                    .status(response.status)
                    .header(header::CONTENT_TYPE, response.content_type)
                    .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .body(Body::from(response.body))
                    .unwrap();
            }
        }
    }
    drop(cache_guard);

    // No cache found - fall back to mock responses for critical endpoints
    println!(
        "[OfflineServer] No cached POST response found, using fallback for: /{}",
        path
    );

    // Analytics time update - acknowledge but don't track (non-critical)
    if path.contains("analytics") && path.contains("time/update") {
        println!("[OfflineServer] Returning fallback analytics response");
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(Body::from(r#"{"success":true,"offline":true}"#))
            .unwrap();
    }

    // RBAC permissions check - return empty permissions as fallback
    // This allows the app to function without special permissions
    if path.contains("rbac/permissions/check") {
        println!("[OfflineServer] Returning fallback RBAC permissions response (no cache found)");
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(Body::from(r#"{"permissions":{},"offline":true}"#))
            .unwrap();
    }

    // Default POST response for unhandled/uncached endpoints
    println!("[OfflineServer] No cache or fallback for POST path: /{}", path);
    Response::builder()
        .status(StatusCode::SERVICE_UNAVAILABLE)
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(Body::from(format!(
            r#"{{"offline":true,"error":"No cached response available","path":"{}"}}"#,
            path
        )))
        .unwrap()
}

/// Handle API requests in offline mode with cache lookup
/// First checks cache for cached API responses, then falls back to mock responses
async fn handle_api_offline_with_cache(state: &AppState, path: &str) -> Response<Body> {
    println!("[OfflineServer] GET API request in offline mode: /{}", path);

    // Log cached URLs on first request (for debugging)
    static LOGGED_CACHE: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
    if !LOGGED_CACHE.load(std::sync::atomic::Ordering::Relaxed) {
        LOGGED_CACHE.store(true, std::sync::atomic::Ordering::Relaxed);
        let cache_guard = state.cache.read().await;
        if let Some(cache) = cache_guard.as_ref() {
            let cached_urls = cache.get_cached_urls().await;
            println!("[OfflineServer] === CACHED API URLs ({} total) ===", cached_urls.len());
            for url in &cached_urls {
                if url.contains("/api/") {
                    println!("[OfflineServer]   {}", url);
                }
            }
            println!("[OfflineServer] === END CACHED URLs ===");
        }
        drop(cache_guard);
    }

    // Check if path contains 'undefined' and try to find a matching cached response
    // This handles cases where React params aren't available yet
    let search_paths = if path.contains("undefined") {
        println!("[OfflineServer] Path contains 'undefined', will search for matching cached responses");
        get_corrected_paths(path)
    } else {
        vec![path.to_string()]
    };

    // Try to find cached API response
    // The cached URLs might be in various formats, try multiple patterns
    let app_origin = &state.app_origin;
    let cache_guard = state.cache.read().await;
    if let Some(cache) = cache_guard.as_ref() {
        for search_path in &search_paths {
            // Try different URL patterns that might have been cached
            let possible_urls = vec![
                format!("https://base.manager.iblai.app/{}", search_path),
                format!("https://base.manager.iblai.org/{}", search_path),
                format!("https://learn.iblai.app/{}", search_path),
                format!("https://learn.iblai.org/{}", search_path),
                format!("{}/{}", app_origin, search_path),
            ];

            for url in possible_urls {
                if let Some(response) = cache.get_cached(&url).await {
                    println!("[OfflineServer] Serving cached API response for: {}", url);
                    return Response::builder()
                        .status(response.status)
                        .header(header::CONTENT_TYPE, response.content_type)
                        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                        .body(Body::from(response.body))
                        .unwrap();
                }
            }
        }

        // If path contains undefined, try fuzzy matching on cache keys
        if path.contains("undefined") {
            if let Some(response) = fuzzy_match_cache(cache, path).await {
                println!("[OfflineServer] Serving fuzzy-matched cached API response");
                return Response::builder()
                    .status(response.status)
                    .header(header::CONTENT_TYPE, response.content_type)
                    .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .body(Body::from(response.body))
                    .unwrap();
            }
        }
    }
    drop(cache_guard);

    // No cache found, return mock response
    println!("[OfflineServer] No cached API response found, using mock for: /{}", path);
    handle_api_offline(path)
}

/// Try to find cached response by fuzzy matching the API path pattern
/// e.g., if path is api/ai-mentor/orgs/undefined/users/gillis/mentors/undefined/public-settings/
/// we look for any cached URL that matches /api/ai-mentor/orgs/*/users/*/mentors/*/public-settings/
async fn fuzzy_match_cache(cache: &WebCache, path: &str) -> Option<crate::web_cache::CacheResponse> {
    // Extract the API pattern from the path
    // Convert path with undefined to a pattern for matching
    // Add leading slash if not present
    let normalized_path = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{}", path)
    };
    let pattern_parts: Vec<&str> = normalized_path.split('/').filter(|s| !s.is_empty()).collect();

    println!("[OfflineServer] Fuzzy matching for pattern: {:?}", pattern_parts);

    // Get all cached URLs and try to find one that matches the pattern
    let cached_urls = cache.get_cached_urls().await;
    println!("[OfflineServer] Checking {} cached URLs for fuzzy match", cached_urls.len());

    for cached_url in cached_urls {
        // Only check API URLs
        if !cached_url.contains("/api/") {
            continue;
        }

        // Extract the path from the cached URL
        // URL format: https://base.manager.iblai.app/api/...
        if let Some(api_start) = cached_url.find("/api/") {
            let cached_path = &cached_url[api_start..];
            let cached_parts: Vec<&str> = cached_path.split('/').filter(|s| !s.is_empty()).collect();

            // Check if the pattern matches (same length, same structure)
            if cached_parts.len() == pattern_parts.len() {
                let mut matches = true;
                for (cached_part, pattern_part) in cached_parts.iter().zip(pattern_parts.iter()) {
                    // If pattern part is 'undefined', any value matches
                    // Otherwise, parts must be equal
                    if *pattern_part != "undefined" && *cached_part != *pattern_part {
                        matches = false;
                        break;
                    }
                }

                if matches {
                    println!("[OfflineServer] Fuzzy match found: {} for pattern: {}", cached_url, path);
                    if let Some(response) = cache.get_cached(&cached_url).await {
                        return Some(response);
                    }
                }
            }
        }
    }

    println!("[OfflineServer] No fuzzy match found for: {}", path);
    None
}

/// Get corrected paths by trying to extract org/mentor from the path pattern
fn get_corrected_paths(path: &str) -> Vec<String> {
    // Just return the original path - the fuzzy matching will handle finding the right cache
    vec![path.to_string()]
}

/// Handle API requests in offline mode
/// Returns appropriate mock responses or error responses
fn handle_api_offline(path: &str) -> Response<Body> {
    println!("[OfflineServer] API request in offline mode: {}", path);

    // For auth-redirect, return a response that won't trigger navigation
    if path.starts_with("api/auth-redirect") {
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(Body::from(r#"{"offline":true,"redirect":null}"#))
            .unwrap();
    }

    // For health check
    if path == "api/health" {
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(Body::from(r#"{"status":"offline"}"#))
            .unwrap();
    }

    // For custom-domains - return the expected domain configuration
    // This is critical for the app to know which tenant to use
    if path.starts_with("api/custom-domains") {
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(Body::from(r#"{"offline":true,"domain":"mentorai.iblai.app"}"#))
            .unwrap();
    }

    // For public-settings - return minimal settings for offline mode
    if path.starts_with("api/public-settings") {
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(Body::from(r#"{"offline":true}"#))
            .unwrap();
    }

    // Default API offline response
    Response::builder()
        .status(StatusCode::SERVICE_UNAVAILABLE)
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(Body::from(format!(
            r#"{{"error":"offline","message":"API not available in offline mode","path":"{}"}}"#,
            path
        )))
        .unwrap()
}

async fn serve_cached_url(state: &AppState, url: &str) -> Response<Body> {
    let cache_guard = state.cache.read().await;

    let cache = match cache_guard.as_ref() {
        Some(c) => c,
        None => {
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from("Cache not initialized"))
                .unwrap();
        }
    };

    match cache.fetch(url).await {
        Ok(response) => {
            let content_type = response.content_type.clone();
            Response::builder()
                .status(response.status)
                .header(header::CONTENT_TYPE, content_type)
                .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .body(Body::from(response.body))
                .unwrap()
        }
        Err(e) => {
            // For HTML requests, return a basic offline page
            // Check if this looks like a root URL or page route (not a static asset)
            let is_root_or_page = url == state.app_origin
                || url.ends_with('/')
                || !url.split('/').last().unwrap_or("").contains('.');
            if is_root_or_page {
                return offline_fallback_page();
            }

            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header(header::CONTENT_TYPE, "text/plain")
                .body(Body::from(format!("Not found in cache: {}", e)))
                .unwrap()
        }
    }
}

fn offline_fallback_page() -> Response<Body> {
    let html = r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MentorAI - Offline</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
        }
        .container { text-align: center; padding: 2rem; }
        h1 { font-size: 1.5rem; margin-bottom: 1rem; }
        p { color: rgba(255,255,255,0.7); margin-bottom: 1.5rem; }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
        }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>MentorAI</h1>
        <p>The app content hasn't been cached yet.<br>Please connect to the internet to load the app first.</p>
        <button onclick="location.reload()">Retry</button>
    </div>
</body>
</html>"#;

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/html")
        .body(Body::from(html))
        .unwrap()
}

/// Check if the offline server is running by hitting the health endpoint
pub async fn is_server_running() -> bool {
    let url = format!("http://127.0.0.1:{}/_health", OFFLINE_SERVER_PORT);

    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    match client.get(&url).send().await {
        Ok(resp) => {
            let is_ok = resp.status().is_success();
            println!("[OfflineServer] Health check result: {}", is_ok);
            is_ok
        }
        Err(e) => {
            println!("[OfflineServer] Health check failed: {}", e);
            false
        }
    }
}

/// Get the offline server URL
pub fn get_server_url() -> String {
    format!("http://127.0.0.1:{}", OFFLINE_SERVER_PORT)
}
