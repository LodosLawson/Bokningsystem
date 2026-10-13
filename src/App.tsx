import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  Loader2,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { UpcomingBookings } from './components/UpcomingBookings';
import { TodayBookings } from './components/TodayBookings';
import { MonthlyCalendarTable } from './components/MonthlyCalendarTable';
import { AppointmentModal } from './components/AppointmentModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  subscribeServices,
  subscribeAppointments,
  saveAppointment,
  patchAppointment,
  removeAppointment,
  saveService,
  removeService,
} from './services/bookingService';
import { Appointment, AppointmentStatus, ServiceItem } from './types';
import { translations } from './i18n/translations';

const DashboardContent: React.FC = () => {
  const { user, userProfile, currentLanguage, updateProfileData } = useAuth();
  const t = translations[currentLanguage];

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [presetServices, setPresetServices] = useState<ServiceItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [defaultBookingDate, setDefaultBookingDate] = useState<string | undefined>(undefined);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const currency = userProfile?.currency || '₺';

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubServices = subscribeServices(user.uid, (services) => {
      setPresetServices(services);
    });

    const unsubAppointments = subscribeAppointments(user.uid, (apps) => {
      setAppointments(apps);
      setDataLoading(false);
    });

    return () => {
      unsubServices?.();
      unsubAppointments?.();
    };
  }, [user]);

  // Appointment actions
  const handleOpenNewBooking = (defaultDate?: string) => {
    setAppointmentToEdit(null);
    setDefaultBookingDate(defaultDate);
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (app: Appointment) => {
    setAppointmentToEdit(app);
    setDefaultBookingDate(app.date);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async (app: Appointment) => {
    await saveAppointment(app);
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    await patchAppointment(id, { status });
  };

  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      await removeAppointment(id);
    }
  };

  // Preset services actions
  const handleAddService = async (service: ServiceItem) => {
    await saveService(service);
  };

  const handleDeleteService = async (serviceId: string) => {
    await removeService(serviceId);
  };

  const handleUpdateCurrency = async (newCurrency: string) => {
    await updateProfileData({ currency: newCurrency });
  };

  const handleUpdateBusinessName = async (name: string) => {
    await updateProfileData({ businessName: name });
  };

  // Quick stats calculation
  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const totalCount = appointments.length;
  const totalEstimatedRevenue = appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Fixed Navbar */}
      <Navbar
        onOpenNewBooking={() => handleOpenNewBooking()}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Quick Top Metrics Header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-slate-400 block font-medium">
                {t.todayCount}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                {todayCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-slate-400 block font-medium">
                {t.pendingCount}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">
                {pendingCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-slate-400 block font-medium">
                {t.totalAppointments}
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5 block">
                {totalCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-slate-400 block font-medium">
                {t.estimatedRevenue}
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block truncate max-w-[140px]">
                {totalEstimatedRevenue} {currency}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {dataLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-sm">
              {currentLanguage === 'sv' ? 'Laddar bokningar...' : currentLanguage === 'en' ? 'Loading bookings...' : 'Randevular yükleniyor...'}
            </p>
          </div>
        ) : (
          <>
            {/* 1. ÜST KISIM: ZAMANı YAKLAŞAN RANDEVULAR */}
            <UpcomingBookings
              appointments={appointments}
              currency={currency}
              onEdit={handleEditAppointment}
              onUpdateStatus={handleUpdateStatus}
            />

            {/* 2. ORTA KISIM: GÜN İÇERİSİNDEKİ RANDEVULAR */}
            <TodayBookings
              appointments={appointments}
              currency={currency}
              onEdit={handleEditAppointment}
              onAddNew={handleOpenNewBooking}
              onUpdateStatus={handleUpdateStatus}
            />

            {/* 3. ALT KISIM: GENEL AYLIK TABLO & TAKVİM */}
            <MonthlyCalendarTable
              appointments={appointments}
              currency={currency}
              onEdit={handleEditAppointment}
              onDelete={handleDeleteAppointment}
              onAddNew={handleOpenNewBooking}
            />
          </>
        )}
      </main>

      {/* Appointment Modal (Create / Edit) */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        appointmentToEdit={appointmentToEdit}
        defaultDate={defaultBookingDate}
        presetServices={presetServices}
        currency={currency}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
      />

      {/* Settings Modal (Presets, Currency, Business, Languages) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        presetServices={presetServices}
        currency={currency}
        onClose={() => setIsSettingsModalOpen(false)}
        onAddService={handleAddService}
        onDeleteService={handleDeleteService}
        onUpdateCurrency={handleUpdateCurrency}
        onUpdateBusinessName={handleUpdateBusinessName}
      />

      {/* PWA Offline notification */}
      <OfflineIndicator lang={currentLanguage} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}

function AppRoot() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-2xl shadow-sky-500/30 mb-4 animate-pulse">
          <Calendar className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <DashboardContent />;
}
