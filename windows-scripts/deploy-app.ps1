# Script di deploy completo per Trasporto Sociale su Windows Server 2022
# Eseguire come Amministratore

param(
    [string]$AppPath = "C:\inetpub\wwwroot\TrasportoSociale",
    [string]$SourcePath = ".",
    [switch]$SkipBackup = $false
)

Write-Host "🚀 Deploy Trasporto Sociale su Windows Server 2022" -ForegroundColor Green

# Verifica privilegi amministratore
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Questo script deve essere eseguito come Amministratore!"
    exit 1
}

$BackupDir = "C:\Backups\TrasportoSociale"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "📦 Preparazione deploy..." -ForegroundColor Yellow

# Crea directory di backup
if (-not $SkipBackup -and (Test-Path $AppPath)) {
    Write-Host "💾 Creazione backup..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    $BackupFile = "$BackupDir\app_backup_$Date.zip"
    Compress-Archive -Path $AppPath -DestinationPath $BackupFile -Force
    Write-Host "Backup creato: $BackupFile" -ForegroundColor Green
}

Write-Host "⏹️ Arresto servizi..." -ForegroundColor Yellow

# Ferma PM2 se in esecuzione
try {
    pm2 stop trasporto-sociale 2>$null
    Write-Host "Servizio PM2 arrestato" -ForegroundColor Green
} catch {
    Write-Host "Servizio PM2 non in esecuzione" -ForegroundColor Yellow
}

# Ferma sito IIS se esiste
if (Get-Website -Name "TrasportoSociale" -ErrorAction SilentlyContinue) {
    Stop-Website -Name "TrasportoSociale"
    Stop-WebAppPool -Name "TrasportoSocialePool"
    Write-Host "Sito IIS arrestato" -ForegroundColor Green
}

Write-Host "📁 Copia file applicazione..." -ForegroundColor Yellow

# Crea directory applicazione se non esiste
New-Item -ItemType Directory -Path $AppPath -Force | Out-Null

# Lista file/directory da escludere
$ExcludeItems = @(
    "node_modules",
    ".git",
    ".env",
    "logs",
    "*.log",
    "dist"
)

# Copia file escludendo quelli non necessari
$SourceItems = Get-ChildItem -Path $SourcePath -Exclude $ExcludeItems
foreach ($item in $SourceItems) {
    $destination = Join-Path $AppPath $item.Name
    if ($item.PSIsContainer) {
        Copy-Item -Path $item.FullName -Destination $destination -Recurse -Force
    } else {
        Copy-Item -Path $item.FullName -Destination $destination -Force
    }
}

Write-Host "File copiati in $AppPath" -ForegroundColor Green

Write-Host "⚙️ Configurazione ambiente..." -ForegroundColor Yellow

# Configura file .env se non esiste
$EnvFile = Join-Path $AppPath ".env"
$EnvExampleFile = Join-Path $AppPath ".env.example"

if (-not (Test-Path $EnvFile) -and (Test-Path $EnvExampleFile)) {
    Copy-Item -Path $EnvExampleFile -Destination $EnvFile
    Write-Host "File .env creato da .env.example" -ForegroundColor Green
    Write-Host "⚠️ IMPORTANTE: Modifica il file .env con le tue configurazioni!" -ForegroundColor Red
} elseif (Test-Path $EnvFile) {
    Write-Host "File .env esistente mantenuto" -ForegroundColor Yellow
}

# Imposta permessi corretti
icacls $AppPath /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null
icacls $AppPath /grant "IUSR:(OI)(CI)F" /T | Out-Null
icacls $EnvFile /grant "IIS_IUSRS:F" | Out-Null

Write-Host "📦 Installazione dipendenze..." -ForegroundColor Yellow

# Naviga nella directory dell'applicazione
Push-Location $AppPath

try {
    # Installa dipendenze
    npm ci --production --silent
    Write-Host "Dipendenze installate" -ForegroundColor Green
    
    # Build applicazione
    Write-Host "🔨 Build applicazione..." -ForegroundColor Yellow
    npm run build
    Write-Host "Build completato" -ForegroundColor Green
    
} catch {
    Write-Error "Errore durante installazione/build: $_"
    Pop-Location
    exit 1
}

Pop-Location

Write-Host "📝 Creazione directory log..." -ForegroundColor Yellow

# Crea directory log
$LogDir = Join-Path $AppPath "logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
icacls $LogDir /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null

Write-Host "🚀 Avvio servizi..." -ForegroundColor Yellow

# Avvia applicazione con PM2
Push-Location $AppPath

try {
    pm2 start ecosystem.config.js
    pm2 save
    Write-Host "Applicazione Node.js avviata con PM2" -ForegroundColor Green
} catch {
    Write-Error "Errore avvio PM2: $_"
}

Pop-Location

# Avvia sito IIS
if (Get-Website -Name "TrasportoSociale" -ErrorAction SilentlyContinue) {
    Start-WebAppPool -Name "TrasportoSocialePool"
    Start-Website -Name "TrasportoSociale"
    Write-Host "Sito IIS avviato" -ForegroundColor Green
} else {
    Write-Host "⚠️ Sito IIS non configurato. Esegui configure-iis.ps1" -ForegroundColor Yellow
}

Write-Host "🔍 Verifica deploy..." -ForegroundColor Yellow

# Verifica stato servizi
Start-Sleep -Seconds 5

$PM2Status = pm2 jlist | ConvertFrom-Json | Where-Object {$_.name -eq "trasporto-sociale"}
if ($PM2Status -and $PM2Status.pm2_env.status -eq "online") {
    Write-Host "✅ Applicazione Node.js: ONLINE" -ForegroundColor Green
} else {
    Write-Host "❌ Applicazione Node.js: OFFLINE" -ForegroundColor Red
}

$IISStatus = Get-Website -Name "TrasportoSociale" -ErrorAction SilentlyContinue
if ($IISStatus -and $IISStatus.State -eq "Started") {
    Write-Host "✅ Sito IIS: AVVIATO" -ForegroundColor Green
} else {
    Write-Host "❌ Sito IIS: ARRESTATO" -ForegroundColor Red
}

# Test connessione locale
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API Node.js: RISPONDE" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API Node.js: NON RISPONDE" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Deploy completato!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Riepilogo:" -ForegroundColor Cyan
Write-Host "- Applicazione: $AppPath"
Write-Host "- Backup: $BackupFile" -NoNewline
if (-not $SkipBackup) { Write-Host " (creato)" -ForegroundColor Green } else { Write-Host " (saltato)" -ForegroundColor Yellow }
Write-Host "- Log applicazione: $LogDir"
Write-Host ""
Write-Host "🌐 Accesso:" -ForegroundColor Yellow
Write-Host "- URL locale: http://localhost/TrasportoSociale"
Write-Host "- URL produzione: https://ahrw.siatec.it/TrasportoSociale"
Write-Host "- API: http://localhost:3001/api/health"
Write-Host ""
Write-Host "🔧 Comandi utili:" -ForegroundColor Cyan
Write-Host "- Stato PM2: pm2 status"
Write-Host "- Log PM2: pm2 logs trasporto-sociale"
Write-Host "- Stato IIS: Get-Website -Name 'TrasportoSociale'"
Write-Host "- Riavvio app: pm2 restart trasporto-sociale"
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Red
Write-Host "1. Verifica e modifica il file .env con le tue configurazioni"
Write-Host "2. Cambia la password admin di default (admin/admin123)"
Write-Host "3. Configura certificato SSL se non ancora fatto"
Write-Host "4. Verifica che il database sia accessibile"