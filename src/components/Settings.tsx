import React from 'react';
import { Download, Upload, Sun, Moon, Database, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { exportAllData, importAllData } from '../utils/storage';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOnline: boolean;
  onRefreshData: () => void;
}

export default function Settings({ 
  darkMode, 
  onToggleDarkMode, 
  isOnline, 
  onRefreshData 
}: SettingsProps) {
  const handleExport = () => {
    exportAllData();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importAllData(file);
      
      if (confirm('Importando i dati dal file locale, i dati nel database non verranno modificati. Continuare?')) {
        // Note: This would need to be implemented to sync with database
        alert('Funzionalità di importazione non ancora implementata per il database.');
      }
    } catch (error) {
      alert('Errore durante l\'importazione dei dati. Verifica che il file sia corretto.');
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Impostazioni
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Gestisci le preferenze dell'applicazione e i dati
        </p>
      </div>

      <div className="space-y-6">
        {/* Database Status Section */}
        <div className={`rounded-lg shadow-sm border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Stato Database
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Connessione Database
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isOnline ? 'Connesso a SQL Server' : 'Disconnesso dal database'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Aggiorna Dati
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ricarica tutti i dati dal database
                </p>
              </div>
              <button
                onClick={onRefreshData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Aggiorna</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className={`rounded-lg shadow-sm border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Aspetto
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Modalità Tema
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Scegli tra modalità chiara e scura
              </p>
            </div>
            <button
              onClick={onToggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-sm">
                {darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
              </span>
            </button>
          </div>
        </div>

        {/* Data Management Section */}
        <div className={`rounded-lg shadow-sm border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Gestione Dati (Legacy)
          </h2>
          
          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Esporta Dati Locali
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Scarica un backup dei dati locali in formato JSON (solo per compatibilità)
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Esporta</span>
              </button>
            </div>

            {/* Import Data */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Importa Dati Locali
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Carica un backup precedente (non modifica il database)
                </p>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Importa</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className={`rounded-lg shadow-sm border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Informazioni
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Versione
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                2.0.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tipo di Storage
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                SQL Server Database
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                API Server
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Node.js + Express
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Compatibilità
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Multi-utente
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}