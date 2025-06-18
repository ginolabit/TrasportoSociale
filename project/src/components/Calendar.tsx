import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Transport, User, Driver, Destination } from '../types';

interface CalendarProps {
  transports: Transport[];
  users: User[];
  drivers: Driver[];
  destinations: Destination[];
  onAddTransport: (transport: Omit<Transport, 'id' | 'createdAt'>) => void;
}

export default function Calendar({ 
  transports, 
  users, 
  drivers, 
  destinations, 
  onAddTransport 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    userId: '',
    driverId: '',
    destinationId: '',
    notes: ''
  });

  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const previous = () => {
    if (view === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
  };

  const next = () => {
    if (view === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
  };

  const getTransportsForDate = (date: string) => {
    return transports.filter(t => t.date === date);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setFormData({ ...formData, date: dateStr });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.userId || !formData.driverId || !formData.destinationId) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    onAddTransport(formData);
    setFormData({
      date: '',
      time: '',
      userId: '',
      driverId: '',
      destinationId: '',
      notes: ''
    });
    setShowForm(false);
    setSelectedDate(null);
  };

  // --- VISTA MESE ---
  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTransports = getTransportsForDate(dateStr);
      const isToday = today.toISOString().split('T')[0] === dateStr;
      const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);
      days.push(
        <div
          key={d}
          className={`p-2 min-h-[120px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isPast ? 'bg-gray-50' : ''}`}
          onClick={() => handleDateClick(d)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'}`}>
            {d}
          </div>
          <div className="space-y-1">
            {dayTransports.slice(0, 3).map((transport) => {
              const user = users.find(u => u.id === transport.userId);
              const destination = destinations.find(d => d.id === transport.destinationId);
              return (
                <div
                  key={transport.id}
                  className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate"
                  title={`${transport.time} - ${user?.name} → ${destination?.name}`}
                >
                  {transport.time} {user?.name}
                </div>
              );
            })}
            {dayTransports.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayTransports.length - 3} altri
              </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  // --- VISTA SETTIMANA ---
  const renderWeekView = () => {
    // Trova il primo giorno della settimana corrente
    const curr = new Date(currentDate);
    const weekStart = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayTransports = getTransportsForDate(dateStr);
      const isToday = today.toISOString().split('T')[0] === dateStr;
      days.push(
        <div key={i} className={`flex-1 border p-2 ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}>
          <div className={`font-semibold mb-2 ${isToday ? 'text-blue-600' : ''}`}>
            {weekDays[i]} {date.getDate()}/{date.getMonth() + 1}
          </div>
          <div className="space-y-1">
            {dayTransports.length === 0 && <div className="text-xs text-gray-400">Nessun trasporto</div>}
            {dayTransports.map((transport) => {
              const user = users.find(u => u.id === transport.userId);
              const destination = destinations.find(d => d.id === transport.destinationId);
              return (
                <div
                  key={transport.id}
                  className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate"
                  title={`${transport.time} - ${user?.name} → ${destination?.name}`}
                >
                  {transport.time} {user?.name}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return <div className="flex">{days}</div>;
  };

  // --- VISTA GIORNO ---
  const renderDayView = () => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTransports = getTransportsForDate(dateStr);
    return (
      <div className="border rounded p-4">
        <div className="font-semibold mb-2">
          {weekDays[currentDate.getDay()]} {day}/{month + 1}/{year}
        </div>
        {dayTransports.length === 0 && <div className="text-gray-400">Nessun trasporto</div>}
        {dayTransports.map((transport) => {
          const user = users.find(u => u.id === transport.userId);
          const destination = destinations.find(d => d.id === transport.destinationId);
          return (
            <div
              key={transport.id}
              className="mb-2 p-2 bg-blue-100 text-blue-800 rounded"
              title={`${transport.time} - ${user?.name} → ${destination?.name}`}
            >
              <div><b>Ora:</b> {transport.time}</div>
              <div><b>Utente:</b> {user?.name}</div>
              <div><b>Destinazione:</b> {destination?.name}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Calendario Trasporti</h1>
        </div>
        {/* Pulsanti vista */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setView('day')}
          >
            Giorno
          </button>
          <button
            className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setView('week')}
          >
            Settimana
          </button>
          <button
            className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setView('month')}
          >
            Mese
          </button>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={previous}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {view === 'month' && `${monthNames[month]} ${year}`}
            {view === 'week' && `Settimana di ${currentDate.getDate()}/${month + 1}/${year}`}
            {view === 'day' && `${currentDate.getDate()}/${month + 1}/${year}`}
          </h2>
          <button
            onClick={next}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Render in base alla vista */}
      {view === 'month' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>
      )}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Add Transport Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nuovo Trasporto - {selectedDate}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona utente</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autista</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona autista</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinazione</label>
                <select
                  value={formData.destinationId}
                  onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salva
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedDate(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}