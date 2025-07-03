# Guida al Deploy di Trasporto Sociale su Server HTTPS

## Panoramica
Questa guida fornisce tutti i passaggi necessari per configurare e deployare l'applicazione Trasporto Sociale su un server con HTTPS all'indirizzo `https://ahrw.siatec.it/TrasportoSociale`.

## Prerequisiti del Server

### 1. Sistema Operativo
- Ubuntu 20.04 LTS o superiore (raccomandato)
- CentOS 8+ o RHEL 8+

### 2. Software Richiesto
```bash
# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Installa Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installa PM2 per la gestione dei processi
sudo npm install -g pm2

# Installa Nginx
sudo apt install nginx -y

# Installa certbot per SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 3. Database SQL Server
- SQL Server 2019 o superiore
- Configurazione per connessioni TCP/IP abilitate
- Firewall configurato per permettere connessioni solo dall'applicazione

## Configurazione di Sicurezza

### 1. Configurazione Database SQL Server

#### Sicurezza della Connessione
```sql
-- Abilita crittografia forzata
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', 
    N'SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQLServer\SuperSocketNetLib', 
    N'ForceEncryption', REG_DWORD, 1;

-- Configura protocolli sicuri
EXEC sp_configure 'remote access', 0;
RECONFIGURE;
```

#### Creazione Utente Dedicato
```sql
-- Crea login dedicato per l'applicazione
CREATE LOGIN trasporto_app WITH PASSWORD = 'YourVerySecurePassword123!';

-- Crea utente nel database
USE TrasportoSociale;
CREATE USER trasporto_app FOR LOGIN trasporto_app;

-- Assegna permessi minimi necessari
ALTER ROLE db_datareader ADD MEMBER trasporto_app;
ALTER ROLE db_datawriter ADD MEMBER trasporto_app;
ALTER ROLE db_ddladmin ADD MEMBER trasporto_app;
```

#### Configurazione Firewall Database
```bash
# Permetti connessioni solo dall'IP del server web
sudo ufw allow from [IP_SERVER_WEB] to any port 1433
```

### 2. Configurazione SSL/TLS

#### Ottenimento Certificato SSL
```bash
# Ottieni certificato Let's Encrypt
sudo certbot --nginx -d ahrw.siatec.it -d www.ahrw.siatec.it

# Verifica auto-rinnovo
sudo certbot renew --dry-run
```

### 3. Configurazione Nginx

#### Copia la configurazione
```bash
# Copia il file di configurazione
sudo cp nginx.conf.example /etc/nginx/sites-available/trasporto-sociale

# Abilita il sito
sudo ln -s /etc/nginx/sites-available/trasporto-sociale /etc/nginx/sites-enabled/

# Rimuovi configurazione default
sudo rm /etc/nginx/sites-enabled/default

# Testa la configurazione
sudo nginx -t

# Riavvia Nginx
sudo systemctl restart nginx
```

## Deploy dell'Applicazione

### 1. Preparazione Directory
```bash
# Crea directory dell'applicazione
sudo mkdir -p /var/www/trasporto-sociale
sudo chown -R www-data:www-data /var/www/trasporto-sociale

# Crea directory per i log
sudo mkdir -p /var/www/trasporto-sociale/logs
sudo chown -R www-data:www-data /var/www/trasporto-sociale/logs
```

### 2. Upload del Codice
```bash
# Carica il codice (esempio con rsync)
rsync -avz --exclude node_modules --exclude .git ./ user@server:/var/www/trasporto-sociale/

# Oppure clona da repository
cd /var/www/trasporto-sociale
sudo -u www-data git clone [YOUR_REPOSITORY_URL] .
```

### 3. Configurazione Ambiente
```bash
# Copia e configura file ambiente
cd /var/www/trasporto-sociale
sudo cp .env.example .env

# Modifica il file .env con le configurazioni di produzione
sudo nano .env
```

#### Configurazione .env per Produzione
```env
# Database Configuration
DB_SERVER=your-sql-server-ip
DB_NAME=TrasportoSociale
DB_USER=trasporto_app
DB_PASSWORD=YourVerySecurePassword123!
DB_ENCRYPT=true
DB_TRUST_CERT=false

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

### 4. Installazione e Build
```bash
cd /var/www/trasporto-sociale

# Installa dipendenze
sudo -u www-data npm ci --production

# Build dell'applicazione
sudo -u www-data npm run build

# Imposta permessi corretti
sudo chown -R www-data:www-data /var/www/trasporto-sociale
sudo chmod -R 755 /var/www/trasporto-sociale
sudo chmod 600 /var/www/trasporto-sociale/.env
```

