import React, { useState } from 'react';
import { Download, Filter, Calendar, Users, Car, MapPin } from 'lucide-react';
import { Transport, User, Driver, Destination } from '../types';

interface ReportsProps {
  transports: Transport[];
  users: User[];
  drivers: Driver[];
  destinations: Destination[];
}

export default function Reports({ transports, users, drivers, destinations }: ReportsProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');

  const filteredTransports = transports.filter(transport => {
    const transportDate = new Date(transport.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    if (fromDate && transportDate < fromDate) return false;
    if (toDate && transportDate > toDate) return false;
    if (selectedUserId && transport.userId !== selectedUserId) return false;
    if (selectedDriverId && transport.driverId !== selectedDriverId) return false;
    if (selectedDestinationId && transport.destinationId !== selectedDestinationId) return false;

    return true;
  });

  const getUserReport = () => {
    const userReports = users.map(user => {
      const userTransports = filteredTransports.filter(t => t.userId === user.id);
      const totalCost = userTransports.reduce((sum, transport) => {
        const destination = destinations.find(d => d.id === transport.destinationId);
        return sum + (destination?.cost || 0);
      }, 0);

      return {
        user,
        transports: userTransports,
        totalCost,
        destinations: userTransports.map(t => {
          const destination = destinations.find(d => d.id === t.destinationId);
          const driver = drivers.find(d => d.id === t.driverId);
          return {
            date: t.date,
            time: t.time,
            destination: destination?.name || 'N/A',
            cost: destination?.cost || 0,
            driver: driver?.name || 'N/A'
          };
        })
      };
    }).filter(report => report.transports.length > 0);

    return userReports;
  };

  const getDriverReport = () => {
    const driverReports = drivers.map(driver => {
      const driverTransports = filteredTransports.filter(t => t.driverId === driver.id);
      
      return {
        driver,
        transports: driverTransports,
        totalTrips: driverTransports.length,
        trips: driverTransports.map(t => {
          const user = users.find(u => u.id === t.userId);
          const destination = destinations.find(d => d.id === t.destinationId);
          return {
            date: t.date,
            time: t.time,
            user: user?.name || 'N/A',
            destination: destination?.name || 'N/A',
            cost: destination?.cost || 0
          };
        })
      };
    }).filter(report => report.transports.length > 0);

    return driverReports;
  };

  const getDestinationReport = () => {
    const destinationReports = destinations.map(destination => {
      const destinationTransports = filteredTransports.filter(t => t.destinationId === destination.id);
      
      return {
        destination,
        transports: destinationTransports,
        totalTrips: destinationTransports.length,
        totalRevenue: destinationTransports.length * destination.cost
      };
    }).filter(report => report.transports.length > 0)
      .sort((a, b) => b.totalTrips - a.totalTrips);

    return destinationReports;
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportUserReport = () => {
    const userReports = getUserReport();
    const data = userReports.flatMap(report => 
      report.destinations.map(dest => ({
        Utente: report.user.name,
        Data: dest.date,
        Ora: dest.time,
        Destinazione: dest.destination,
        Costo: `€${dest.cost.toFixed(2)}`,
        Autista: dest.driver
      }))
    );
    exportToCSV(data, 'report_utenti.csv', ['Utente', 'Data', 'Ora', 'Destinazione', 'Costo', 'Autista']);
  };

  const exportDriverReport = () => {
    const driverReports = getDriverReport();
    const data = driverReports.flatMap(report => 
      report.trips.map(trip => ({
        Autista: report.driver.name,
        Data: trip.date,
        Ora: trip.time,
        Utente: trip.user,
        Destinazione: trip.destination,
        Costo: `€${trip.cost.toFixed(2)}`
      }))
    );
    exportToCSV(data, 'report_autisti.csv', ['Autista', 'Data', 'Ora', 'Utente', 'Destinazione', 'Costo']);
  };

  const exportDestinationReport = () => {
    const destinationReports = getDestinationReport();
    const data = destinationReports.map(report => ({
      Destinazione: report.destination.name,
      'Numero Viaggi': report.totalTrips,
      'Ricavo Totale': `€${report.totalRevenue.toFixed(2)}`,
      'Costo per Viaggio': `€${report.destination.cost.toFixed(2)}`
    }));
    exportToCSV(data, 'report_destinazioni.csv', ['Destinazione', 'Numero Viaggi', 'Ricavo Totale', 'Costo per Viaggio']);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedUserId('');
    setSelectedDriverId('');
    setSelectedDestinationId('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report e Statistiche</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtri</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Da Data</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">A Data</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autista</label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinazione</label>
            <select
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {destinations.map(destination => (
                <option key={destination.id} value={destination.id}>{destination.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Pulisci Filtri
          </button>
          <span className="px-3 py-2 text-sm text-gray-600">
            {filteredTransports.length} trasporti trovati
          </span>
        </div>
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Report */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Report Utenti</h3>
              </div>
              <button
                onClick={exportUserReport}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Esporta CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {getUserReport().length === 0 ? (
              <p className="text-gray-500">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-4">
                {getUserReport().slice(0, 5).map(report => (
                  <div key={report.user.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="font-medium text-gray-900">{report.user.name}</div>
                    <div className="text-sm text-gray-600">
                      {report.transports.length} trasporti - €{report.totalCost.toFixed(2)}
                    </div>
                  </div>
                ))}
                {getUserReport().length > 5 && (
                  <div className="text-sm text-gray-500">
                    +{getUserReport().length - 5} altri utenti
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Driver Report */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Report Autisti</h3>
              </div>
              <button
                onClick={exportDriverReport}
                className="text-green-600 hover:text-green-800 p-1"
                title="Esporta CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {getDriverReport().length === 0 ? (
              <p className="text-gray-500">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-4">
                {getDriverReport().slice(0, 5).map(report => (
                  <div key={report.driver.id} className="border-l-4 border-green-500 pl-4">
                    <div className="font-medium text-gray-900">{report.driver.name}</div>
                    <div className="text-sm text-gray-600">
                      {report.totalTrips} viaggi effettuati
                    </div>
                  </div>
                ))}
                {getDriverReport().length > 5 && (
                  <div className="text-sm text-gray-500">
                    +{getDriverReport().length - 5} altri autisti
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Destination Report */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Report Destinazioni</h3>
              </div>
              <button
                onClick={exportDestinationReport}
                className="text-orange-600 hover:text-orange-800 p-1"
                title="Esporta CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {getDestinationReport().length === 0 ? (
              <p className="text-gray-500">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-4">
                {getDestinationReport().slice(0, 5).map(report => (
                  <div key={report.destination.id} className="border-l-4 border-orange-500 pl-4">
                    <div className="font-medium text-gray-900">{report.destination.name}</div>
                    <div className="text-sm text-gray-600">
                      {report.totalTrips} viaggi - €{report.totalRevenue.toFixed(2)}
                    </div>
                  </div>
                ))}
                {getDestinationReport().length > 5 && (
                  <div className="text-sm text-gray-500">
                    +{getDestinationReport().length - 5} altre destinazioni
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Trasporti Totali</p>
              <p className="text-2xl font-semibold text-blue-900">{filteredTransports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Utenti Attivi</p>
              <p className="text-2xl font-semibold text-green-900">
                {new Set(filteredTransports.map(t => t.userId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center">
            <Car className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Autisti Attivi</p>
              <p className="text-2xl font-semibold text-orange-900">
                {new Set(filteredTransports.map(t => t.driverId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 text-purple-600 flex items-center justify-center font-bold text-lg">€</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Costo Totale</p>
              <p className="text-2xl font-semibold text-purple-900">
                €{filteredTransports.reduce((sum, transport) => {
                  const destination = destinations.find(d => d.id === transport.destinationId);
                  return sum + (destination?.cost || 0);
                }, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}