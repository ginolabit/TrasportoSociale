import React, { useState } from 'react';
import { Plus, Calendar, Users, Car, MapPin, Pencil } from 'lucide-react';
import { Transport, User, Driver, Destination } from '../types';
import TransportModal from './TransportModal';

interface DashboardProps {
  transports: Transport[];
  users: User[];
  drivers: Driver[];
  destinations: Destination[];
  darkMode: boolean;
  onAddTransport: (transport: Omit<Transport, 'id' | 'createdAt'>) => void;
  onUpdateTransport: (id: string, transport: Omit<Transport, 'id' | 'createdAt'>) => void;
  onDeleteTransport: (id: string) => void;
  onViewChange: (view: 'calendar' | 'users' | 'drivers' | 'destinations') => void;
}

export default function Dashboard({ 
  transports, 
  users, 
  drivers, 
  destinations, 
  darkMode,
  onAddTransport,
  onUpdateTransport,
  onDeleteTransport,
  onViewChange 
}: DashboardProps) {
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [showModal, setShowModal] = useState(false);

  const today = new Date();
  const todayTransports = transports.filter(t => t.date === today.toISOString().split('T')[0]);

  const handleEditTransport = (transport: Transport) => {
    setSelectedTransport(transport);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedTransport(null);
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuovo Trasporto
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className={`p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          onClick={() => onViewChange('users')}
        >
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Utenti
              </p>
              <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {users.length}
              </p>
            </div>
          </div>
        </div>

        <div 
          className={`p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          onClick={() => onViewChange('drivers')}
        >
          <div className="flex items-center">
            <Car className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Autisti
              </p>
              <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {drivers.length}
              </p>
            </div>
          </div>
        </div>

        <div 
          className={`p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          onClick={() => onViewChange('destinations')}
        >
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Destinazioni
              </p>
              <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {destinations.length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Trasporti Oggi
              </p>
              <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {todayTransports.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Transports */}
      <div className={`rounded-lg shadow-sm border mb-8 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Trasporti di Oggi
          </h2>
        </div>
        <div className="p-6">
          {todayTransports.length === 0 ? (
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              Nessun trasporto programmato per oggi
            </p>
          ) : (
            <div className="space-y-4">
              {todayTransports.map((transport) => {
                const user = users.find(u => u.id === transport.userId);
                const driver = drivers.find(d => d.id === transport.driverId);
                const destination = destinations.find(d => d.id === transport.destinationId);
                
                return (
                  <div key={transport.id} className={`flex items-center justify-between p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-blue-600">{transport.time}</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{user?.name}</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>→</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{destination?.name}</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>con</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{driver?.name}</span>
                      </div>
                      {transport.notes && (
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {transport.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-green-600">
                        €{destination?.cost.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleEditTransport(transport)}
                        className={`p-1 rounded hover:bg-gray-200 ${
                          darkMode ? 'hover:bg-gray-600 text-gray-400' : 'text-gray-500'
                        }`}
                        title="Modifica"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transport Modal */}
      {showModal && (
        <TransportModal
          transport={selectedTransport}
          users={users}
          drivers={drivers}
          destinations={destinations}
          darkMode={darkMode}
          onSave={onAddTransport}
          onUpdate={onUpdateTransport}
          onDelete={onDeleteTransport}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}