param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

if ($env:OS -ne "Windows_NT") {
  throw "Este script deve ser executado no Windows para gerar o instalador oficial."
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22.14 ou superior não foi encontrado."
}

$nodeVersion = (& node -p "process.versions.node").Trim()
Write-Host "Node.js $nodeVersion"

if (-not $SkipInstall) {
  Write-Host "Instalando dependências do monorepo..."
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci falhou." }
}

Write-Host "Gerando instalador do Enturma Desktop para Windows..."
npm run dist:desktop:win
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar o aplicativo Desktop." }

$dist = Join-Path $root "apps\desktop\dist"
Write-Host ""
Write-Host "Build concluído."
Write-Host "Arquivos disponíveis em: $dist"
Get-ChildItem $dist -Filter "*.exe" | Select-Object Name, Length, LastWriteTime
