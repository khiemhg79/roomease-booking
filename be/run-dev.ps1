$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) {
  throw "Chưa có be/.env. Hãy copy .env.example thành .env và điền thông tin Supabase."
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $parts = $line.Split('=', 2)
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
  }
}

& (Join-Path $PSScriptRoot 'mvnw.cmd') spring-boot:run
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
