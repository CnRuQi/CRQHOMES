<#
.SYNOPSIS
    Agent one-click check script (read-only, no file changes)
.EXAMPLE
    .\scripts\agent-check.ps1
#>

$ErrorActionPreference = "Continue"
$failed = $false

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Agent Code Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Lint
Write-Host "[1/3] Lint check..." -ForegroundColor Yellow
Write-Host "--- Server ---" -ForegroundColor Gray
Push-Location server
npm run lint 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host "--- Client ---" -ForegroundColor Gray
Push-Location client
npm run lint 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host ""

# 2. Format check
Write-Host "[2/3] Format check..." -ForegroundColor Yellow
npm run format:check 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }

Write-Host ""

# 3. Test
Write-Host "[3/3] Test..." -ForegroundColor Yellow
Write-Host "--- Server ---" -ForegroundColor Gray
Push-Location server
npm test 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host "--- Client ---" -ForegroundColor Gray
Push-Location client
npm test 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host ""

# Result
Write-Host "========================================" -ForegroundColor Cyan
if ($failed) {
    Write-Host "  FAILED - fix issues above" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ALL PASSED!" -ForegroundColor Green
    exit 0
}
