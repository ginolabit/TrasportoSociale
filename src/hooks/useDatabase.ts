import { useState, useEffect } from 'react';
import { User, Driver, Destination, Transport } from '../types';
import { usersApi, driversApi, destinationsApi, transportsApi, healthCheck } from '../services/api';

export function useDatabase() {
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Check database connection
  const checkConnection = async () => {
    try {
      const online = await healthCheck();
      setIsOnline(online);
      return online;
    } catch (error) {
      setIsOnline(false);
      return false;
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const online = await checkConnection();
      if (!online) {
        throw new Error('Database connection failed');
      }

      const [usersData, driversData, destinationsData, transportsData] = await Promise.all([
        usersApi.getAll(),
        driversApi.getAll(),
        destinationsApi.getAll(),
        transportsApi.getAll(),
      ]);

      console.log('Loaded transports:', transportsData); // Debug log

      setUsers(usersData);
      setDrivers(driversData);
      setDestinations(destinationsData);
      setTransports(transportsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // User operations
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const newUser = await usersApi.create(userData);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add user');
      throw error;
    }
  };

  const updateUser = async (id: string, userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const updatedUser = await usersApi.update(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return updatedUser;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user');
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      // Also remove related transports
      setTransports(prev => prev.filter(transport => transport.userId !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete user');
      throw error;
    }
  };

  // Driver operations
  const addDriver = async (driverData: Omit<Driver, 'id' | 'createdAt'>) => {
    try {
      const newDriver = await driversApi.create(driverData);
      setDrivers(prev => [newDriver, ...prev]);
      return newDriver;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add driver');
      throw error;
    }
  };

  const updateDriver = async (id: string, driverData: Omit<Driver, 'id' | 'createdAt'>) => {
    try {
      const updatedDriver = await driversApi.update(id, driverData);
      setDrivers(prev => prev.map(driver => driver.id === id ? updatedDriver : driver));
      return updatedDriver;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update driver');
      throw error;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await driversApi.delete(id);
      setDrivers(prev => prev.filter(driver => driver.id !== id));
      // Also remove related transports
      setTransports(prev => prev.filter(transport => transport.driverId !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete driver');
      throw error;
    }
  };

  // Destination operations
  const addDestination = async (destinationData: Omit<Destination, 'id' | 'createdAt'>) => {
    try {
      const newDestination = await destinationsApi.create(destinationData);
      setDestinations(prev => [newDestination, ...prev]);
      return newDestination;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add destination');
      throw error;
    }
  };

  const updateDestination = async (id: string, destinationData: Omit<Destination, 'id' | 'createdAt'>) => {
    try {
      const updatedDestination = await destinationsApi.update(id, destinationData);
      setDestinations(prev => prev.map(destination => destination.id === id ? updatedDestination : destination));
      return updatedDestination;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update destination');
      throw error;
    }
  };

  const deleteDestination = async (id: string) => {
    try {
      await destinationsApi.delete(id);
      setDestinations(prev => prev.filter(destination => destination.id !== id));
      // Also remove related transports
      setTransports(prev => prev.filter(transport => transport.destinationId !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete destination');
      throw error;
    }
  };

  // Transport operations - FIXED
  const addTransport = async (transportData: Omit<Transport, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding transport:', transportData); // Debug log
      const newTransport = await transportsApi.create(transportData);
      console.log('Transport created:', newTransport); // Debug log
      
      // AGGIORNA IMMEDIATAMENTE lo stato locale
      setTransports(prev => {
        const updated = [newTransport, ...prev];
        console.log('Updated transports state:', updated); // Debug log
        return updated;
      });
      
      return newTransport;
    } catch (error) {
      console.error('Error adding transport:', error);
      setError(error instanceof Error ? error.message : 'Failed to add transport');
      throw error;
    }
  };

  const updateTransport = async (id: string, transportData: Omit<Transport, 'id' | 'createdAt'>) => {
    try {
      console.log('Updating transport:', id, transportData); // Debug log
      const updatedTransport = await transportsApi.update(id, transportData);
      console.log('Transport updated:', updatedTransport); // Debug log
      
      // AGGIORNA IMMEDIATAMENTE lo stato locale
      setTransports(prev => {
        const updated = prev.map(transport => transport.id === id ? updatedTransport : transport);
        console.log('Updated transports state:', updated); // Debug log
        return updated;
      });
      
      return updatedTransport;
    } catch (error) {
      console.error('Error updating transport:', error);
      setError(error instanceof Error ? error.message : 'Failed to update transport');
      throw error;
    }
  };

  const deleteTransport = async (id: string) => {
    try {
      console.log('Deleting transport:', id); // Debug log
      await transportsApi.delete(id);
      
      // AGGIORNA IMMEDIATAMENTE lo stato locale
      setTransports(prev => {
        const updated = prev.filter(transport => transport.id !== id);
        console.log('Updated transports state after delete:', updated); // Debug log
        return updated;
      });
    } catch (error) {
      console.error('Error deleting transport:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete transport');
      throw error;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, []);

  return {
    // Data
    users,
    drivers,
    destinations,
    transports,
    
    // State
    loading,
    error,
    isOnline,
    
    // User operations
    addUser,
    updateUser,
    deleteUser,
    
    // Driver operations
    addDriver,
    updateDriver,
    deleteDriver,
    
    // Destination operations
    addDestination,
    updateDestination,
    deleteDestination,
    
    // Transport operations
    addTransport,
    updateTransport,
    deleteTransport,
    
    // Utility
    loadAllData,
    checkConnection,
    clearError,
  };
}