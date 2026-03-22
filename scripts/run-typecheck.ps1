Set-Location 'C:\Users\HomePC\Documents\bpi_main'
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\typescript\bin\tsc' --noEmit 2>&1 | Select-Object -First 30
Write-Host "TYPECHECK_DONE"
