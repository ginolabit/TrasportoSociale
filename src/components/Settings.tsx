import React, { useState } from 'react';
import { Download, Upload, Sun, Moon, Database, RefreshCw, Wifi, WifiOff, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
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
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazioni
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Compila tutti i campi' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Le nuove password non coincidono' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nuova password deve essere di almeno 6 caratteri' });
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordMessage({ type: 'error', text: 'La nuova password deve essere diversa da quella attuale' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password cambiata con successo!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setPasswordMessage(null), 3000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Errore durante il cambio password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Errore di connessione. Riprova più tardi.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMessage(null);
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Troppo corta', color: 'text-red-600' };
    if (password.length < 8) return { strength: 2, label: 'Debole', color: 'text-orange-600' };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Media', color: 'text-yellow-600' };
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { strength: 4, label: 'Forte', color: 'text-green-600' };
    }
    return { strength: 2, label: 'Debole', color: 'text-orange-600' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

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

      {/* Password Message */}
      {passwordMessage && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          passwordMessage.type === 'success'
            ? (darkMode ? 'bg-green-900/50 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-800')
            : (darkMode ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800')
        }`}>
          {passwordMessage.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{passwordMessage.text}</span>
        </div>
      )}

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

        {/* Security Section */}
        <div className={`rounded-lg shadow-sm border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Sicurezza
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Cambia Password
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aggiorna la password del tuo account per maggiore sicurezza
                </p>
              </div>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Lock className="h-4 w-4" />
                <span className="text-sm">Cambia Password</span>
              </button>
            </div>

            {/* Password Change Form */}
            {showPasswordForm && (
              <div className={`mt-6 p-4 border rounded-lg ${
                darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Password Attuale *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        required
                        disabled={passwordLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className={`absolute right-3 top-2.5 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        disabled={passwordLoading}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Nuova Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        required
                        disabled={passwordLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className={`absolute right-3 top-2.5 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        disabled={passwordLoading}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                                passwordStrength.strength === 2 ? 'bg-orange-500 w-2/4' :
                                passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/4' :
                                passwordStrength.strength === 4 ? 'bg-green-500 w-full' : 'w-0'
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Usa almeno 8 caratteri con lettere maiuscole, numeri e simboli
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Conferma Nuova Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } ${
                          passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                        required
                        disabled={passwordLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className={`absolute right-3 top-2.5 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        disabled={passwordLoading}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Le password non coincidono</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={passwordLoading || passwordData.newPassword !== passwordData.confirmPassword}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Cambia Password
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      disabled={passwordLoading}
                      className={`flex-1 py-2 rounded-md transition-colors ${
                        darkMode 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      } disabled:opacity-50`}
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              </div>
            )}
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
                2.1.0
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
                Multi-utente con Autenticazione
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}