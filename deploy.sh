#!/bin/bash

# Script di deploy per Trasporto Sociale
# Assicurati di avere i permessi di esecuzione: chmod +x deploy.sh

set -e

echo "🚀 Avvio deploy di Trasporto Sociale..."

# Variabili di configurazione
APP_DIR="/var/www/trasporto-sociale"
BACKUP_DIR="/var/backups/trasporto-sociale"
SERVICE_NAME="trasporto-sociale"

# Crea directory di backup se non esiste
sudo mkdir -p $BACKUP_DIR

# Backup del database (opzionale)
echo "📦 Creazione backup database..."
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
# Sostituisci con i tuoi parametri di connessione
# sqlcmd -S localhost -U sa -P 'YourPassword' -Q "BACKUP DATABASE TrasportoSociale TO DISK = '$BACKUP_FILE'"

# Ferma il servizio
echo "⏹️ Arresto servizio..."
sudo pm2 stop $SERVICE_NAME || true

# Backup dei file attuali
echo "💾 Backup file attuali..."
if [ -d "$APP_DIR" ]; then
    sudo cp -r $APP_DIR $BACKUP_DIR/app_backup_$(date +%Y%m%d_%H%M%S)
fi

# Crea directory dell'applicazione
sudo mkdir -p $APP_DIR

# Copia i nuovi file
echo "📁 Copia nuovi file..."
sudo cp -r ./* $APP_DIR/
sudo chown -R www-data:www-data $APP_DIR

# Installa dipendenze
echo "📦 Installazione dipendenze..."
cd $APP_DIR
sudo -u www-data npm ci --production

# Build dell'applicazione
echo "🔨 Build applicazione..."
sudo -u www-data npm run build

# Copia file di configurazione
echo "⚙️ Configurazione ambiente..."
if [ ! -f "$APP_DIR/.env" ]; then
    sudo cp $APP_DIR/.env.example $APP_DIR/.env
    echo "⚠️ ATTENZIONE: Modifica il file .env con le tue configurazioni!"
fi

# Avvia il servizio
echo "▶️ Avvio servizio..."
cd $APP_DIR
sudo pm2 start ecosystem.config.js

# Ricarica Nginx
echo "🔄 Ricarica Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy completato con successo!"
echo "🌐 L'applicazione è disponibile su: https://ahrw.siatec.it/TrasportoSociale"
echo ""
echo "📋 Prossimi passi:"
echo "1. Verifica il file .env in $APP_DIR/.env"
echo "2. Controlla i log con: sudo pm2 logs $SERVICE_NAME"
echo "3. Monitora lo stato con: sudo pm2 status"