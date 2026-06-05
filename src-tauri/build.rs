fn main() {
    tauri_build::build();

    // Explicitly link iOS-required frameworks for ASWebAuthenticationSession
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    if target_os == "ios" || target_os == "macos" {
        println!("cargo:rustc-link-lib=framework=AuthenticationServices");
        println!("cargo:rustc-link-lib=framework=SafariServices");
    }
}
