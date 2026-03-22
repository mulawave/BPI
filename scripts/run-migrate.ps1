Set-Location 'C:\Users\HomePC\Documents\bpi_main'
$ts = Get-Date -Format 'yyyyMMddHHmmss'
$dir = "prisma/migrations/${ts}_elite_club_initial"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Write-Host "Created: $dir"
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\prisma\build\index.js' migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script --output "$dir/migration.sql" 2>&1
Write-Host "DIFF_DONE"
