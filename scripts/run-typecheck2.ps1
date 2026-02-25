Set-Location 'C:\Users\HomePC\Documents\bpi_main'
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\typescript\bin\tsc' --noEmit 2>&1 | Out-File -FilePath 'typecheck-output.txt' -Encoding utf8
Write-Host "TYPECHECK_DONE"
Get-Content 'typecheck-output.txt' | Select-Object -First 60
