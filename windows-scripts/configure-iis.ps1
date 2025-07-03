# Script di configurazione IIS per Trasporto Sociale
# Eseguire come Amministratore dopo aver copiato i file dell'applicazione

param(
    [string]$SiteName = "TrasportoSociale",
    [string]$AppPath = "C:\inetpub\wwwroot\TrasportoSociale",
    [string]$Domain = "ahrw.siatec.it",
    [string]$CertThumbprint = ""
)

Write-Host "🌐 Configurazione IIS per Trasporto Sociale" -ForegroundColor Green

# Verifica privilegi amministratore
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Questo script deve essere eseguito come Amministratore!"
    exit 1
}

# Importa modulo WebAdministration
Import-Module WebAdministration

Write-Host "🏗️ Creazione Application Pool..." -ForegroundColor Yellow

# Rimuovi Application Pool esistente se presente
if (Get-IISAppPool -Name "${SiteName}Pool" -ErrorAction SilentlyContinue) {
    Remove-WebAppPool -Name "${SiteName}Pool"
    Write-Host "Application Pool esistente rimosso" -ForegroundColor Yellow
}

# Crea nuovo Application Pool
New-WebAppPool -Name "${SiteName}Pool"
Set-ItemProperty -Path "IIS:\AppPools\${SiteName}Pool" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\${SiteName}Pool" -Name recycling.periodicRestart.time -Value "00:00:00"
Set-ItemProperty -Path "IIS:\AppPools\${SiteName}Pool" -Name processModel.idleTimeout -Value "00:00:00"
Set-ItemProperty -Path "IIS:\AppPools\${SiteName}Pool" -Name managedRuntimeVersion -Value ""

Write-Host "Application Pool '${SiteName}Pool' creato" -ForegroundColor Green

Write-Host "🌍 Creazione sito web..." -ForegroundColor Yellow

# Rimuovi sito esistente se presente
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Remove-Website -Name $SiteName
    Write-Host "Sito esistente rimosso" -ForegroundColor Yellow
}

# Crea sito web
$distPath = Join-Path $AppPath "dist"
if (-not (Test-Path $distPath)) {
    Write-Error "Directory dist non trovata in $distPath. Assicurati di aver eseguito 'npm run build'"
    exit 1
}

New-Website -Name $SiteName -Port 80 -PhysicalPath $distPath -ApplicationPool "${SiteName}Pool"

# Aggiungi binding HTTPS se specificato certificato
if ($CertThumbprint) {
    New-WebBinding -Name $SiteName -Protocol https -Port 443 -HostHeader $Domain
    
    # Associa certificato
    $cert = Get-ChildItem -Path Cert:\LocalMachine\My\$CertThumbprint -ErrorAction SilentlyContinue
    if ($cert) {
        $binding = Get-WebBinding -Name $SiteName -Protocol https
        $binding.AddSslCertificate($CertThumbprint, "my")
        Write-Host "Certificato SSL associato" -ForegroundColor Green
    } else {
        Write-Warning "Certificato con thumbprint $CertThumbprint non trovato"
    }
} else {
    Write-Host "⚠️ Nessun certificato SSL specificato. Aggiungi manualmente il binding HTTPS" -ForegroundColor Yellow
}

Write-Host "📝 Creazione file web.config..." -ForegroundColor Yellow

# Crea web.config per URL rewriting e proxy API
$webConfigContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Proxy API requests to Node.js -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
                    </serverVariables>
                </rule>
                
                <!-- Handle React Router -->
                <rule name="React Router" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
        
        <!-- Security Headers -->
        <httpProtocol>
            <customHeaders>
                <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains; preload" />
                <add name="X-Frame-Options" value="SAMEORIGIN" />
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="X-XSS-Protection" value="1; mode=block" />
                <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
                <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';" />
                <remove name="Server" />
            </customHeaders>
        </httpProtocol>
        
        <!-- Compression -->
        <urlCompression doStaticCompression="true" doDynamicCompression="true" />
        
        <!-- Static file caching -->
        <staticContent>
            <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
            <remove fileExtension=".json" />
            <mimeMap fileExtension=".json" mimeType="application/json" />
        </staticContent>
        
        <!-- Security -->
        <security>
            <requestFiltering removeServerHeader="true">
                <requestLimits maxAllowedContentLength="10485760" />
            </requestFiltering>
        </security>
        
        <!-- Default document -->
        <defaultDocument>
            <files>
                <clear />
                <add value="index.html" />
            </files>
        </defaultDocument>
    </system.webServer>
</configuration>
"@

$webConfigPath = Join-Path $distPath "web.config"
$webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8
Write-Host "File web.config creato in $webConfigPath" -ForegroundColor Green

Write-Host "🔧 Configurazione avanzata IIS..." -ForegroundColor Yellow

# Configura compressione
Set-WebConfigurationProperty -Filter "system.webServer/httpCompression" -Name "directory" -Value "%SystemDrive%\inetpub\temp\IIS Temporary Compressed Files"
Set-WebConfigurationProperty -Filter "system.webServer/httpCompression" -Name "doDynamicCompression" -Value $true
Set-WebConfigurationProperty -Filter "system.webServer/httpCompression" -Name "doStaticCompression" -Value $true

# Configura limiti di sicurezza
Set-WebConfigurationProperty -Filter "system.webServer/security/requestFiltering/requestLimits" -Name "maxAllowedContentLength" -Value 10485760
Set-WebConfigurationProperty -Filter "system.webServer/security/requestFiltering" -Name "allowDoubleEscaping" -Value $false

# Abilita server variables per proxy
Set-WebConfigurationProperty -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." -Value @{name="HTTP_X_FORWARDED_PROTO"}
Set-WebConfigurationProperty -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." -Value @{name="HTTP_X_FORWARDED_HOST"}

Write-Host "🚀 Avvio sito web..." -ForegroundColor Yellow

# Avvia Application Pool e sito
Start-WebAppPool -Name "${SiteName}Pool"
Start-Website -Name $SiteName

Write-Host "✅ Configurazione IIS completata!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Riepilogo configurazione:" -ForegroundColor Cyan
Write-Host "- Sito: $SiteName"
Write-Host "- Application Pool: ${SiteName}Pool"
Write-Host "- Path fisico: $distPath"
Write-Host "- Binding HTTP: *:80"
if ($CertThumbprint) {
    Write-Host "- Binding HTTPS: ${Domain}:443"
}
Write-Host ""
Write-Host "🔧 Prossimi passi:" -ForegroundColor Yellow
Write-Host "1. Avvia l'applicazione Node.js con PM2"
Write-Host "2. Testa l'accesso al sito"
Write-Host "3. Configura certificato SSL se non ancora fatto"
Write-Host "4. Verifica i log per eventuali errori"
Write-Host ""
Write-Host "📊 Comandi utili:" -ForegroundColor Cyan
Write-Host "- Stato sito: Get-Website -Name '$SiteName'"
Write-Host "- Stato app pool: Get-WebAppPool -Name '${SiteName}Pool'"
Write-Host "- Log IIS: Get-Content 'C:\inetpub\logs\LogFiles\W3SVC*\*.log' | Select-Object -Last 10"