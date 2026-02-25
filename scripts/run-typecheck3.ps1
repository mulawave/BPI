Set-Location 'C:\Users\HomePC\Documents\bpi_main'
$output = & 'C:\Program Files\nodejs\node.exe' '.\node_modules\typescript\bin\tsc' --noEmit 2>&1
$exitCode = $LASTEXITCODE
if ($output) {
    $output | Out-File -FilePath 'typecheck-output.txt' -Encoding utf8
    Write-Host "ERRORS_FOUND"
    $output | Select-Object -First 30
} else {
    "TYPECHECK_PASSED" | Out-File -FilePath 'typecheck-output.txt' -Encoding utf8
    Write-Host "TYPECHECK_PASSED"
}
Write-Host "Exit: $exitCode"
