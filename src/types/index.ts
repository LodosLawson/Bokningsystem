export type LanguageCode = 'en' | 'sv';

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  businessName?: string;
  currency?: string;
  language?: LanguageCode;
  createdAt?: string;
}

export interface ServiceItem {
  id: string;
  userId: string;
  name: string;
  price: number;
  durationMinutes?: number;
  color?: string;
  createdAt?: string;
}

export interface SelectedServiceRef {
  serviceId?: string;
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  services: SelectedServiceRef[];
  notes?: string;
  price: number;
  status: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
}
