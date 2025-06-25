import { useState, useEffect } from 'react';
import { AuthUser, AccessRequest } from '../types';
import { authApi } from '../services/api';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const user = await authApi.verifyToken(token);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load access requests if user is admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAccessRequests();
    }
  }, [currentUser]);

  const loadAccessRequests = async () => {
    try {
      const requests = await authApi.getAccessRequests();
      setAccessRequests(requests);
    } catch (error) {
      console.error('Error loading access requests:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authApi.login(username, password);
      
      if (response.user && response.token) {
        localStorage.setItem('auth_token', response.token);
        setCurrentUser(response.user);
        return true;
      } else {
        setError('Credenziali non valide');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Errore durante il login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  }): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      await authApi.register(userData);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Errore durante la registrazione');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    setAccessRequests([]);
    setError(null);
  };

  const approveRequest = async (id: string) => {
    try {
      await authApi.approveRequest(id);
      await loadAccessRequests();
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'approvazione');
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      await authApi.rejectRequest(id);
      await loadAccessRequests();
    } catch (error: any) {
      setError(error.message || 'Errore durante il rifiuto');
    }
  };

  const clearError = () => setError(null);

  return {
    currentUser,
    accessRequests,
    loading,
    error,
    login,
    register,
    logout,
    approveRequest,
    rejectRequest,
    clearError,
  };
}