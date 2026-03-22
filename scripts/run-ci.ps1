Set-Location 'C:\Users\HomePC\Documents\bpi_main'
Remove-Item 'ci-test.exit.txt' -Force -ErrorAction SilentlyContinue
& 'C:\Program Files\nodejs\node.exe' scripts/ci-test.cjs 2>&1 | Tee-Object -FilePath 'ci-output-fresh.txt'
Write-Host "CI_RUN_DONE"
