import React, { useState, useEffect } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import { useDatabase } from './hooks/useDatabase';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Users from './components/Users';
import Drivers from './components/Drivers';
import Destinations from './components/Destinations';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AccessRequests from './components/AccessRequests';
import UserManagement from './components/UserManagement';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBanner from './components/ErrorBanner';
import { ViewType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  const {
    currentUser,
    registeredUsers,
    accessRequests,
    loading: authLoading,
    error: authError,
    login,
    register,
    logout,
    approveRequest,
    rejectRequest,
    updateUserRole,
    deleteUser,
    clearError: clearAuthError,
  } = useAuth();

  const {
    users,
    drivers,
    destinations,
    transports,
    loading: dataLoading,
    error: dataError,
    isOnline,
    addUser,
    updateUser,
    deleteUser: deleteDataUser,
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
    clearError: clearDataError,
  } = useDatabase();

  // Auto-refresh dei dati quando l'utente si autentica
  useEffect(() => {
    if (currentUser && !authLoading && !dataLoading) {
      console.log('Utente autenticato, caricamento automatico dei dati...');
      loadAllData();
    }
  }, [currentUser, authLoading]); // Rimosso loadAllData dalle dipendenze per evitare loop

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LoadingSpinner darkMode={darkMode} message="Verifica autenticazione..." />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!currentUser) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <Login
          onLogin={login}
          onRegister={register}
          darkMode={darkMode}
          loading={authLoading}
          error={authError}
        />
      </div>
    );
  }

  const renderCurrentView = () => {
    if (dataLoading) {
      return <LoadingSpinner darkMode={darkMode} message="Caricamento dati..." />;
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
            onDeleteUser={deleteDataUser}
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
      case 'access-requests':
        return (
          <AccessRequests
            requests={accessRequests}
            darkMode={darkMode}
            onApprove={approveRequest}
            onReject={rejectRequest}
          />
        );
      case 'user-management':
        return (
          <UserManagement
            users={registeredUsers}
            currentUser={currentUser}
            darkMode={darkMode}
            onUpdateUserRole={updateUserRole}
            onDeleteUser={deleteUser}
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
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        darkMode={darkMode}
        currentUser={currentUser}
        onLogout={logout}
      >
        {authError && (
          <ErrorBanner
            message={authError}
            onClose={clearAuthError}
            darkMode={darkMode}
          />
        )}
        {dataError && (
          <ErrorBanner
            message={dataError}
            onClose={clearDataError}
            darkMode={darkMode}
          />
        )}
        {!isOnline && !dataLoading && (
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