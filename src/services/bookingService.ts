import { Appointment, ServiceItem, UserProfile } from '../types';

const STORAGE_PREFIX = 'bokalist_';
const APPS_KEY = `${STORAGE_PREFIX}appointments`;
const SERVICES_KEY = `${STORAGE_PREFIX}services`;
const USERS_KEY = `${STORAGE_PREFIX}registered_users`;

// Default preset services for Bokalist
export const defaultBokalistServices: ServiceItem[] = [
  { id: 'srv_1', userId: 'default', name: 'Haircut & Styling', price: 350, durationMinutes: 45 },
  { id: 'srv_2', userId: 'default', name: 'Beard Trim & Care', price: 200, durationMinutes: 25 },
  { id: 'srv_3', userId: 'default', name: 'Facial Skin Treatment', price: 450, durationMinutes: 60 },
  { id: 'srv_4', userId: 'default', name: 'Hair Coloring', price: 750, durationMinutes: 90 },
  { id: 'srv_5', userId: 'default', name: 'Manicure & Spa', price: 300, durationMinutes: 40 },
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
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  // Next week
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 4);
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

  const currentHour = now.getHours();
  const nextTime1 = String((currentHour + 1) % 24).padStart(2, '0') + ':00';
  const nextTime2 = String((currentHour + 3) % 24).padStart(2, '0') + ':30';

  return [
    {
      id: 'app_1',
      userId,
      customerName: 'Alexander Lind',
      customerPhone: '+46 70 123 4567',
      date: todayStr,
      time: nextTime1,
      services: [{ name: 'Haircut & Styling', price: 350 }],
      notes: 'Classic taper fade',
      price: 350,
      status: 'confirmed',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_2',
      userId,
      customerName: 'Emma Bergqvist',
      customerPhone: '+46 73 987 6543',
      date: todayStr,
      time: nextTime2,
      services: [{ name: 'Facial Skin Treatment', price: 450 }],
      notes: 'Hydration mask requested',
      price: 450,
      status: 'pending',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_3',
      userId,
      customerName: 'Marcus Ekström',
      customerPhone: '+46 76 555 4433',
      date: todayStr,
      time: '09:30',
      services: [{ name: 'Beard Trim & Care', price: 200 }],
      notes: 'Shaping & beard oil',
      price: 200,
      status: 'completed',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_4',
      userId,
      customerName: 'Sophia Nilsson',
      customerPhone: '+46 70 888 9911',
      date: tomorrowStr,
      time: '14:00',
      services: [
        { name: 'Haircut & Styling', price: 350 },
        { name: 'Manicure & Spa', price: 300 },
      ],
      notes: 'Special event styling',
      price: 650,
      status: 'confirmed',
      createdAt: now.toISOString(),
    },
    {
      id: 'app_5',
      userId,
      customerName: 'Liam Johansson',
      customerPhone: '+46 72 333 2211',
      date: nextWeekStr,
      time: '11:15',
      services: [{ name: 'Hair Coloring', price: 750 }],
      notes: 'Ash blonde highlights',
      price: 750,
      status: 'confirmed',
      createdAt: now.toISOString(),
    },
  ];
}

// Reactive listeners
type AppListener = (apps: Appointment[]) => void;
type SrvListener = (srvs: ServiceItem[]) => void;
const appListeners: Set<AppListener> = new Set();
const srvListeners: Set<SrvListener> = new Set();

function notifyApps(apps: Appointment[]) {
  appListeners.forEach((fn) => {
    try {
      fn(apps);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
}

function notifyServices(srvs: ServiceItem[]) {
  srvListeners.forEach((fn) => {
    try {
      fn(srvs);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
}

function getStoredApps(userId: string): Appointment[] {
  try {
    const raw = localStorage.getItem(`${APPS_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Read apps error:', e);
  }
  const samples = getInitialSampleAppointments(userId);
  setStoredApps(userId, samples);
  return samples;
}

function setStoredApps(userId: string, apps: Appointment[]) {
  try {
    localStorage.setItem(`${APPS_KEY}_${userId}`, JSON.stringify(apps));
    notifyApps(apps);
  } catch (e) {
    console.warn('Save apps error:', e);
  }
}

function getStoredServices(userId: string): ServiceItem[] {
  try {
    const raw = localStorage.getItem(`${SERVICES_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Read services error:', e);
  }
  const samples = defaultBokalistServices.map((s) => ({ ...s, userId }));
  setStoredServices(userId, samples);
  return samples;
}

function setStoredServices(userId: string, services: ServiceItem[]) {
  try {
    localStorage.setItem(`${SERVICES_KEY}_${userId}`, JSON.stringify(services));
    notifyServices(services);
  } catch (e) {
    console.warn('Save services error:', e);
  }
}

// Realtime subscriptions
export function subscribeServices(
  userId: string,
  callback: (services: ServiceItem[]) => void
) {
  const current = getStoredServices(userId);
  callback(current);
  srvListeners.add(callback);
  return () => {
    srvListeners.delete(callback);
  };
}

export function saveService(service: ServiceItem): Promise<void> {
  const userId = service.userId;
  const list = getStoredServices(userId);
  const idx = list.findIndex((s) => s.id === service.id);
  let updated: ServiceItem[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = service;
  } else {
    updated = [...list, service];
  }
  setStoredServices(userId, updated);
  return Promise.resolve();
}

export function removeService(serviceId: string): Promise<void> {
  // Find across items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SERVICES_KEY)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as ServiceItem[];
          const filtered = list.filter((s) => s.id !== serviceId);
          if (filtered.length !== list.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            notifyServices(filtered);
          }
        }
      } catch {}
    }
  }
  return Promise.resolve();
}

export function subscribeAppointments(
  userId: string,
  callback: (appointments: Appointment[]) => void
) {
  const current = getStoredApps(userId);
  current.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  callback(current);
  appListeners.add(callback);
  return () => {
    appListeners.delete(callback);
  };
}

export function saveAppointment(appointment: Appointment): Promise<void> {
  const userId = appointment.userId;
  const list = getStoredApps(userId);
  const idx = list.findIndex((a) => a.id === appointment.id);
  let updated: Appointment[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = appointment;
  } else {
    updated = [...list, appointment];
  }
  updated.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  setStoredApps(userId, updated);
  return Promise.resolve();
}

export function patchAppointment(
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(APPS_KEY)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Appointment[];
          const idx = list.findIndex((a) => a.id === appointmentId);
          if (idx >= 0) {
            const updated = [...list];
            updated[idx] = { ...updated[idx], ...updates, updatedAt: new Date().toISOString() };
            updated.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
            localStorage.setItem(key, JSON.stringify(updated));
            notifyApps(updated);
          }
        }
      } catch {}
    }
  }
  return Promise.resolve();
}

export function removeAppointment(appointmentId: string): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(APPS_KEY)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Appointment[];
          const filtered = list.filter((a) => a.id !== appointmentId);
          if (filtered.length !== list.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            notifyApps(filtered);
          }
        }
      } catch {}
    }
  }
  return Promise.resolve();
}

/**
 * Backup Export (Download JSON file)
 */
export function exportAllData(userId: string): void {
  const data = {
    appName: 'Bokalist',
    exportedAt: new Date().toISOString(),
    appointments: getStoredApps(userId),
    services: getStoredServices(userId),
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bokalist-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Backup Restore (Import JSON file)
 */
export function importDataFromFile(userId: string, file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.appointments)) {
          setStoredApps(userId, parsed.appointments);
        }
        if (Array.isArray(parsed.services)) {
          setStoredServices(userId, parsed.services);
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file);
  });
}
