import React, { useState } from 'react';
import { Check, X, Clock, User, Mail, Calendar } from 'lucide-react';
import { AccessRequest } from '../types';

interface AccessRequestsProps {
  requests: AccessRequest[];
  darkMode: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function AccessRequests({ 
  requests, 
  darkMode, 
  onApprove, 
  onReject 
}: AccessRequestsProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'rejected':
        return darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleApprove = (id: string) => {
    if (confirm('Sei sicuro di voler approvare questa richiesta?')) {
      onApprove(id);
    }
  };

  const handleReject = (id: string) => {
    if (confirm('Sei sicuro di voler rifiutare questa richiesta?')) {
      onReject(id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Richieste di Accesso
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Gestisci le richieste di registrazione degli utenti
        </p>
      </div>

      {/* Filtri */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { key: 'pending', label: 'In Attesa', count: requests.filter(r => r.status === 'pending').length },
            { key: 'approved', label: 'Approvate', count: requests.filter(r => r.status === 'approved').length },
            { key: 'rejected', label: 'Rifiutate', count: requests.filter(r => r.status === 'rejected').length },
            { key: 'all', label: 'Tutte', count: requests.length }
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

      {/* Lista richieste */}
      <div className={`rounded-lg shadow-sm border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <User className={`h-12 w-12 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              Nessuna richiesta trovata
            </p>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filter === 'pending' 
                ? 'Non ci sono richieste in attesa di approvazione'
                : `Non ci sono richieste con stato "${filter}"`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {request.fullName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        getStatusColor(request.status)
                      }`}>
                        {getStatusIcon(request.status)}
                        {request.status === 'pending' ? 'In Attesa' : 
                         request.status === 'approved' ? 'Approvata' : 'Rifiutata'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Username: {request.username}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className={`h-4 w-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {request.email}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Richiesta: {new Date(request.requestedAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Check className="h-4 w-4" />
                        Approva
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <X className="h-4 w-4" />
                        Rifiuta
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