# Script per configurazione SSL con Let's Encrypt usando win-acme
# Eseguire come Amministratore

param(
    [string]$Domain = "ahrw.siatec.it",
    [string]$Email = "admin@siatec.it",
    [string]$WinAcmePath = "C:\tools\win-acme"
)

Write-Host "🔒 Configurazione SSL per $Domain" -ForegroundColor Green

# Verifica privilegi amministratore
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Questo script deve essere eseguito come Amministratore!"
    exit 1
}

Write-Host "📥 Download win-acme..." -ForegroundColor Yellow

# Crea directory per win-acme
if (-not (Test-Path $WinAcmePath)) {
    New-Item -ItemType Directory -Path $WinAcmePath -Force | Out-Null
}

# Download win-acme se non presente
$WinAcmeExe = Join-Path $WinAcmePath "wacs.exe"
if (-not (Test-Path $WinAcmeExe)) {
    $DownloadUrl = "https://github.com/win-acme/win-acme/releases/latest/download/win-acme.v2.2.9.1701.x64.pluggable.zip"
    $ZipFile = Join-Path $WinAcmePath "win-acme.zip"
    
    try {
        Write-Host "Download win-acme da GitHub..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipFile -UseBasicParsing
        
        Write-Host "Estrazione archivio..." -ForegroundColor Cyan
        Expand-Archive -Path $ZipFile -DestinationPath $WinAcmePath -Force
        
        Remove-Item $ZipFile -Force
        Write-Host "win-acme installato in $WinAcmePath" -ForegroundColor Green
    } catch {
        Write-Error "Errore durante il download di win-acme: $_"
        exit 1
    }
}

Write-Host "🌐 Verifica configurazione IIS..." -ForegroundColor Yellow

# Verifica che il sito IIS sia configurato
Import-Module WebAdministration
$Site = Get-Website -Name "TrasportoSociale" -ErrorAction SilentlyContinue

if (-not $Site) {
    Write-Error "Sito IIS 'TrasportoSociale' non trovato. Configura prima IIS."
    exit 1
}

# Verifica binding HTTP
$HttpBinding = Get-WebBinding -Name "TrasportoSociale" -Protocol "http" -ErrorAction SilentlyContinue
if (-not $HttpBinding) {
    Write-Host "Aggiunta binding HTTP per validazione..." -ForegroundColor Cyan
    New-WebBinding -Name "TrasportoSociale" -Protocol http -Port 80 -HostHeader $Domain
}

Write-Host "🔐 Richiesta certificato SSL..." -ForegroundColor Yellow

# Prepara parametri per win-acme
$WinAcmeArgs = @(
    "--target", "iis",
    "--siteid", $Site.Id,
    "--host", $Domain,
    "--emailaddress", $Email,
    "--accepttos",
    "--unattended"
)

try {
    # Esegui win-acme
    Push-Location $WinAcmePath
    & .\wacs.exe $WinAcmeArgs
    Pop-Location
    
    Write-Host "✅ Certificato SSL richiesto" -ForegroundColor Green
    
} catch {
    Write-Error "Errore durante la richiesta del certificato: $_"
    exit 1
}

Write-Host "🔍 Verifica certificato..." -ForegroundColor Yellow

# Verifica che il certificato sia stato installato
Start-Sleep -Seconds 5
$Certificate = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*$Domain*" } | Sort-Object NotAfter -Descending | Select-Object -First 1

if ($Certificate) {
    Write-Host "✅ Certificato SSL installato:" -ForegroundColor Green
    Write-Host "- Subject: $($Certificate.Subject)"
    Write-Host "- Thumbprint: $($Certificate.Thumbprint)"
    Write-Host "- Scadenza: $($Certificate.NotAfter)"
    
    # Verifica binding HTTPS
    $HttpsBinding = Get-WebBinding -Name "TrasportoSociale" -Protocol "https" -ErrorAction SilentlyContinue
    if ($HttpsBinding) {
        Write-Host "✅ Binding HTTPS configurato" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Binding HTTPS non trovato, configurazione manuale necessaria" -ForegroundColor Yellow
    }
    
} else {
    Write-Warning "Certificato SSL non trovato. Verifica i log di win-acme."
}

