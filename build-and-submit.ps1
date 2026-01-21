param(
    [string]$Profile = "production",
    [switch]$UseLatestBuild,
    [switch]$SkipSubmit
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $repoRoot "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Error "frontend/ directory not found at $frontendPath"
    exit 1
}

Set-Location $frontendPath
Write-Host "Working in $frontendPath" -ForegroundColor Cyan

function Run-Step {
    param(
        [string]$Label,
        [string]$Command
    )
    Write-Host "\n==> $Label" -ForegroundColor Green
    Write-Host "$ $Command" -ForegroundColor DarkGray
    $proc = Start-Process powershell -ArgumentList "-NoLogo","-NoProfile","-Command",$Command -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        throw "Step failed: $Label (exit code $($proc.ExitCode))"
    }
}

try {
    if (-not $UseLatestBuild) {
        Run-Step "Build iOS ($Profile)" "npx eas build -p ios --profile $Profile"
    } else {
        Write-Host "Skipping build (using latest existing build)" -ForegroundColor Yellow
    }

    if ($SkipSubmit) {
        Write-Host "SkipSubmit flag set; not submitting." -ForegroundColor Yellow
        exit 0
    }

    $submitAnswer = Read-Host "Submit latest build to App Store Connect (TestFlight)? (y/N)"
    if ($submitAnswer -match '^(y|yes)$') {
        Run-Step "Submit iOS build" "npx eas submit -p ios --profile $Profile --latest"
        Write-Host "Submission started. Monitor App Store Connect/TestFlight for processing." -ForegroundColor Green
    } else {
        Write-Host "Submission skipped." -ForegroundColor Yellow
    }
}
catch {
    Write-Error $_
    exit 1
}
