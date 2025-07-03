# Script di backup database per Trasporto Sociale
# Eseguire come Amministratore o con account che ha accesso a SQL Server

param(
    [string]$ServerInstance = "localhost",
    [string]$DatabaseName = "TrasportoSociale",
    [string]$BackupPath = "C:\Backups\TrasportoSociale",
    [string]$Username = "",
    [string]$Password = "",
    [int]$RetentionDays = 7
)

Write-Host "💾 Backup Database Trasporto Sociale" -ForegroundColor Green

# Importa modulo SQL Server se disponibile
try {
    Import-Module SqlServer -ErrorAction Stop
} catch {
    Write-Warning "Modulo SqlServer non disponibile. Tentativo con Invoke-Sqlcmd..."
}

# Crea directory backup se non esiste
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "Directory backup creata: $BackupPath" -ForegroundColor Green
}

$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupPath "TrasportoSociale_$Date.bak"

Write-Host "📦 Avvio backup database..." -ForegroundColor Yellow
Write-Host "- Server: $ServerInstance"
Write-Host "- Database: $DatabaseName"
Write-Host "- File backup: $BackupFile"

try {
    # Costruisci query di backup
    $BackupQuery = "BACKUP DATABASE [$DatabaseName] TO DISK = '$BackupFile' WITH FORMAT, INIT, COMPRESSION"
    
    # Parametri per la connessione
    $SqlParams = @{
        ServerInstance = $ServerInstance
        Query = $BackupQuery
        QueryTimeout = 300
    }
    
    # Aggiungi credenziali se specificate
    if ($Username -and $Password) {
        $SqlParams.Username = $Username
        $SqlParams.Password = $Password
    }
    
    # Esegui backup
    Invoke-Sqlcmd @SqlParams
    
    Write-Host "✅ Backup completato con successo!" -ForegroundColor Green
    
    # Verifica dimensione file backup
    $BackupFileInfo = Get-Item $BackupFile
    $SizeMB = [math]::Round($BackupFileInfo.Length / 1MB, 2)
    Write-Host "📊 Dimensione backup: $SizeMB MB" -ForegroundColor Cyan
    
} catch {
    Write-Error "❌ Errore durante il backup: $_"
    exit 1
}

Write-Host "🧹 Pulizia backup vecchi..." -ForegroundColor Yellow

# Rimuovi backup più vecchi di RetentionDays
try {
    $OldBackups = Get-ChildItem -Path $BackupPath -Filter "TrasportoSociale_*.bak" | 
                  Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) }
    
    if ($OldBackups) {
        foreach ($OldBackup in $OldBackups) {
            Remove-Item $OldBackup.FullName -Force
            Write-Host "🗑️ Rimosso backup vecchio: $($OldBackup.Name)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Nessun backup vecchio da rimuovere" -ForegroundColor Green
    }
} catch {
    Write-Warning "Errore durante la pulizia backup vecchi: $_"
}

Write-Host "📋 Riepilogo backup:" -ForegroundColor Cyan
$AllBackups = Get-ChildItem -Path $BackupPath -Filter "TrasportoSociale_*.bak" | Sort-Object CreationTime -Descending
Write-Host "- Backup totali: $($AllBackups.Count)"
Write-Host "- Backup più recente: $($AllBackups[0].Name)"
Write-Host "- Spazio totale: $([math]::Round(($AllBackups | Measure-Object Length -Sum).Sum / 1MB, 2)) MB"

Write-Host ""
Write-Host "✅ Operazione completata!" -ForegroundColor Green
Write-Host "📁 Backup salvato in: $BackupFile" -ForegroundColor Cyan