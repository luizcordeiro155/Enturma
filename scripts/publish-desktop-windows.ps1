param(
  [string]$Version
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) não foi encontrado. Instale e execute 'gh auth login'."
}

gh auth status
if ($LASTEXITCODE -ne 0) {
  throw "Faça login no GitHub CLI antes de publicar."
}

$package = Get-Content "apps\desktop\package.json" -Raw | ConvertFrom-Json
if (-not $Version) {
  $Version = $package.version
}

$tag = "desktop-v$Version"
$dist = Join-Path $root "apps\desktop\dist"
$assets = Get-ChildItem $dist -Filter "*.exe"

if (-not $assets -or $assets.Count -eq 0) {
  throw "Nenhum .exe encontrado. Execute scripts\build-desktop-windows.ps1 primeiro."
}

$existing = gh release view $tag 2>$null
if ($LASTEXITCODE -eq 0) {
  throw "A release $tag já existe. Aumente a versão em apps/desktop/package.json."
}

$notes = @"
# Enturma Desktop $Version

Aplicativo oficial do Enturma para Windows.

- mesma conta e dados da versão Web;
- salas, chat, fórum, amigos, cadernos e caronas;
- câmera e microfone;
- compartilhamento de tela;
- notificações do sistema;
- protocolo enturma:// para links do aplicativo.

O instalador ainda pode exibir aviso do Windows SmartScreen enquanto o projeto não possuir certificado de assinatura de código.
"@

$args = @(
  "release", "create", $tag,
  "--title", "Enturma Desktop $Version",
  "--notes", $notes
)

foreach ($asset in $assets) {
  $args += $asset.FullName
}

& gh @args
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível publicar a GitHub Release."
}

Write-Host ""
Write-Host "Release publicada: $tag"
Write-Host "A página /download do Enturma detectará os arquivos automaticamente."
