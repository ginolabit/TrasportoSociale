# Guida al Deploy su Windows Server 2022

## 🖥️ **Configurazione Windows Server 2022**

### **1. Prerequisiti Sistema**

#### Installazione Node.js
```powershell
# Scarica e installa Node.js 18+ LTS
# Vai su https://nodejs.org/en/download/
# Scarica "Windows Installer (.msi)" per x64

# Verifica installazione
node --version
npm --version
```

#### Installazione IIS (Internet Information Services)
```powershell
# Apri PowerShell come Amministratore
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-ASPNET45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter, IIS-HttpCompressionStatic, IIS-HttpCompressionDynamic

# Installa URL Rewrite Module
# Scarica da: https://www.iis.net/downloads/microsoft/url-rewrite
```

#### Installazione PM2 per Windows
```powershell
# Installa PM2 globalmente
npm install -g pm2
npm install -g pm2-windows-startup

# Configura PM2 per l'avvio automatico
pm2-startup install
```

### **2. Configurazione SQL Server**

#### Sicurezza Database
```sql
-- Abilita TCP/IP e configura porta
-- SQL Server Configuration Manager > SQL Server Network Configuration > Protocols for MSSQLSERVER
-- Abilita TCP/IP, imposta porta 1433

-- Crea login dedicato
CREATE LOGIN trasporto_app WITH PASSWORD = 'YourVerySecurePassword123!';

-- Crea utente nel database
USE TrasportoSociale;
CREATE USER trasporto_app FOR LOGIN trasporto_app;

-- Assegna permessi minimi
ALTER ROLE db_datareader ADD MEMBER trasporto_app;
ALTER ROLE db_datawriter ADD MEMBER trasporto_app;
ALTER ROLE db_ddladmin ADD MEMBER trasporto_app;

-- Abilita crittografia (opzionale ma raccomandato)
-- SQL Server Configuration Manager > SQL Server Network Configuration > Protocols for MSSQLSERVER > TCP/IP > Properties > Certificate
```

#### Configurazione Windows Firewall
```powershell
# Apri porta SQL Server (solo per IP specifici)
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow -RemoteAddress "127.0.0.1,::1"

# Apri porte per l'applicazione web
New-NetFirewallRule -DisplayName "Node.js App" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### **3. Configurazione SSL/HTTPS**

#### Opzione A: Certificato Let's Encrypt con win-acme
```powershell
# Scarica win-acme da https://www.win-acme.com/
# Estrai in C:\tools\win-acme\

# Esegui come Amministratore
cd C:\tools\win-acme\
.\wacs.exe

# Segui il wizard per configurare il certificato per ahrw.siatec.it
```

#### Opzione B: Certificato Commerciale
```powershell
# Importa certificato in Windows Certificate Store
# Gestione Computer > Certificati > Computer locale > Personale > Certificati
# Importa il file .pfx del certificato
```

### **4. Deploy dell'Applicazione**

#### Preparazione Directory
```powershell
# Crea directory applicazione
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\TrasportoSociale" -Force

# Imposta permessi
icacls "C:\inetpub\wwwroot\TrasportoSociale" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\TrasportoSociale" /grant "IUSR:(OI)(CI)F" /T
```

#### Upload e Configurazione Codice
```powershell
# Copia i file dell'applicazione in C:\inetpub\wwwroot\TrasportoSociale\

# Naviga nella directory
cd C:\inetpub\wwwroot\TrasportoSociale\

# Copia e configura file ambiente
copy .env.example .env

# Modifica .env con le configurazioni di produzione
notepad .env
```

#### Configurazione .env per Windows
```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=TrasportoSociale
DB_USER=trasporto_app
DB_PASSWORD=YourVerySecurePassword123!
DB_ENCRYPT=true
DB_TRUST_CERT=true

# Server Configuration
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your-very-secure-jwt-secret-key-min-32-characters-long
FRONTEND_URL=https://ahrw.siatec.it

# Additional Security
SESSION_SECRET=your-session-secret-key-change-this-in-production
BCRYPT_ROUNDS=12
```

#### Installazione Dipendenze e Build
```powershell
cd C:\inetpub\wwwroot\TrasportoSociale\

