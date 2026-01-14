# BPI Git Auto Backup Scheduling (Windows)

This guide sets up a scheduled task that regularly backs up your local repo to the remote, keeping the local repo as the source of truth.

## Prerequisites
- Windows Task Scheduler
- Git installed and configured (remote `origin` set)
- PowerShell execution policy allowing local scripts

## Command (Hourly)
Run this in an elevated PowerShell terminal or Task Scheduler:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "Z:\bpi\v3\bpi_main\scripts\gitAutoBackup.ps1"
``

## NPM Alias (Quick Setup)
You can also create the scheduled task via npm:

```powershell
npm run backup:schedule
```

This uses the helper at [scripts/scheduleGitAutoBackup.ps1](scripts/scheduleGitAutoBackup.ps1) with hourly defaults.

Or create a scheduled task via `schtasks`:

```powershell
schtasks /Create /SC HOURLY /TN "BPI Git Auto Backup" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"Z:\\bpi\\v3\\bpi_main\\scripts\\gitAutoBackup.ps1\"" /RL LIMITED
```

> Note: Adjust the path if your workspace is elsewhere.

## Verify
- Open Task Scheduler → Task Scheduler Library → find "BPI Git Auto Backup"
- Right-click → Run → check it completes.
- Confirm the latest commit message on GitHub: "Auto backup from <HOSTNAME> @ <timestamp>"

## Customize
- Frequency: replace `/SC HOURLY` with `DAILY`, `ONLOGON`, or `MINUTE` (with `/MO 30` for every 30 minutes).
- Start time: add `/ST HH:MM` (24h format).

Examples:

```powershell
# Daily at 02:00
schtasks /Create /SC DAILY /ST 02:00 /TN "BPI Git Auto Backup" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"Z:\\bpi\\v3\\bpi_main\\scripts\\gitAutoBackup.ps1\"" /RL LIMITED

# Every 30 minutes
schtasks /Create /SC MINUTE /MO 30 /TN "BPI Git Auto Backup" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"Z:\\bpi\\v3\\bpi_main\\scripts\\gitAutoBackup.ps1\"" /RL LIMITED
```

## Update or Remove
- Update: re-run the `schtasks /Create` command with the same `/TN` to overwrite.
- Remove:

```powershell
schtasks /Delete /TN "BPI Git Auto Backup" /F
```

## Troubleshooting
- If push is rejected because the remote is ahead, the script uses `--force-with-lease` to prioritize local.
- If a rebase/merge was left in-progress, the script aborts it automatically.
- Ensure `origin` is set:

```powershell
git remote -v
```
