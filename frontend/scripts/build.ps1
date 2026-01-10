param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("ios", "android", "all")]
  [string]$Platform,

  [Parameter(Mandatory = $false)]
  [string]$Profile = "production",

  [Parameter(Mandatory = $false)]
  [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Root "logs"
$Ts = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = Join-Path $LogDir ("eas_build_{0}_{1}_{2}.log" -f $Platform, $Profile, $Ts)

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $line
  Add-Content -Path $LogFile -Value $line
}

function RequireFile([string]$path) {
  if (-not (Test-Path $path)) { throw "Missing required file: $path" }
}

function RequireCmd([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing command: $name"
  }
}

function Run([string]$cmd) {
  Log "RUN: $cmd"
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "powershell"
  $psi.Arguments = "-NoProfile -Command $cmd"
  $psi.WorkingDirectory = $Root
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  if ($stdout) { $stdout.TrimEnd().Split("`n") | ForEach-Object { Log $_.TrimEnd("`r") } }
  if ($stderr) { $stderr.TrimEnd().Split("`n") | ForEach-Object { Log $_.TrimEnd("`r") } }

  if ($p.ExitCode -ne 0) { throw "Command failed with exit code $($p.ExitCode): $cmd" }
}

try {
  Set-Location $Root
  Log "Build started. Platform=$Platform Profile=$Profile Root=$Root"
  Log "Log file: $LogFile"
  Log "TestFlight note: this script can build/upload an IPA, but TestFlight invite links are created in App Store Connect (TestFlight tab)."
  Log "If you already have a public invite link, you can expose it via env var TESTFLIGHT_PUBLIC_LINK and this script will print it at the end."

  RequireFile (Join-Path $Root "package.json")
  RequireFile (Join-Path $Root "eas.json")
  RequireCmd "node"
  RequireCmd "npx"

  Run "node -v"
  Run "npx eas --version"

  if (Test-Path (Join-Path $Root "package-lock.json")) {
    Log "Detected package-lock.json -> npm ci"
    Run "npm ci"
  } elseif (Test-Path (Join-Path $Root "yarn.lock")) {
    RequireCmd "yarn"
    Log "Detected yarn.lock -> yarn install --frozen-lockfile"
    Run "yarn install --frozen-lockfile"
  } elseif (Test-Path (Join-Path $Root "pnpm-lock.yaml")) {
    RequireCmd "pnpm"
    Log "Detected pnpm-lock.yaml -> pnpm install --frozen-lockfile"
    Run "pnpm install --frozen-lockfile"
  } else {
    Log "No lockfile detected -> npm install"
    Run "npm install"
  }

  # Preflight bundle check
  try {
    Run "npx expo --version"
    Log "Preflight: expo export (bundle check)"
    if ($Platform -eq "ios") {
      Run "npx expo export --platform ios"
    } elseif ($Platform -eq "android") {
      Run "npx expo export --platform android"
    } else {
      Run "npx expo export --platform ios"
      Run "npx expo export --platform android"
    }
  } catch {
    Log "Skipping expo export preflight (expo not found or failed)."
  }

  $ni = ""
  if ($NonInteractive) { $ni = "--non-interactive" }

  if ($Platform -eq "ios") {
    Run "npx eas build -p ios --profile $Profile $ni"
  } elseif ($Platform -eq "android") {
    Run "npx eas build -p android --profile $Profile $ni"
  } else {
    Run "npx eas build -p ios --profile $Profile $ni"
    Run "npx eas build -p android --profile $Profile $ni"
  }

  if ($Platform -eq "ios") {
    Log "TestFlight: after the build is processed, create/share invites in App Store Connect → TestFlight."
    Log "App Store Connect: https://appstoreconnect.apple.com/apps"
    if ($env:TESTFLIGHT_PUBLIC_LINK) {
      Log "TestFlight public link: $($env:TESTFLIGHT_PUBLIC_LINK)"
    }
  }

  Log "Build finished successfully."
  exit 0
}
catch {
  Log "ERROR: $($_.Exception.Message)"
  Log "Build failed."
  exit 1
}
finally {
  Set-Location $Root
}
