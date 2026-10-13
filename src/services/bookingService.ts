import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import { Appointment, ServiceItem } from '../types';

const LOCAL_STORAGE_KEY_APPS = 'randevu_appointments_data';
const LOCAL_STORAGE_KEY_SERVICES = 'randevu_services_data';

// Initial sample services for fresh workspaces
export const defaultSampleServices: ServiceItem[] = [
  { id: 'srv_1', userId: 'default', name: 'Saç Kesimi & Yıkama', price: 250, durationMinutes: 40 },
  { id: 'srv_2', userId: 'default', name: 'Sakal Tıraşı & Bakım', price: 150, durationMinutes: 20 },
  { id: 'srv_3', userId: 'default', name: 'Özel Cilt Bakımı', price: 400, durationMinutes: 60 },
  { id: 'srv_4', userId: 'default', name: 'Saç Boyama & Röfle', price: 650, durationMinutes: 90 },
  { id: 'srv_5', userId: 'default', name: 'Manikür & Pedikür', price: 300, durationMinutes: 45 },
];

export function getInitialSampleAppointments(userId: string): Appointment[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomY = tomorrow.getFullYear();
  const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomD = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tomY}-${tomM}-${tomD}`;

  // Next week
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 5);
  const nwY = nextWeek.getFullYear();
  const nwM = String(nextWeek.getMonth() + 1).padStart(2, '0');
  const nwD = String(nextWeek.getDate()).padStart(2, '0');
  const nextWeekStr = `${nwY}-${nwM}-${nwD}`;

  const currentHour = now.getHours();
  const nextHour1 = String((currentHour + 1) % 24).padStart(2, '0') + ':00';
  const nextHour3 = String((currentHour + 3) % 24).padStart(2, '0') + ':30';

  return [
    {
      id: 'app_sample_1',
      userId,
      customerName: 'Murat Kaya',
      customerPhone: '+90 532 111 2233',
      date: todayStr,
      time: nextHour1,
      services: [{ name: 'Saç Kesimi & Yıkama', price: 250 }],
      notes: 'Hafif wax ve saç kurutma istendi',
      price: 250,
      status: 'confirmed',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_sample_2',
      userId,
      customerName: 'Zeynep Demir',
      customerPhone: '+90 544 333 4455',
      date: todayStr,
      time: nextHour3,
      services: [{ name: 'Özel Cilt Bakımı', price: 400 }],
      notes: 'Hassas cilt için nemlendirici maske',
      price: 400,
      status: 'pending',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_sample_3',
      userId,
      customerName: 'Ali Can',
      customerPhone: '+90 555 777 8899',
      date: todayStr,
      time: '09:30',
      services: [{ name: 'Sakal Tıraşı & Bakım', price: 150 }],
      notes: 'Sakal düzeltme yapıldı',
      price: 150,
      status: 'completed',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_sample_4',
      userId,
      customerName: 'Diyar Barzani',
      customerPhone: '+90 535 999 0011',
      date: tomorrowStr,
      time: '14:00',
      services: [
        { name: 'Saç Kesimi & Yıkama', price: 250 },
        { name: 'Sakal Tıraşı & Bakım', price: 150 },
      ],
      notes: 'Özel randevu paketi',
      price: 400,
      status: 'confirmed',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_sample_5',
      userId,
      customerName: 'Sara Lindqvist',
      customerPhone: '+46 70 123 4567',
      date: nextWeekStr,
      time: '11:00',
      services: [{ name: 'Saç Boyama & Röfle', price: 650 }],
      notes: 'Açık sarı tonlar tercih edildi',
      price: 650,
      status: 'confirmed',
      createdAt: now.toISOString(),
    },
  ];
}

// Local listeners dispatcher
type AppListener = (apps: Appointment[]) => void;
type SrvListener = (srvs: ServiceItem[]) => void;
const appListeners: Set<AppListener> = new Set();
const srvListeners: Set<SrvListener> = new Set();

function getLocalApps(userId: string): Appointment[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_APPS}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading local apps:', e);
  }
  const samples = getInitialSampleAppointments(userId);
  setLocalApps(userId, samples);
  return samples;
}

function setLocalApps(userId: string, apps: Appointment[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_APPS}_${userId}`, JSON.stringify(apps));
    appListeners.forEach((fn) => fn(apps));
  } catch (e) {
    console.warn('Error storing local apps:', e);
  }
}

function getLocalServices(userId: string): ServiceItem[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_SERVICES}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading local services:', e);
  }
  const samples = defaultSampleServices.map((s) => ({ ...s, userId }));
  setLocalServices(userId, samples);
  return samples;
}

