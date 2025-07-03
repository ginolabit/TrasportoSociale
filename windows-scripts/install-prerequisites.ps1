# Script di installazione prerequisiti per Windows Server 2022
# Eseguire come Amministratore

Write-Host "🚀 Installazione prerequisiti per Trasporto Sociale su Windows Server 2022" -ForegroundColor Green

# Verifica privilegi amministratore
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Questo script deve essere eseguito come Amministratore!"
    exit 1
}

# Funzione per verificare se un programma è installato
function Test-ProgramInstalled($programName) {
    $installed = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object { $_.DisplayName -like "*$programName*" }
    return $installed -ne $null
}

Write-Host "📦 Installazione funzionalità IIS..." -ForegroundColor Yellow

# Installa IIS e funzionalità necessarie
$features = @(
    "IIS-WebServerRole",
    "IIS-WebServer", 
    "IIS-CommonHttpFeatures",
    "IIS-HttpErrors",
    "IIS-HttpLogging",
    "IIS-RequestFiltering",
    "IIS-StaticContent",
    "IIS-DefaultDocument",
    "IIS-DirectoryBrowsing",
    "IIS-ASPNET45",
    "IIS-NetFxExtensibility45",
    "IIS-ISAPIExtensions",
    "IIS-ISAPIFilter",
    "IIS-HttpCompressionStatic",
    "IIS-HttpCompressionDynamic",
    "IIS-ManagementConsole"
)

foreach ($feature in $features) {
    Write-Host "Installazione $feature..." -ForegroundColor Cyan
    Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart
}

Write-Host "📥 Download e installazione Node.js..." -ForegroundColor Yellow

# Verifica se Node.js è già installato
if (Test-ProgramInstalled "Node.js") {
    Write-Host "Node.js già installato" -ForegroundColor Green
    node --version
} else {
    # Download e installa Node.js LTS
    $nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs.msi"
    
    Write-Host "Download Node.js da $nodeUrl..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    
    Write-Host "Installazione Node.js..." -ForegroundColor Cyan
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet /norestart"
    
    # Aggiorna PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    Remove-Item $nodeInstaller -Force
    Write-Host "Node.js installato con successo" -ForegroundColor Green
}

Write-Host "🔧 Installazione PM2..." -ForegroundColor Yellow

# Installa PM2
try {
    npm install -g pm2
    npm install -g pm2-windows-startup
    Write-Host "PM2 installato con successo" -ForegroundColor Green
} catch {
    Write-Error "Errore durante l'installazione di PM2: $_"
}

Write-Host "🌐 Download URL Rewrite Module..." -ForegroundColor Yellow

# Download e installa URL Rewrite Module
if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
    Import-Module WebAdministration
}

$urlRewriteInstalled = Get-WindowsFeature -Name "IIS-URLRewrite" -ErrorAction SilentlyContinue
if (-not $urlRewriteInstalled -or $urlRewriteInstalled.InstallState -ne "Installed") {
    $rewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
    $rewriteInstaller = "$env:TEMP\urlrewrite.msi"
    
    Write-Host "Download URL Rewrite Module..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $rewriteUrl -OutFile $rewriteInstaller
    
    Write-Host "Installazione URL Rewrite Module..." -ForegroundColor Cyan
    Start-Process msiexec.exe -Wait -ArgumentList "/i $rewriteInstaller /quiet /norestart"
    
    Remove-Item $rewriteInstaller -Force
    Write-Host "URL Rewrite Module installato" -ForegroundColor Green
} else {
    Write-Host "URL Rewrite Module già installato" -ForegroundColor Green
}

Write-Host "🔥 Configurazione Windows Firewall..." -ForegroundColor Yellow

# Configura firewall
$firewallRules = @(
    @{Name="HTTP-In"; Port=80; Protocol="TCP"},
    @{Name="HTTPS-In"; Port=443; Protocol="TCP"},
    @{Name="Node.js-App"; Port=3001; Protocol="TCP"}
)

foreach ($rule in $firewallRules) {
    $existingRule = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol $rule.Protocol -LocalPort $rule.Port -Action Allow
        Write-Host "Regola firewall '$($rule.Name)' creata" -ForegroundColor Green
    } else {
        Write-Host "Regola firewall '$($rule.Name)' già esistente" -ForegroundColor Yellow
    }
}

Write-Host "📁 Creazione directory applicazione..." -ForegroundColor Yellow

# Crea directory per l'applicazione
$appDir = "C:\inetpub\wwwroot\TrasportoSociale"
if (-not (Test-Path $appDir)) {
    New-Item -ItemType Directory -Path $appDir -Force
    Write-Host "Directory $appDir creata" -ForegroundColor Green
} else {
    Write-Host "Directory $appDir già esistente" -ForegroundColor Yellow
}

# Imposta permessi
icacls $appDir /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls $appDir /grant "IUSR:(OI)(CI)F" /T

# Crea directory per script e backup
$scriptsDir = "C:\Scripts"
$backupDir = "C:\Backups\TrasportoSociale"

foreach ($dir in @($scriptsDir, $backupDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Directory $dir creata" -ForegroundColor Green
    }
}

Write-Host "🎯 Configurazione PM2 per avvio automatico..." -ForegroundColor Yellow

# Configura PM2 per l'avvio automatico
try {
    pm2-startup install
    Write-Host "PM2 configurato per l'avvio automatico" -ForegroundColor Green
} catch {
    Write-Warning "Errore nella configurazione PM2 startup: $_"
}

Write-Host "✅ Installazione prerequisiti completata!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prossimi passi:" -ForegroundColor Cyan
Write-Host "1. Configura SQL Server con utente dedicato"
Write-Host "2. Installa certificato SSL"
Write-Host "3. Copia i file dell'applicazione in $appDir"
Write-Host "4. Configura il file .env"
Write-Host "5. Esegui npm ci --production e npm run build"
Write-Host "6. Configura IIS e avvia l'applicazione"
Write-Host ""
Write-Host "🔧 Verifica installazione:" -ForegroundColor Yellow
Write-Host "- Node.js: $(node --version)"
Write-Host "- NPM: $(npm --version)"
Write-Host "- PM2: $(pm2 --version)"
Write-Host "- IIS: $(Get-WindowsFeature -Name IIS-WebServerRole | Select-Object -ExpandProperty InstallState)"