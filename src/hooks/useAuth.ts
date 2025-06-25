import { useState, useEffect } from 'react';
import { AuthUser, AccessRequest } from '../types';
import { authApi } from '../services/api';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>([]);
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

  // Load access requests and registered users if user is admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAccessRequests();
      loadRegisteredUsers();
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

  const loadRegisteredUsers = async () => {
    try {
      const users = await authApi.getRegisteredUsers();
      setRegisteredUsers(users);
    } catch (error) {
      console.error('Error loading registered users:', error);
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
    setRegisteredUsers([]);
    setAccessRequests([]);
    setError(null);
  };

  const approveRequest = async (id: string) => {
    try {
      await authApi.approveRequest(id);
      await loadAccessRequests();
      await loadRegisteredUsers();
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

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await authApi.updateUserRole(userId, role);
      await loadRegisteredUsers();
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'aggiornamento del ruolo');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await authApi.deleteUser(userId);
      await loadRegisteredUsers();
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'eliminazione dell\'utente');
    }
  };

  const clearError = () => setError(null);

  return {
    currentUser,
    registeredUsers,
    accessRequests,
    loading,
    error,
    login,
    register,
    logout,
    approveRequest,
    rejectRequest,
    updateUserRole,
    deleteUser,
    clearError,
  };
}