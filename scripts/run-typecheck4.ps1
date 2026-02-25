Set-Location 'C:\Users\HomePC\Documents\bpi_main'
$r = & 'C:\Program Files\nodejs\node.exe' '.\node_modules\typescript\bin\tsc' --noEmit 2>&1
if ($r) {
    Write-Host "ERRORS_FOUND"
    $r | Out-String
} else {
    Write-Host "TYPECHECK_PASSED"
}
