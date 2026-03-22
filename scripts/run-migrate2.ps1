Set-Location 'C:\Users\HomePC\Documents\bpi_main'
$ts = Get-Date -Format 'yyyyMMddHHmmss'
$dir = "prisma/migrations/${ts}_elite_club_cred_events"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Write-Host "Created: $dir"
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\prisma\build\index.js' migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script --output "$dir/migration.sql" 2>&1
Write-Host "DIFF_DONE"
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\prisma\build\index.js' migrate deploy 2>&1
Write-Host "DEPLOY_DONE"
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\prisma\build\index.js' generate 2>&1
Write-Host "GENERATE_DONE"
