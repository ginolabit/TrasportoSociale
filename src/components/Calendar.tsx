import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Transport, User, Driver, Destination } from '../types';
import TransportModal from './TransportModal';

interface CalendarProps {
  transports: Transport[];
  users: User[];
  drivers: Driver[];
  destinations: Destination[];
  darkMode: boolean;
  onAddTransport: (transport: Omit<Transport, 'id' | 'createdAt'>) => void;
  onUpdateTransport: (id: string, transport: Omit<Transport, 'id' | 'createdAt'>) => void;
  onDeleteTransport: (id: string) => void;
}

export default function Calendar({ 
  transports, 
  users, 
  drivers, 
  destinations, 
  darkMode,
  onAddTransport,
  onUpdateTransport,
  onDeleteTransport
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [draggedTransport, setDraggedTransport] = useState<Transport | null>(null);

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

  const handleDateClick = (day: number, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('.transport-event')) {
      return;
    }
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedTransport(null);
    setShowModal(true);
  };

  const handleTransportClick = (transport: Transport, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTransport(transport);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransport(null);
    setSelectedDate(null);
  };

  const handleDragStart = (transport: Transport, event: React.DragEvent) => {
    setDraggedTransport(transport);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetDate: string, event: React.DragEvent) => {
    event.preventDefault();
    
    if (draggedTransport && draggedTransport.date !== targetDate) {
      onUpdateTransport(draggedTransport.id, {
        date: targetDate,
        time: draggedTransport.time,
        userId: draggedTransport.userId,
        driverId: draggedTransport.driverId,
        destinationId: draggedTransport.destinationId,
        notes: draggedTransport.notes || ''
      });
    }
    
    setDraggedTransport(null);
  };

  const handleDragEnd = () => {
    setDraggedTransport(null);
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
      const isDragOver = draggedTransport && draggedTransport.date !== dateStr;
      
      days.push(
        <div
          key={d}
          className={`p-2 min-h-[120px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isPast ? 'bg-gray-50' : ''} ${
            isDragOver ? 'bg-green-50 border-green-300' : ''
          } ${darkMode ? 'border-gray-600 hover:bg-gray-700' : ''}`}
          onClick={(e) => handleDateClick(d, e)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(dateStr, e)}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-blue-600' : isPast ? (darkMode ? 'text-gray-500' : 'text-gray-400') : (darkMode ? 'text-white' : 'text-gray-900')
          }`}>
            {d}
          </div>
          <div className="space-y-1">
            {dayTransports.slice(0, 3).map((transport) => {
              const user = users.find(u => u.id === transport.userId);
              const destination = destinations.find(d => d.id === transport.destinationId);
              const isDragging = draggedTransport?.id === transport.id;
              
              return (
                <div
                  key={transport.id}
                  className={`transport-event text-xs bg-blue-100 text-blue-800 p-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors ${
                    isDragging ? 'opacity-50' : ''
                  } ${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : ''}`}
                  title={`${transport.time} - ${user?.name} → ${destination?.name}`}
                  draggable
                  onDragStart={(e) => handleDragStart(transport, e)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleTransportClick(transport, e)}
                >
                  {transport.time} {user?.name}
                </div>
              );
            })}
            {dayTransports.length > 3 && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
    const curr = new Date(currentDate);
    const weekStart = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayTransports = getTransportsForDate(dateStr);
      const isToday = today.toISOString().split('T')[0] === dateStr;
      const isDragOver = draggedTransport && draggedTransport.date !== dateStr;
      
      days.push(
        <div 
          key={i} 
          className={`flex-1 border p-2 min-h-[200px] ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isDragOver ? 'bg-green-50 border-green-300' : ''} ${
            darkMode ? 'border-gray-600 bg-gray-800' : ''
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(dateStr, e)}
          onClick={(e) => handleDateClick(date.getDate(), e)}
        >
          <div className={`font-semibold mb-2 ${
            isToday ? 'text-blue-600' : (darkMode ? 'text-white' : 'text-gray-900')
          }`}>
            {weekDays[i]} {date.getDate()}/{date.getMonth() + 1}
          </div>
          <div className="space-y-1">
            {dayTransports.length === 0 && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                Nessun trasporto
              </div>
            )}
            {dayTransports.map((transport) => {
              const user = users.find(u => u.id === transport.userId);
              const destination = destinations.find(d => d.id === transport.destinationId);
              const isDragging = draggedTransport?.id === transport.id;
              
              return (
                <div
                  key={transport.id}
                  className={`transport-event text-xs bg-blue-100 text-blue-800 p-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors ${
                    isDragging ? 'opacity-50' : ''
                  } ${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : ''}`}
                  title={`${transport.time} - ${user?.name} → ${destination?.name}`}
                  draggable
                  onDragStart={(e) => handleDragStart(transport, e)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleTransportClick(transport, e)}
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
      <div className={`border rounded p-4 ${darkMode ? 'border-gray-600 bg-gray-800' : ''}`}>
        <div className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {weekDays[currentDate.getDay()]} {day}/{month + 1}/{year}
        </div>
        {dayTransports.length === 0 && (
          <div className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
            Nessun trasporto
          </div>
        )}
        {dayTransports
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((transport) => {
            const user = users.find(u => u.id === transport.userId);
            const destination = destinations.find(d => d.id === transport.destinationId);
            
            return (
              <div
                key={transport.id}
                className={`transport-event mb-2 p-3 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors ${
                  darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : ''
                }`}
                onClick={(e) => handleTransportClick(transport, e)}
                title="Clicca per modificare"
              >
                <div className="font-bold text-lg">{transport.time}</div>
                <div><strong>Utente:</strong> {user?.name}</div>
                <div><strong>Destinazione:</strong> {destination?.name}</div>
                {transport.notes && <div><strong>Note:</strong> {transport.notes}</div>}
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
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Calendario Trasporti
          </h1>
          <button
            onClick={() => {
              setSelectedTransport(null);
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuovo Trasporto
          </button>
        </div>
        
        {/* Pulsanti vista */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded ${
              view === 'day' 
                ? 'bg-blue-600 text-white' 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
            }`}
            onClick={() => setView('day')}
          >
            Giorno
          </button>
          <button
            className={`px-3 py-1 rounded ${
              view === 'week' 
                ? 'bg-blue-600 text-white' 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
            }`}
            onClick={() => setView('week')}
          >
            Settimana
          </button>
          <button
            className={`px-3 py-1 rounded ${
              view === 'month' 
                ? 'bg-blue-600 text-white' 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
            }`}
            onClick={() => setView('month')}
          >
            Mese
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={previous}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {view === 'month' && `${monthNames[month]} ${year}`}
            {view === 'week' && `Settimana di ${currentDate.getDate()}/${month + 1}/${year}`}
            {view === 'day' && `${currentDate.getDate()}/${month + 1}/${year}`}
          </h2>
          <button
            onClick={next}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Istruzioni per l'utente */}
      <div className={`mb-4 p-3 rounded-lg text-sm ${
        darkMode ? 'bg-gray-800 text-gray-300' : 'bg-blue-50 text-blue-800'
      }`}>
        💡 <strong>Suggerimenti:</strong> Clicca su un evento per modificarlo, trascina gli eventi per spostarli in altre date (l'ora rimane invariata), clicca su una data vuota per aggiungere un nuovo trasporto.
      </div>

      {/* Render in base alla vista */}
      {view === 'month' && (
        <div className={`rounded-lg shadow-sm border overflow-hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
            {weekDays.map((day) => (
              <div key={day} className={`p-3 text-center text-sm font-medium border-r last:border-r-0 ${
                darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'
              }`}>
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

      {/* Transport Modal */}
      {showModal && (
        <TransportModal
          transport={selectedTransport}
          users={users}
          drivers={drivers}
          destinations={destinations}
          darkMode={darkMode}
          selectedDate={selectedDate}
          onSave={onAddTransport}
          onUpdate={onUpdateTransport}
          onDelete={onDeleteTransport}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}