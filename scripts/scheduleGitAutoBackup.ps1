Param(
  [string]$RepoPath = "$PSScriptRoot\..",
  [string]$TaskName = "BPI Git Auto Backup",
  [ValidateSet("HOURLY","DAILY","MINUTE","ONLOGON")]
  [string]$Schedule = "HOURLY",
  [string]$Modifier = "", # e.g., 30 for every 30 minutes when Schedule=MINUTE
  [string]$StartTime = ""   # e.g., 02:00 for daily 2 AM
)

$ErrorActionPreference = "Stop"

try {
  $fullPath = (Resolve-Path -Path $RepoPath).Path
  $scriptPath = Join-Path $fullPath "scripts\gitAutoBackup.ps1"
  if (-not (Test-Path $scriptPath)) {
    Write-Host "Backup script not found at: $scriptPath" -ForegroundColor Red
    exit 1
  }

  $tr = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
  $args = @("/Create", "/SC", $Schedule, "/TN", $TaskName, "/TR", $tr, "/RL", "LIMITED")

  if ($Schedule -eq "MINUTE" -and $Modifier) { $args += @("/MO", $Modifier) }
  if ($Schedule -eq "DAILY" -and $StartTime) { $args += @("/ST", $StartTime) }

  schtasks @args | Out-Null
  Write-Host "Scheduled task '$TaskName' created for $Schedule" -ForegroundColor Green
}
catch {
  Write-Host "Scheduling failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
