import React, { useState } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import { useDatabase } from './hooks/useDatabase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Users from './components/Users';
import Drivers from './components/Drivers';
import Destinations from './components/Destinations';
import Reports from './components/Reports';
import Settings from './components/Settings';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBanner from './components/ErrorBanner';
import { ViewType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { darkMode, toggleDarkMode } = useDarkMode();
  const {
    users,
    drivers,
    destinations,
    transports,
    loading,
    error,
    isOnline,
    addUser,
    updateUser,
    deleteUser,
    addDriver,
    updateDriver,
    deleteDriver,
    addDestination,
    updateDestination,
    deleteDestination,
    addTransport,
    updateTransport,
    deleteTransport,
    loadAllData,
    clearError,
  } = useDatabase();

  const renderCurrentView = () => {
    if (loading) {
      return <LoadingSpinner darkMode={darkMode} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            transports={transports}
            users={users}
            drivers={drivers}
            destinations={destinations}
            darkMode={darkMode}
            onAddTransport={addTransport}
            onUpdateTransport={updateTransport}
            onDeleteTransport={deleteTransport}
            onViewChange={setCurrentView}
          />
        );
      case 'calendar':
        return (
          <Calendar
            transports={transports}
            users={users}
            drivers={drivers}
            destinations={destinations}
            darkMode={darkMode}
            onAddTransport={addTransport}
            onUpdateTransport={updateTransport}
            onDeleteTransport={deleteTransport}
          />
        );
      case 'users':
        return (
          <Users
            users={users}
            darkMode={darkMode}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        );
      case 'drivers':
        return (
          <Drivers
            drivers={drivers}
            darkMode={darkMode}
            onAddDriver={addDriver}
            onUpdateDriver={updateDriver}
            onDeleteDriver={deleteDriver}
          />
        );
      case 'destinations':
        return (
          <Destinations
            destinations={destinations}
            darkMode={darkMode}
            onAddDestination={addDestination}
            onUpdateDestination={updateDestination}
            onDeleteDestination={deleteDestination}
          />
        );
      case 'reports':
        return (
          <Reports
            transports={transports}
            users={users}
            drivers={drivers}
            destinations={destinations}
            darkMode={darkMode}
          />
        );
      case 'settings':
        return (
          <Settings
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            isOnline={isOnline}
            onRefreshData={loadAllData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Layout currentView={currentView} onViewChange={setCurrentView} darkMode={darkMode}>
        {error && (
          <ErrorBanner
            message={error}
            onClose={clearError}
            darkMode={darkMode}
          />
        )}
        {!isOnline && !loading && (
          <ErrorBanner
            message="Connessione al database non disponibile. Alcune funzionalità potrebbero non funzionare."
            type="warning"
            darkMode={darkMode}
          />
        )}
        {renderCurrentView()}
      </Layout>
    </div>
  );
}

export default App;