# Installa dipendenze
npm ci --production

# Build applicazione
npm run build
```

### **5. Configurazione IIS**

#### Creazione Sito Web IIS
```powershell
# Importa modulo WebAdministration
Import-Module WebAdministration

# Crea Application Pool
New-WebAppPool -Name "TrasportoSocialePool"
Set-ItemProperty -Path "IIS:\AppPools\TrasportoSocialePool" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TrasportoSocialePool" -Name recycling.periodicRestart.time -Value "00:00:00"

# Crea sito web
New-Website -Name "TrasportoSociale" -Port 443 -PhysicalPath "C:\inetpub\wwwroot\TrasportoSociale\dist" -ApplicationPool "TrasportoSocialePool"

# Configura binding HTTPS
New-WebBinding -Name "TrasportoSociale" -Protocol https -Port 443 -HostHeader "ahrw.siatec.it"

# Configura certificato SSL (sostituisci con il thumbprint del tuo certificato)
$cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object {$_.Subject -like "*ahrw.siatec.it*"}
New-WebBinding -Name "TrasportoSociale" -Protocol https -Port 443 -HostHeader "ahrw.siatec.it" -SslFlags 1
```

#### Configurazione URL Rewrite per React Router
Crea file `web.config` in `C:\inetpub\wwwroot\TrasportoSociale\dist\`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Handle Angular/React Router -->
                <rule name="React Router" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
                
                <!-- Proxy API requests to Node.js -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
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
            </customHeaders>
        </httpProtocol>
        
        <!-- Compression -->
        <urlCompression doStaticCompression="true" doDynamicCompression="true" />
        
        <!-- Static file caching -->
        <staticContent>
            <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
        </staticContent>
    </system.webServer>
</configuration>
```

### **6. Avvio Servizi**

#### Configurazione PM2 per Windows
Crea file `ecosystem.config.js` modificato per Windows:

```javascript
module.exports = {
  apps: [{
    name: 'trasporto-sociale',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Windows specific
    kill_timeout: 1600,
    listen_timeout: 8000,
    wait_ready: true
  }]
};
```

#### Avvio Applicazione
```powershell
cd C:\inetpub\wwwroot\TrasportoSociale\

# Crea directory log
New-Item -ItemType Directory -Path "logs" -Force

# Avvia con PM2
pm2 start ecosystem.config.js

# Salva configurazione
pm2 save

# Verifica stato
pm2 status
pm2 logs trasporto-sociale
```

### **7. Configurazione Sicurezza Avanzata**

#### Windows Defender Firewall
```powershell
# Configura regole firewall più restrittive
New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "HTTP Redirect" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Blocca accesso diretto al database da internet
Remove-NetFirewallRule -DisplayName "SQL Server" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "SQL Server Local" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow -RemoteAddress "127.0.0.1"
```

#### Configurazione IIS Security
```powershell
# Rimuovi header server
Set-WebConfigurationProperty -Filter "system.webServer/security/requestFiltering" -Name "removeServerHeader" -Value $true

# Configura limiti richieste
Set-WebConfigurationProperty -Filter "system.webServer/security/requestFiltering/requestLimits" -Name "maxAllowedContentLength" -Value 10485760

# Abilita solo protocolli sicuri
Set-ItemProperty -Path "IIS:\SslBindings\*!443" -Name "Protocols" -Value "ssl3,tls,tls11,tls12,tls13"
```

### **8. Backup e Monitoraggio**

#### Script Backup PowerShell
Crea `C:\Scripts\backup-trasporto.ps1`:

```powershell
# Script di backup per Trasporto Sociale
$BackupDir = "C:\Backups\TrasportoSociale"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$DBName = "TrasportoSociale"

# Crea directory backup
New-Item -ItemType Directory -Path $BackupDir -Force

# Backup database
$BackupFile = "$BackupDir\db_backup_$Date.bak"
Invoke-Sqlcmd -Query "BACKUP DATABASE [$DBName] TO DISK = '$BackupFile'" -ServerInstance "localhost"

# Backup file applicazione
$AppBackupFile = "$BackupDir\app_backup_$Date.zip"
Compress-Archive -Path "C:\inetpub\wwwroot\TrasportoSociale" -DestinationPath $AppBackupFile

# Mantieni solo gli ultimi 7 backup
Get-ChildItem $BackupDir -Name "*.bak" | Sort-Object CreationTime -Descending | Select-Object -Skip 7 | Remove-Item -Force
Get-ChildItem $BackupDir -Name "*.zip" | Sort-Object CreationTime -Descending | Select-Object -Skip 7 | Remove-Item -Force

Write-Host "Backup completato: $BackupFile"
```

