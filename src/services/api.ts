import axios from 'axios';
import { User, Driver, Destination, Transport, AuthUser, AccessRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login') {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// Error handler
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
    throw new Error('Impossibile connettersi al server. Verifica che il server sia in esecuzione.');
  }
  
  if (error.response?.status === 401) {
    throw new Error('Credenziali non valide o sessione scaduta');
  }
  
  if (error.response?.status === 403) {
    throw new Error('Accesso negato');
  }
  
  if (error.response?.status >= 500) {
    throw new Error('Errore del server. Riprova più tardi.');
  }
  
  throw new Error(error.response?.data?.error || error.message || 'Si è verificato un errore');
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<{ user: AuthUser; token: string }> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  register: async (userData: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  }): Promise<void> => {
    try {
      await api.post('/auth/register', userData);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  verifyToken: async (token: string): Promise<AuthUser> => {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getAccessRequests: async (): Promise<AccessRequest[]> => {
    try {
      const response = await api.get('/auth/access-requests');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  approveRequest: async (id: string): Promise<void> => {
    try {
      await api.post(`/auth/access-requests/${id}/approve`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  rejectRequest: async (id: string): Promise<void> => {
    try {
      await api.post(`/auth/access-requests/${id}/reject`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getRegisteredUsers: async (): Promise<AuthUser[]> => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  updateUserRole: async (userId: string, role: 'admin' | 'user'): Promise<void> => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/auth/users/${userId}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// Drivers API
export const driversApi = {
  getAll: async (): Promise<Driver[]> => {
    try {
      const response = await api.get('/drivers');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  create: async (driverData: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> => {
    try {
      const response = await api.post('/drivers', driverData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, driverData: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> => {
    try {
      const response = await api.put(`/drivers/${id}`, driverData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/drivers/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// Destinations API
export const destinationsApi = {
  getAll: async (): Promise<Destination[]> => {
    try {
      const response = await api.get('/destinations');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  create: async (destinationData: Omit<Destination, 'id' | 'createdAt'>): Promise<Destination> => {
    try {
      const response = await api.post('/destinations', destinationData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, destinationData: Omit<Destination, 'id' | 'createdAt'>): Promise<Destination> => {
    try {
      const response = await api.put(`/destinations/${id}`, destinationData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/destinations/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// Transports API
export const transportsApi = {
  getAll: async (): Promise<Transport[]> => {
    try {
      const response = await api.get('/transports');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  create: async (transportData: Omit<Transport, 'id' | 'createdAt'>): Promise<Transport> => {
    try {
      const response = await api.post('/transports', transportData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, transportData: Omit<Transport, 'id' | 'createdAt'>): Promise<Transport> => {
    try {
      const response = await api.put(`/transports/${id}`, transportData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/transports/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};