Write-Host "🔄 Configurazione rinnovo automatico..." -ForegroundColor Yellow

# Verifica task schedulato per il rinnovo
$RenewalTask = Get-ScheduledTask -TaskName "*win-acme*" -ErrorAction SilentlyContinue
if ($RenewalTask) {
    Write-Host "✅ Task di rinnovo automatico configurato" -ForegroundColor Green
    Write-Host "- Nome task: $($RenewalTask.TaskName)"
    Write-Host "- Prossima esecuzione: $($RenewalTask.NextRunTime)"
} else {
    Write-Warning "Task di rinnovo automatico non trovato"
}

Write-Host "🔒 Configurazione sicurezza SSL..." -ForegroundColor Yellow

# Configura protocolli SSL sicuri
try {
    # Disabilita SSL 2.0 e 3.0
    $SSLRegPath = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols"
    
    foreach ($Protocol in @("SSL 2.0", "SSL 3.0")) {
        $ProtocolPath = "$SSLRegPath\$Protocol\Server"
        if (-not (Test-Path $ProtocolPath)) {
            New-Item -Path $ProtocolPath -Force | Out-Null
        }
        Set-ItemProperty -Path $ProtocolPath -Name "Enabled" -Value 0 -Type DWord
        Set-ItemProperty -Path $ProtocolPath -Name "DisabledByDefault" -Value 1 -Type DWord
    }
    
    # Abilita TLS 1.2 e 1.3
    foreach ($Protocol in @("TLS 1.2", "TLS 1.3")) {
        $ProtocolPath = "$SSLRegPath\$Protocol\Server"
        if (-not (Test-Path $ProtocolPath)) {
            New-Item -Path $ProtocolPath -Force | Out-Null
        }
        Set-ItemProperty -Path $ProtocolPath -Name "Enabled" -Value 1 -Type DWord
        Set-ItemProperty -Path $ProtocolPath -Name "DisabledByDefault" -Value 0 -Type DWord
    }
    
    Write-Host "✅ Protocolli SSL configurati" -ForegroundColor Green
    
} catch {
    Write-Warning "Errore nella configurazione protocolli SSL: $_"
}

Write-Host "🌐 Test configurazione SSL..." -ForegroundColor Yellow

# Test connessione HTTPS
try {
    $TestUrl = "https://$Domain"
    $Response = Invoke-WebRequest -Uri $TestUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Test HTTPS riuscito - Status: $($Response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Warning "Test HTTPS fallito: $_"
    Write-Host "Verifica che il DNS punti al server e che il firewall permetta la porta 443" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Configurazione SSL completata!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Riepilogo:" -ForegroundColor Cyan
Write-Host "- Dominio: $Domain"
Write-Host "- Certificato: $(if($Certificate){'Installato'}else{'Non trovato'})"
Write-Host "- Rinnovo automatico: $(if($RenewalTask){'Configurato'}else{'Da configurare'})"
Write-Host "- win-acme: $WinAcmePath"
Write-Host ""
Write-Host "🔧 Comandi utili:" -ForegroundColor Yellow
Write-Host "- Verifica certificato: Get-ChildItem Cert:\LocalMachine\My | Where-Object {`$_.Subject -like '*$Domain*'}"
Write-Host "- Test rinnovo: cd $WinAcmePath; .\wacs.exe --test --verbose"
Write-Host "- Log win-acme: Get-Content '$WinAcmePath\log*.txt'"
Write-Host ""
Write-Host "⚠️ Note importanti:" -ForegroundColor Red
Write-Host "1. Assicurati che il DNS di $Domain punti a questo server"
Write-Host "2. Verifica che la porta 80 e 443 siano aperte nel firewall"
Write-Host "3. Il certificato si rinnoverà automaticamente ogni 60 giorni"