function setLocalServices(userId: string, services: ServiceItem[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_SERVICES}_${userId}`, JSON.stringify(services));
    srvListeners.forEach((fn) => fn(services));
  } catch (e) {
    console.warn('Error storing local services:', e);
  }
}

/**
 * Realtime subscription to preset services
 */
export function subscribeServices(
  userId: string,
  callback: (services: ServiceItem[]) => void
) {
  // If authenticated with real Firebase Auth, listen to Firestore
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = 'services';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ServiceItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as ServiceItem);
          });
          if (items.length === 0) {
            // Seed sample services if user has none
            defaultSampleServices.forEach((srv) => {
              saveService({ ...srv, id: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userId });
            });
          } else {
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore service listen fell back to local:', error);
          callback(getLocalServices(userId));
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn('Firestore service subscribe fallback:', error);
      callback(getLocalServices(userId));
      return () => {};
    }
  }

  // Local storage listener
  callback(getLocalServices(userId));
  srvListeners.add(callback);
  return () => {
    srvListeners.delete(callback);
  };
}

/**
 * Add or update preset service
 */
export async function saveService(service: ServiceItem): Promise<void> {
  const userId = service.userId;
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = `services/${service.id}`;
    try {
      await setDoc(doc(db, 'services', service.id), service);
      return;
    } catch (error) {
      console.warn('Save service to Firestore fallback:', error);
    }
  }

  // Local fallback
  const list = getLocalServices(userId);
  const idx = list.findIndex((s) => s.id === service.id);
  let updated: ServiceItem[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = service;
  } else {
    updated = [...list, service];
  }
  setLocalServices(userId, updated);
}

/**
 * Delete a preset service
 */
export async function removeService(serviceId: string): Promise<void> {
  const userId = auth.currentUser?.uid || 'local_user';
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = `services/${serviceId}`;
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      return;
    } catch (error) {
      console.warn('Delete service Firestore fallback:', error);
    }
  }

  // Local fallback
  const list = getLocalServices(userId);
  const updated = list.filter((s) => s.id !== serviceId);
  setLocalServices(userId, updated);
}

/**
 * Realtime subscription to appointments
 */
export function subscribeAppointments(
  userId: string,
  callback: (appointments: Appointment[]) => void
) {
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = 'appointments';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: Appointment[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as Appointment);
          });
          if (items.length === 0) {
            // Seed initial sample appointments
            const initialSamples = getInitialSampleAppointments(userId);
            initialSamples.forEach((app) => saveAppointment(app));
          } else {
            items.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore appointments listen fell back to local:', error);
          const apps = getLocalApps(userId);
          apps.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
          callback(apps);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn('Firestore appointments subscribe fallback:', error);
      const apps = getLocalApps(userId);
      apps.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
      callback(apps);
      return () => {};
    }
  }

  // Local storage listener
  const apps = getLocalApps(userId);
  apps.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  callback(apps);
  appListeners.add(callback);
  return () => {
    appListeners.delete(callback);
  };
}

/**
 * Save new or existing appointment
 */
export async function saveAppointment(appointment: Appointment): Promise<void> {
  const userId = appointment.userId;
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = `appointments/${appointment.id}`;
    try {
      await setDoc(doc(db, 'appointments', appointment.id), appointment);
      return;
    } catch (error) {
      console.warn('Save appointment Firestore fallback:', error);
    }
  }

  // Local storage
  const list = getLocalApps(userId);
  const idx = list.findIndex((a) => a.id === appointment.id);
  let updated: Appointment[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = appointment;
  } else {
    updated = [...list, appointment];
  }
  updated.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  setLocalApps(userId, updated);
}

/**
 * Update appointment status or fields
 */
export async function patchAppointment(
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<void> {
  const userId = auth.currentUser?.uid || 'local_user';
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = `appointments/${appointmentId}`;
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return;
    } catch (error) {
      console.warn('Patch appointment Firestore fallback:', error);
    }
  }

  // Local storage
  const list = getLocalApps(userId);
  const idx = list.findIndex((a) => a.id === appointmentId);
  if (idx >= 0) {
    const updated = [...list];
    updated[idx] = { ...updated[idx], ...updates, updatedAt: new Date().toISOString() };
    setLocalApps(userId, updated);
  }
}

/**
 * Delete appointment
 */
export async function removeAppointment(appointmentId: string): Promise<void> {
  const userId = auth.currentUser?.uid || 'local_user';
  if (auth.currentUser && !userId.startsWith('local_')) {
    const path = `appointments/${appointmentId}`;
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      return;
    } catch (error) {
      console.warn('Remove appointment Firestore fallback:', error);
    }
  }

  // Local storage
  const list = getLocalApps(userId);
  const updated = list.filter((a) => a.id !== appointmentId);
  setLocalApps(userId, updated);
}
