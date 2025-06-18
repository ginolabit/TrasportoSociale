export interface User {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  licenseNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Destination {
  id: string;
  name: string;
  address: string;
  cost: number;
  notes?: string;
  createdAt: string;
}

export interface Transport {
  id: string;
  date: string;
  time: string;
  userId: string;
  driverId: string;
  destinationId: string;
  notes?: string;
  createdAt: string;
}

export type ViewType = 'dashboard' | 'calendar' | 'users' | 'drivers' | 'destinations' | 'reports' | 'settings';