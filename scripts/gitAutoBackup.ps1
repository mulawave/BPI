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

  # Push current branch; handle non-fast-forward gracefully
  git push $Remote $branch
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Push rejected. Attempting pull --rebase..." -ForegroundColor Yellow
    git pull $Remote $branch --rebase
    git push $Remote $branch
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Push still rejected. Forcing push (local is king) with --force-with-lease" -ForegroundColor Yellow
      git push --force-with-lease $Remote $branch
    }
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
