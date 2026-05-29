<#
.SYNOPSIS
    Agent auto-fix script (modifies files)
.EXAMPLE
    .\scripts\agent-fix.ps1
#>

$ErrorActionPreference = "Continue"
$failed = $false

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Agent Auto Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Lint fix
Write-Host "[1/3] Lint auto-fix..." -ForegroundColor Yellow
Write-Host "--- Server ---" -ForegroundColor Gray
Push-Location server
npm run lint:fix 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host "--- Client ---" -ForegroundColor Gray
Push-Location client
npm run lint:fix 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host ""

# 2. Format
Write-Host "[2/3] Format..." -ForegroundColor Yellow
npm run format 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { $failed = $true }

Write-Host ""

# 3. Test
Write-Host "[3/3] Test verification..." -ForegroundColor Yellow
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
    Write-Host "  Fixed but tests failed - check manually" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  Fixed, all passed!" -ForegroundColor Green
    exit 0
}
