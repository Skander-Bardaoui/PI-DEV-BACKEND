# Improve Branch Coverage Script
# Goal: Increase branch coverage from 60.77% to 70.1%

Write-Host "Target: Improve branch coverage by 9.33 percentage points" -ForegroundColor Cyan
Write-Host "Need to cover 39 more branches`n" -ForegroundColor Yellow

Write-Host "Files with lowest branch coverage:" -ForegroundColor Green
Write-Host "  1. users.service.ts: 28.57% (CRITICAL)" -ForegroundColor Red
Write-Host "  2. businesses.service.ts: 47.36%" -ForegroundColor Yellow
Write-Host "  3. subtasks.controller.ts: 47.36%" -ForegroundColor Yellow
Write-Host "  4. businesses.controller.ts: 51.51%" -ForegroundColor Yellow

Write-Host "`nRecommendations:" -ForegroundColor Cyan
Write-Host "1. Add tests for error handling paths"
Write-Host "2. Test both success and failure scenarios"
Write-Host "3. Test conditional logic branches"
Write-Host "4. Test edge cases and validation"

Write-Host "`nExpected result: SonarQube coverage will increase from 67.6% to 71%" -ForegroundColor Green
