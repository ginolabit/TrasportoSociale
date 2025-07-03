import React from 'react';
import { 
  Calendar, 
  Users, 
  Car, 
  MapPin, 
  BarChart3, 
  Home,
  Settings,
  Menu,
  X,
  UserCheck,
  LogOut,
  Shield
} from 'lucide-react';
import { ViewType, AuthUser } from '../types';

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  darkMode: boolean;
  children: React.ReactNode;
  currentUser: AuthUser;
  onLogout: () => void;
}

const navigation = [
  { id: 'dashboard' as ViewType, name: 'Dashboard', icon: Home, adminOnly: false },
  { id: 'calendar' as ViewType, name: 'Calendario', icon: Calendar, adminOnly: false },
  { id: 'users' as ViewType, name: 'Utenti', icon: Users, adminOnly: false },
  { id: 'drivers' as ViewType, name: 'Autisti', icon: Car, adminOnly: false },
  { id: 'destinations' as ViewType, name: 'Destinazioni', icon: MapPin, adminOnly: false },
  { id: 'reports' as ViewType, name: 'Report', icon: BarChart3, adminOnly: false },
  { id: 'access-requests' as ViewType, name: 'Richieste Accesso', icon: UserCheck, adminOnly: true },
  { id: 'user-management' as ViewType, name: 'Gestione Utenti', icon: Shield, adminOnly: true },
  { id: 'settings' as ViewType, name: 'Impostazioni', icon: Settings, adminOnly: false },
];

export default function Layout({ 
  currentView, 
  onViewChange, 
  darkMode, 
  children, 
  currentUser, 
  onLogout 
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || currentUser.role === 'admin'
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className={`relative flex w-full max-w-xs flex-1 flex-col ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button>
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
             
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
			  
				<h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Trasporto Sociale
                </h1>
              </div>
              
              {/* User info mobile */}
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentUser.fullName}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentUser.role === 'admin' ? 'Amministratore' : 'Utente'}
                </div>
              </div>

              <nav className="mt-8 flex-1 space-y-1 px-2">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : darkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>

              {/* Logout button mobile */}
              <div className="px-2 pb-4">
                <button
                  onClick={onLogout}
                  className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  Esci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex min-h-0 flex-1 flex-col border-r ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-1 flex-col overflow-y-auto pt-8 pb-4">
            <div className="flex flex-shrink-0 items-center px-6">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Trasporto Sociale
              </h1>
            </div>

            {/* User info desktop */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentUser.fullName}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentUser.role === 'admin' ? 'Amministratore' : 'Utente'}
              </div>
            </div>

            <nav className="mt-8 flex-1 space-y-1 px-4">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* Logout button desktop */}
            <div className="px-4 pb-4">
              <button
                onClick={onLogout}
                className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                Esci
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className={`sticky top-0 z-10 border-b lg:hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex h-16 items-center justify-between px-4">
            <button
              type="button"
              className={`rounded-md p-2 hover:bg-gray-100 ${
                darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
              }`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Trasporto Sociale
            </h1>
            <button
              onClick={onLogout}
              className={`rounded-md p-2 hover:bg-gray-100 ${
                darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}