#### Configurazione Task Scheduler
```powershell
# Crea task per backup automatico
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\backup-trasporto.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "TrasportoSociale-Backup" -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings
```

### **9. Monitoraggio e Log**

#### Configurazione Event Log
```powershell
# Crea log personalizzato per l'applicazione
New-EventLog -LogName "TrasportoSociale" -Source "TrasportoSocialeApp"
```

#### Script Monitoraggio
Crea `C:\Scripts\monitor-trasporto.ps1`:

```powershell
# Script di monitoraggio
$AppName = "trasporto-sociale"

# Verifica stato PM2
$PM2Status = pm2 jlist | ConvertFrom-Json
$AppStatus = $PM2Status | Where-Object {$_.name -eq $AppName}

if ($AppStatus.pm2_env.status -ne "online") {
    Write-EventLog -LogName "TrasportoSociale" -Source "TrasportoSocialeApp" -EventId 1001 -EntryType Error -Message "Applicazione non in esecuzione"
    pm2 restart $AppName
}

# Verifica spazio disco
$DiskSpace = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object @{Name="FreeSpaceGB";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
if ($DiskSpace.FreeSpaceGB -lt 5) {
    Write-EventLog -LogName "TrasportoSociale" -Source "TrasportoSocialeApp" -EventId 1002 -EntryType Warning -Message "Spazio disco insufficiente: $($DiskSpace.FreeSpaceGB)GB"
}
```

### **10. Comandi Utili per Manutenzione**

#### Gestione Servizi
```powershell
# Riavvia applicazione
pm2 restart trasporto-sociale

# Visualizza log
pm2 logs trasporto-sociale

# Riavvia IIS
iisreset

# Verifica stato sito
Get-Website -Name "TrasportoSociale"

# Verifica certificato SSL
Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object {$_.Subject -like "*ahrw.siatec.it*"} | Select-Object Subject, NotAfter
```

#### Troubleshooting
```powershell
# Verifica porte in ascolto
netstat -an | findstr ":3001"
netstat -an | findstr ":443"

# Verifica log IIS
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" | Select-Object -Last 50

# Test connessione database
Test-NetConnection -ComputerName localhost -Port 1433

# Verifica configurazione IIS
Get-WebConfiguration -Filter "system.webServer/rewrite/rules"
```

## 🚀 **Checklist Deploy Windows Server 2022**

- [ ] Node.js 18+ installato
- [ ] IIS configurato con URL Rewrite
- [ ] SQL Server configurato con utente dedicato
- [ ] Certificato SSL installato e configurato
- [ ] Firewall Windows configurato
- [ ] Applicazione deployata in C:\inetpub\wwwroot\TrasportoSociale\
- [ ] PM2 configurato per l'avvio automatico
- [ ] Sito IIS creato e configurato
- [ ] Backup automatico configurato
- [ ] Monitoraggio attivo
- [ ] Password admin cambiata (admin/admin123 → nuova password)

## 🔧 **Accesso all'Applicazione**

Dopo il deploy, l'applicazione sarà disponibile su:
- **URL**: https://ahrw.siatec.it/TrasportoSociale
- **Login Admin**: admin / admin123 (CAMBIARE IMMEDIATAMENTE)

## ⚠️ **Note Importanti**

1. **Cambia subito la password admin** dopo il primo accesso
2. **Verifica che SQL Server non sia esposto pubblicamente**
3. **Configura backup regolari** del database e dell'applicazione
4. **Monitora i log** per attività sospette
5. **Mantieni aggiornati** Node.js, IIS e SQL Server
6. **Testa il rinnovo automatico** del certificato SSL

La configurazione è ora ottimizzata per Windows Server 2022 con tutti gli standard di sicurezza necessari per un ambiente di produzione HTTPS.