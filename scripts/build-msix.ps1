<#
.SYNOPSIS
    Packages the built SkillsAI (Agentic LMS) Tauri binaries into per-architecture
    MSIX packages for Microsoft Store submission.

.DESCRIPTION
    Tauri does not emit MSIX. This script takes the release binaries produced by
    `cargo tauri build --no-bundle --target <triple>` and packs each into an
    unsigned .msix using the Windows SDK `makeappx` tool.

    The packages are intentionally UNSIGNED: Partner Center re-signs Store
    submissions with the identity reserved for the app. The Identity values below
    MUST match the reservation in Partner Center > Product management >
    Product identity, or the upload is rejected.

    Custom URI schemes (iblai-skills, ai.ibl.skills) are declared as
    windows.protocol extensions so the SSO deep-link callback works inside the
    packaged (MSIX) app, where runtime registry registration is virtualized.

.EXAMPLE
    pwsh scripts/build-msix.ps1 `
        -IdentityName "1234IBLai.AgenticLMS" `
        -Publisher "CN=AB12CD34-5678-90EF-1234-567890ABCDEF" `
        -PublisherDisplayName "IBL.ai"
#>
[CmdletBinding()]
param(
    # Partner Center > Product identity > "Package/Identity/Name" for the
    # Agentic LMS reservation (app-specific; NOT shared with the ibl.ai product).
    [Parameter(Mandatory = $true)] [string] $IdentityName,
    # Account-level Publisher ID (CN=...). Shared across all ibl.ai Store apps;
    # taken from the mentorai (ibl.ai) reservation.
    [string] $Publisher = "CN=02D69AED-8E37-4338-A36D-57B9C8A6FA57",
    # Account-level seller display name. Shared across all ibl.ai Store apps.
    [string] $PublisherDisplayName = "ibl.ai",
    # 4-part version; Store requires the revision (4th) part to be 0.
    [string] $Version = "1.0.6.0",
    # Subset of architectures to build (default: both).
    [ValidateSet("x64", "arm64")] [string[]] $Architectures = @("x64", "arm64")
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $repoRoot "src-tauri\icons"
$targetDir = Join-Path $repoRoot "src-tauri\target"
$distDir = Join-Path $repoRoot "dist\msix"
$exeName = "SkillsAI.exe"

# Map Store arch -> Rust target triple
$triples = @{ "x64" = "x86_64-pc-windows-msvc"; "arm64" = "aarch64-pc-windows-msvc" }

# Locate makeappx.exe in the newest installed Windows 10/11 SDK
$sdkRoot = "C:\Program Files (x86)\Windows Kits\10\bin"
$sdkVer = Get-ChildItem $sdkRoot -Directory -ErrorAction Stop |
    Where-Object { $_.Name -match '^\d+\.' } |
    Sort-Object { [version]$_.Name } -Descending |
    Select-Object -First 1
if (-not $sdkVer) { throw "No versioned Windows SDK found under $sdkRoot" }
$makeappx = Join-Path $sdkVer.FullName "x64\makeappx.exe"
if (-not (Test-Path $makeappx)) { throw "makeappx.exe not found at $makeappx" }
Write-Host "Using makeappx: $makeappx"

# Assets referenced by the manifest (must exist in src-tauri/icons)
$assets = @(
    "Square44x44Logo.png", "Square71x71Logo.png", "Square150x150Logo.png",
    "Square310x310Logo.png", "Wide310x150Logo.png", "StoreLogo.png"
)

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
$produced = @()

foreach ($arch in $Architectures) {
    $triple = $triples[$arch]
    $exePath = Join-Path $targetDir "$triple\release\$exeName"
    if (-not (Test-Path $exePath)) {
        throw "Release binary missing for $arch ($exePath). Run: cargo tauri build --no-bundle --target $triple"
    }

    Write-Host "`n=== Packaging $arch ($triple) ==="
    $stage = Join-Path $targetDir "msix\$arch"
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Join-Path $stage "Assets") | Out-Null

    Copy-Item $exePath (Join-Path $stage $exeName)
    foreach ($a in $assets) {
        $src = Join-Path $iconsDir $a
        if (-not (Test-Path $src)) { throw "Missing asset: $src" }
        Copy-Item $src (Join-Path $stage "Assets\$a")
    }

    # Ship the dynamic WebView2 loader alongside the exe if the build produced one.
    $webview2Loader = Join-Path $targetDir "$triple\release\WebView2Loader.dll"
    if (Test-Path $webview2Loader) { Copy-Item $webview2Loader (Join-Path $stage "WebView2Loader.dll") }

    $manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity Name="$IdentityName"
            Publisher="$Publisher"
            Version="$Version"
            ProcessorArchitecture="$arch" />

  <Properties>
    <DisplayName>Agentic LMS</DisplayName>
    <PublisherDisplayName>$PublisherDisplayName</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>

  <Dependencies>
    <!-- Windows 10 1903 (18362) minimum, matching the sibling ibl.ai app: required
         for full WebView2 compatibility. 1809 reached end of support in Nov 2020. -->
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.18362.0" MaxVersionTested="10.0.22631.0" />
  </Dependencies>

  <Resources>
    <Resource Language="en-us" />
  </Resources>

  <Applications>
    <Application Id="AgenticLMS" Executable="$exeName" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="Agentic LMS"
        Description="Skills assessment and tracking"
        BackgroundColor="transparent"
        Square150x150Logo="Assets\Square150x150Logo.png"
        Square44x44Logo="Assets\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png"
                         Square71x71Logo="Assets\Square71x71Logo.png"
                         Square310x310Logo="Assets\Square310x310Logo.png" />
        <uap:SplashScreen Image="Assets\Square150x150Logo.png" />
      </uap:VisualElements>
      <Extensions>
        <!-- Deep link schemes used by the SSO callback (see src-tauri/src/lib.rs).
             In MSIX these must be declared here; runtime registry registration is
             virtualized and does not associate protocols for a packaged app. -->
        <uap:Extension Category="windows.protocol">
          <uap:Protocol Name="iblai-skills">
            <uap:DisplayName>Agentic LMS</uap:DisplayName>
          </uap:Protocol>
        </uap:Extension>
        <uap:Extension Category="windows.protocol">
          <uap:Protocol Name="ai.ibl.skills">
            <uap:DisplayName>Agentic LMS</uap:DisplayName>
          </uap:Protocol>
        </uap:Extension>
      </Extensions>
    </Application>
  </Applications>

  <Capabilities>
    <!-- Network access for API calls, the local offline server, and Ollama. -->
    <Capability Name="internetClient" />
    <Capability Name="internetClientServer" />
    <Capability Name="privateNetworkClientServer" />
    <!-- Full trust required for a Win32 desktop app (shell, local server, Ollama). -->
    <rescap:Capability Name="runFullTrust" />
    <!-- Voice/video (LiveKit). DeviceCapability must come after all Capabilities. -->
    <DeviceCapability Name="webcam" />
    <DeviceCapability Name="microphone" />
  </Capabilities>
</Package>
"@

    Set-Content -Path (Join-Path $stage "AppxManifest.xml") -Value $manifest -Encoding UTF8

    $outFile = Join-Path $distDir "AgenticLMS-$Version-$arch.msix"
    if (Test-Path $outFile) { Remove-Item $outFile -Force }
    & $makeappx pack /d $stage /p $outFile /o
    if ($LASTEXITCODE -ne 0) { throw "makeappx failed for $arch (exit $LASTEXITCODE)" }
    $produced += $outFile
}

Write-Host "`n=== Done. Produced packages: ==="
$produced | ForEach-Object { Write-Host "  $_" }
