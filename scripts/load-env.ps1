param([string]$Path='.env')
if(-not (Test-Path -LiteralPath $Path)){throw 'Copie .env.example para .env e configure os valores locais.'}
foreach($line in Get-Content -LiteralPath $Path){
  $entry=$line.Trim()
  if($entry -eq '' -or $entry.StartsWith('#')){continue}
  $parts=$entry.Split('=',2)
  if($parts.Count -ne 2 -or $parts[0] -notmatch '^[A-Z][A-Z0-9_]*$'){throw 'Linha inválida no arquivo de ambiente.'}
  [Environment]::SetEnvironmentVariable($parts[0],$parts[1].Trim().Trim('"').Trim("'"),'Process')
}
