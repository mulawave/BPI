Set-Location 'C:\Users\HomePC\Documents\bpi_main'
Write-Host "=== ci-output-fresh.txt TAIL ==="
Get-Content 'ci-output-fresh.txt' | Select-Object -Last 20
Write-Host ""
Write-Host "=== ci-test.exit.txt ==="
if (Test-Path 'ci-test.exit.txt') {
    Get-Content 'ci-test.exit.txt'
} else {
    Write-Host "NOT FOUND"
}
