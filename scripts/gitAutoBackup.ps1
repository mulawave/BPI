Param(
  [string]$RepoPath = "$PSScriptRoot\..",
  [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

try {
  # Resolve repo path and switch to it
  $fullPath = (Resolve-Path -Path $RepoPath).Path
  Push-Location $fullPath

  # Ensure this is a git repo
  if (-not (Test-Path ".git")) {
    Write-Host "Not a git repository: $fullPath" -ForegroundColor Red
    exit 1
  }

  # Determine current branch
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  if (-not $branch -or $branch -eq "HEAD") {
    $branch = "main"
  }

  # Show remote info
  $remotes = git remote -v | Out-String
  Write-Host "Remotes:`n$remotes"

  # Clean up any in-progress rebase/merge to avoid dirty states
  if (Test-Path ".git/rebase-apply") { Write-Host "Rebase detected. Aborting rebase..." -ForegroundColor Yellow; git rebase --abort }
  if (Test-Path ".git/rebase-merge") { Write-Host "Rebase (merge) detected. Aborting rebase..." -ForegroundColor Yellow; git rebase --abort }
  if (Test-Path ".git/MERGE_HEAD") { Write-Host "Merge in progress detected. Aborting merge..." -ForegroundColor Yellow; git merge --abort }

  # Stage and commit only if there are changes
  $status = git status --porcelain
  if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $hostname = $env:COMPUTERNAME
    $msg = "Auto backup from $hostname @ $timestamp"
    git add -A
    git commit -m $msg | Out-Null
    Write-Host "Committed: $msg" -ForegroundColor Green
  } else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
  }

  # Push current branch; if upstream is ahead, force-with-lease (local is king)
  git push $Remote $branch
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Push rejected. Enforcing local as source of truth with --force-with-lease" -ForegroundColor Yellow
    git push --force-with-lease $Remote $branch
  }

  # Push tags (best-effort)
  git push $Remote --tags
  Write-Host "Push complete for branch '$branch'" -ForegroundColor Green
}
catch {
  Write-Host "Backup failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
finally {
  Pop-Location | Out-Null
}
