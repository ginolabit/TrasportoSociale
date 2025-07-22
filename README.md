# Sistema di Gestione Trasporto Sociale

Un'applicazione web completa per la gestione del trasporto sociale, sviluppata con React, TypeScript, Node.js e SQL Server.

## Caratteristiche

- **Dashboard completa** con statistiche e panoramica
- **Calendario interattivo** per la gestione dei trasporti
- **Gestione utenti, autisti e destinazioni**
- **Sistema di report avanzato** con esportazione CSV
- **Modalità scura/chiara**
- **Database SQL Server** per la persistenza dei dati
- **API RESTful** per la comunicazione client-server
- **Design responsive** ottimizzato per tutti i dispositivi

## Tecnologie Utilizzate

### Frontend
- React 18 con TypeScript
- Tailwind CSS per lo styling
- Lucide React per le icone
- Axios per le chiamate API
- Vite come build tool

### Backend
- Node.js con Express
- SQL Server come database
- MSSQL driver per Node.js
- CORS per la gestione delle richieste cross-origin

## Prerequisiti

- Node.js (versione 16 o superiore)
- SQL Server (2019 o superiore)
- npm o yarn

## Installazione

### 1. Clona il repository
```bash
git clone <repository-url>
cd trasporto-sociale
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configura il database

#### Opzione A: Configurazione automatica
Il server creerà automaticamente il database e le tabelle al primo avvio.

#### Opzione B: Configurazione manuale
Esegui lo script SQL fornito:
```sql
-- Esegui il file database/create_database.sql in SQL Server Management Studio
```

### 4. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env` e modifica i parametri:

```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=TrasportoSociale
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Server Configuration
PORT=3001
```

### 5. Avvia l'applicazione

#### Sviluppo
```bash
# Terminal 1 - Avvia il server backend
npm run server

# Terminal 2 - Avvia il frontend
npm run dev
```

#### Produzione
```bash
# Build del frontend
npm run build

# Avvia il server
npm run server
```

## Struttura del Database

### Tabelle

#### Users
- `id` (NVARCHAR(50), PRIMARY KEY)
- `name` (NVARCHAR(255), NOT NULL)
- `phone` (NVARCHAR(50))
- `address` (NVARCHAR(500))
- `notes` (NVARCHAR(1000))
- `createdAt` (DATETIME2)

#### Drivers
- `id` (NVARCHAR(50), PRIMARY KEY)
- `name` (NVARCHAR(255), NOT NULL)
- `phone` (NVARCHAR(50))
- `licenseNumber` (NVARCHAR(100))
- `notes` (NVARCHAR(1000))
- `createdAt` (DATETIME2)

#### Destinations
- `id` (NVARCHAR(50), PRIMARY KEY)
- `name` (NVARCHAR(255), NOT NULL)
- `address` (NVARCHAR(500), NOT NULL)
- `cost` (DECIMAL(10,2), NOT NULL)
- `notes` (NVARCHAR(1000))
- `createdAt` (DATETIME2)

#### Transports
- `id` (NVARCHAR(50), PRIMARY KEY)
- `date` (DATE, NOT NULL)
- `time` (TIME, NOT NULL)
- `userId` (NVARCHAR(50), FOREIGN KEY)
- `driverId` (NVARCHAR(50), FOREIGN KEY)
- `destinationId` (NVARCHAR(50), FOREIGN KEY)
- `notes` (NVARCHAR(1000))
- `createdAt` (DATETIME2)

## API Endpoints

### Users
- `GET /api/users` - Ottieni tutti gli utenti
- `POST /api/users` - Crea un nuovo utente
- `PUT /api/users/:id` - Aggiorna un utente
- `DELETE /api/users/:id` - Elimina un utente

### Drivers
- `GET /api/drivers` - Ottieni tutti gli autisti
- `POST /api/drivers` - Crea un nuovo autista
- `PUT /api/drivers/:id` - Aggiorna un autista
- `DELETE /api/drivers/:id` - Elimina un autista

### Destinations
- `GET /api/destinations` - Ottieni tutte le destinazioni
- `POST /api/destinations` - Crea una nuova destinazione
- `PUT /api/destinations/:id` - Aggiorna una destinazione
- `DELETE /api/destinations/:id` - Elimina una destinazione

### Transports
- `GET /api/transports` - Ottieni tutti i trasporti
- `POST /api/transports` - Crea un nuovo trasporto
- `PUT /api/transports/:id` - Aggiorna un trasporto
- `DELETE /api/transports/:id` - Elimina un trasporto

### Health Check
- `GET /api/health` - Verifica lo stato del server

## Funzionalità Principali

### Dashboard
- Statistiche in tempo reale
- Trasporti del giorno corrente
- Accesso rapido alle sezioni principali

### Calendario
- Vista mensile, settimanale e giornaliera
- Aggiunta rapida di trasporti
- Visualizzazione intuitiva degli appuntamenti

### Gestione Entità
- CRUD completo per utenti, autisti e destinazioni
- Interfacce intuitive con validazione

### Report
- Filtri avanzati per data, utente, autista e destinazione
- Esportazione in formato CSV
- Statistiche aggregate

### Impostazioni
- Modalità scura/chiara
- Stato connessione database
- Aggiornamento dati

## Sicurezza

- Validazione input lato server
- Parametri SQL per prevenire SQL injection
- Gestione errori centralizzata
- Connessioni database sicure

## Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Supporto

Per supporto o domande, contatta [email@example.com](mailto:email@example.com).