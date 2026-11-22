# Runs one helper from PowerShell: helpers\run.ps1 <tool> [arguments]   (the same as helpers/run in a POSIX shell)
# Builds x4h the first time, and again when a source file is newer than it (after a pull).
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$bin = Join-Path $here "target\release\x4h.exe"
$stale = -not (Test-Path $bin)
if (-not $stale) {
  $built = (Get-Item $bin).LastWriteTimeUtc
  $stale = [bool](@(Get-ChildItem -Recurse (Join-Path $here "src")) + (Get-Item (Join-Path $here "Cargo.toml")) |
    Where-Object { -not $_.PSIsContainer -and $_.LastWriteTimeUtc -gt $built } | Select-Object -First 1)
}
if ($stale) {
  & cargo build --release --quiet --manifest-path (Join-Path $here "Cargo.toml")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  (Get-Item $bin).LastWriteTimeUtc = [DateTime]::UtcNow
}
& $bin @args
exit $LASTEXITCODE
