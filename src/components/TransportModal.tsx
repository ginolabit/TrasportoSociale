import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Transport, User, Driver, Destination } from '../types';

interface TransportModalProps {
  transport: Transport | null;
  users: User[];
  drivers: Driver[];
  destinations: Destination[];
  darkMode: boolean;
  selectedDate?: string | null;
  onSave: (transport: Omit<Transport, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, transport: Omit<Transport, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function TransportModal({
  transport,
  users,
  drivers,
  destinations,
  darkMode,
  selectedDate,
  onSave,
  onUpdate,
  onDelete,
  onClose
}: TransportModalProps) {
  const [formData, setFormData] = useState({
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: '',
    userId: '',
    driverId: '',
    destinationId: '',
    notes: ''
  });

  useEffect(() => {
    if (transport) {
      setFormData({
        date: transport.date,
        time: transport.time,
        userId: transport.userId,
        driverId: transport.driverId,
        destinationId: transport.destinationId,
        notes: transport.notes || ''
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  }, [transport, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.userId || !formData.driverId || !formData.destinationId) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    
    if (transport) {
      onUpdate(transport.id, formData);
    } else {
      onSave(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (transport && confirm('Sei sicuro di voler eliminare questo trasporto?')) {
      onDelete(transport.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-md mx-4 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {transport ? 'Modifica Trasporto' : 'Nuovo Trasporto'}
          </h3>
          <div className="flex items-center gap-2">
            {transport && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 p-1"
                title="Elimina"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-gray-100 ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Ora</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Utente</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="">Seleziona utente</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Autista</label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="">Seleziona autista</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Destinazione</label>
            <select
              value={formData.destinationId}
              onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="">Seleziona destinazione</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name} - €{destination.cost.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Note</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {transport ? 'Aggiorna' : 'Salva'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-md transition-colors ${
                darkMode 
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}