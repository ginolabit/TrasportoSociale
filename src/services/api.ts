import axios from 'axios';
import { User, Driver, Destination, Transport } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw new Error(error.response?.data?.error || 'An error occurred');
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