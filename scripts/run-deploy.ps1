Set-Location 'C:\Users\HomePC\Documents\bpi_main'
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\prisma\build\index.js' migrate deploy 2>&1
Write-Host "DEPLOY_DONE"