### 5. Configurazione PM2
```bash
# Avvia l'applicazione con PM2
cd /var/www/trasporto-sociale
sudo -u www-data pm2 start ecosystem.config.js

# Salva configurazione PM2
sudo -u www-data pm2 save

# Configura PM2 per l'avvio automatico
sudo pm2 startup
sudo -u www-data pm2 startup
```

## Configurazioni di Sicurezza Aggiuntive

### 1. Firewall del Server
```bash
# Configura UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permetti SSH (cambia 22 se usi porta diversa)
sudo ufw allow 22

# Permetti HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Permetti connessione al database (solo se necessario)
# sudo ufw allow from [IP_DATABASE] to any port 1433

# Abilita firewall
sudo ufw enable
```

### 2. Configurazione Fail2Ban
```bash
# Installa Fail2Ban
sudo apt install fail2ban -y

# Configura per Nginx
sudo nano /etc/fail2ban/jail.local
```

#### Configurazione Fail2Ban
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

### 3. Monitoraggio e Log
```bash
# Configura logrotate per i log dell'applicazione
sudo nano /etc/logrotate.d/trasporto-sociale
```

#### Configurazione Logrotate
```
/var/www/trasporto-sociale/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload trasporto-sociale
    endscript
}
```

## Backup e Manutenzione

### 1. Script di Backup Database
```bash
# Crea script di backup
sudo nano /usr/local/bin/backup-trasporto-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/trasporto-sociale"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="TrasportoSociale"

mkdir -p $BACKUP_DIR

# Backup database
sqlcmd -S localhost -U sa -P 'YourPassword' -Q "BACKUP DATABASE $DB_NAME TO DISK = '$BACKUP_DIR/db_backup_$DATE.bak'"

# Mantieni solo gli ultimi 7 backup
find $BACKUP_DIR -name "db_backup_*.bak" -mtime +7 -delete

echo "Backup completato: $BACKUP_DIR/db_backup_$DATE.bak"
```

```bash
# Rendi eseguibile
sudo chmod +x /usr/local/bin/backup-trasporto-db.sh

# Aggiungi a crontab per backup automatico
sudo crontab -e
# Aggiungi: 0 2 * * * /usr/local/bin/backup-trasporto-db.sh
```

### 2. Monitoraggio
```bash
# Controlla stato applicazione
sudo pm2 status

# Visualizza log
sudo pm2 logs trasporto-sociale

# Controlla stato Nginx
sudo systemctl status nginx

# Controlla log Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Comandi Utili per la Manutenzione

### Riavvio Servizi
```bash
# Riavvia applicazione
sudo pm2 restart trasporto-sociale

# Riavvia Nginx
sudo systemctl restart nginx

# Ricarica configurazione Nginx
sudo nginx -s reload
```

### Aggiornamento Applicazione
```bash
# Usa lo script di deploy
chmod +x deploy.sh
./deploy.sh
```

### Verifica Sicurezza
```bash
# Test SSL
curl -I https://ahrw.siatec.it/TrasportoSociale

# Verifica headers di sicurezza
curl -I https://ahrw.siatec.it/api/health

# Test rate limiting
for i in {1..20}; do curl https://ahrw.siatec.it/api/health; done
```

## Troubleshooting

### Problemi Comuni

1. **Errore di connessione database**
   ```bash
   # Verifica connettività
   telnet [DB_SERVER] 1433
   
   # Controlla log applicazione
   sudo pm2 logs trasporto-sociale
   ```

2. **Errori SSL**
   ```bash
   # Rinnova certificato
   sudo certbot renew
   
   # Verifica configurazione SSL
   sudo nginx -t
   ```

3. **Problemi di permessi**
   ```bash
   # Ripristina permessi corretti
   sudo chown -R www-data:www-data /var/www/trasporto-sociale
   sudo chmod 600 /var/www/trasporto-sociale/.env
   ```

## Checklist Post-Deploy

- [ ] Applicazione accessibile su https://ahrw.siatec.it/TrasportoSociale
- [ ] Login amministratore funzionante (admin/admin123 - CAMBIARE SUBITO)
- [ ] Database connesso e funzionante
- [ ] SSL/TLS configurato correttamente
- [ ] Rate limiting attivo
- [ ] Backup automatico configurato
- [ ] Monitoraggio attivo
- [ ] Log rotation configurato
- [ ] Firewall configurato
- [ ] Fail2Ban attivo

## Sicurezza Post-Deploy

1. **Cambia immediatamente la password dell'admin di default**
2. **Verifica che il database non sia esposto pubblicamente**
3. **Configura backup regolari**
4. **Monitora i log per attività sospette**
5. **Mantieni aggiornati tutti i componenti**

## Contatti e Supporto

Per problemi o domande relative al deploy, consulta i log dell'applicazione e del server. Assicurati di avere sempre backup aggiornati prima di apportare modifiche.