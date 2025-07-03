import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (userData: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  }) => Promise<boolean>;
  darkMode: boolean;
  loading: boolean;
  error: string | null;
}

export default function Login({ onLogin, onRegister, darkMode, loading, error }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        if (!formData.username || !formData.password) {
          alert('Inserisci username e password');
          return;
        }
        await onLogin(formData.username, formData.password);
      } else {
        if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
          alert('Compila tutti i campi');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          alert('Le password non coincidono');
          return;
        }
        if (formData.password.length < 6) {
          alert('La password deve essere di almeno 6 caratteri');
          return;
        }
        
        const success = await onRegister({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password
        });
        
        if (success) {
          alert('Registrazione completata! Attendi l\'approvazione da parte di un amministratore.');
          setIsLogin(true);
          setFormData({
            username: '',
            email: '',
            fullName: '',
            password: '',
            confirmPassword: ''
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Trasporto Sociale
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}
          </p>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${
            darkMode 
              ? 'bg-red-900/50 border-red-700 text-red-200' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

       

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
              disabled={isSubmitting}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-2.5 ${
                  darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Conferma Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(loading || isSubmitting) ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isLogin ? 'Accedi' : 'Registrati'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            disabled={isSubmitting}
            className={`text-sm ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            } disabled:opacity-50`}
          >
            {isLogin 
              ? 'Non hai un account? Registrati' 
              : 'Hai già un account? Accedi'
            }
          </button>
        </div>
      </div>
    </div>
  );
}