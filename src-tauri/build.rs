/// The version the app actually ships as, for the Sentry release tag.
///
/// `CARGO_PKG_VERSION` is useless here: `Cargo.toml` still says 0.1.0 while
/// the real version — the one on the DMG, the updater feed and the release
/// tag — lives in `tauri.conf.json`. Tagging events with 0.1.0 would mean
/// never knowing which build an issue came from, so a config this cannot be
/// read out of is a hard build failure rather than a silent fallback.
fn shipped_version(manifest_dir: &std::path::Path) -> String {
    let path = manifest_dir.join("tauri.conf.json");
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read {}: {e}", path.display()));
    let conf: serde_json::Value = serde_json::from_str(&text)
        .unwrap_or_else(|e| panic!("cannot parse {}: {e}", path.display()));
    conf["version"]
        .as_str()
        .unwrap_or_else(|| panic!("{} has no string \"version\"", path.display()))
        .to_string()
}

fn main() {
    tauri_build::build();

    // Baked for release builds, which have no dotenv to read (telemetry.rs
    // still prefers a runtime value so a dev build can aim elsewhere).
    println!("cargo:rerun-if-env-changed=IBL_SENTRY_DSN_DESKTOP");
    if let Ok(dsn) = std::env::var("IBL_SENTRY_DSN_DESKTOP") {
        println!("cargo:rustc-env=IBL_SENTRY_DSN_DESKTOP={dsn}");
    }
    let manifest_dir = std::path::PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is always set"),
    );
    println!("cargo:rerun-if-changed=tauri.conf.json");
    println!(
        "cargo:rustc-env=IBL_APP_VERSION={}",
        shipped_version(&manifest_dir)
    );

    // Explicitly link iOS-required frameworks for ASWebAuthenticationSession
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    if target_os == "ios" || target_os == "macos" {
        println!("cargo:rustc-link-lib=framework=AuthenticationServices");
        println!("cargo:rustc-link-lib=framework=SafariServices");
    }
}
