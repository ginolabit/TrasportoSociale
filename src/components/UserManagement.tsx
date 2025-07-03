import React, { useState } from 'react';
import { Shield, ShieldOff, Trash2, User, Crown, AlertTriangle } from 'lucide-react';
import { AuthUser } from '../types';

interface UserManagementProps {
  users: AuthUser[];
  currentUser: AuthUser;
  darkMode: boolean;
  onUpdateUserRole: (userId: string, role: 'admin' | 'user') => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserManagement({ 
  users, 
  currentUser, 
  darkMode, 
  onUpdateUserRole, 
  onDeleteUser 
}: UserManagementProps) {
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');

  const filteredUsers = users.filter(user => 
    filter === 'all' || user.role === filter
  );

  const handleRoleChange = (user: AuthUser, newRole: 'admin' | 'user') => {
    if (user.id === currentUser.id) {
      alert('Non puoi modificare il tuo stesso ruolo!');
      return;
    }

    const action = newRole === 'admin' ? 'promuovere' : 'rimuovere privilegi di';
    if (confirm(`Sei sicuro di voler ${action} ${user.fullName}?`)) {
      onUpdateUserRole(user.id, newRole);
    }
  };

  const handleDeleteUser = (user: AuthUser) => {
    if (user.id === currentUser.id) {
      alert('Non puoi eliminare il tuo stesso account!');
      return;
    }

    if (confirm(`Sei sicuro di voler eliminare l'account di ${user.fullName}? Questa azione è irreversibile!`)) {
      onDeleteUser(user.id);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <Crown className="h-3 w-3" />
          Amministratore
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <User className="h-3 w-3" />
        Utente
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Gestione Utenti
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Gestisci ruoli e permessi degli utenti registrati
        </p>
      </div>

      {/* Filtri */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tutti', count: users.length },
            { key: 'admin', label: 'Amministratori', count: users.filter(u => u.role === 'admin').length },
            { key: 'user', label: 'Utenti', count: users.filter(u => u.role === 'user').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Warning per admin */}
      <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
        darkMode 
          ? 'bg-yellow-900/50 border-yellow-700 text-yellow-200' 
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Attenzione:</strong> Le modifiche ai ruoli utente hanno effetto immediato. 
          Gli amministratori possono accedere a tutte le funzioni del sistema, inclusa questa sezione.
        </div>
      </div>

      {/* Lista utenti */}
      <div className={`rounded-lg shadow-sm border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <User className={`h-12 w-12 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              Nessun utente trovato
            </p>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filter === 'all' 
                ? 'Non ci sono utenti registrati'
                : `Non ci sono utenti con ruolo "${filter}"`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.fullName}
                        {user.id === currentUser.id && (
                          <span className="ml-2 text-sm text-blue-600 font-normal">(Tu)</span>
                        )}
                      </h3>
                      {getRoleBadge(user.role)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Username: {user.username}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Email: {user.email}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Registrato: {new Date(user.createdAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {user.id !== currentUser.id && (
                    <div className="flex items-center gap-2 ml-4">
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => handleRoleChange(user, 'user')}
                          className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          title="Rimuovi privilegi amministratore"
                        >
                          <ShieldOff className="h-4 w-4" />
                          Rimuovi Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(user, 'admin')}
                          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          title="Promuovi ad amministratore"
                        >
                          <Shield className="h-4 w-4" />
                          Rendi Admin
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        title="Elimina utente"
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}