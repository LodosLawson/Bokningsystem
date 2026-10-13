import React from 'react';
import {
  Clock,
  User,
  Phone,
  Tag,
  CheckCircle2,
  Calendar,
  AlertCircle,
  MoreVertical,
  Edit2,
  XCircle,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface UpcomingBookingsProps {
  appointments: Appointment[];
  currency: string;
  onEdit: (appointment: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}

export const UpcomingBookings: React.FC<UpcomingBookingsProps> = ({
  appointments,
  currency,
  onEdit,
  onUpdateStatus,
}) => {
  const { currentLanguage } = useAuth();
  const t = translations[currentLanguage];

  // Helper to determine relative time label
  const getRelativeTime = (dateStr: string, timeStr: string) => {
    try {
      const now = new Date();
      const target = new Date(`${dateStr}T${timeStr}:00`);
      const diffMs = target.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      if (diffMins < 0) {
        return `${Math.abs(diffMins)} dk önce`;
      }
      if (diffMins <= 60) {
        return `${diffMins} ${t.inMinutes}`;
      }
      if (diffHours < 24) {
        return `${diffHours} ${t.inHours}`;
      }

      const todayStr = now.toISOString().split('T')[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        return `${t.today} ${timeStr}`;
      }
      if (dateStr === tomorrowStr) {
        return `${t.tomorrow} ${timeStr}`;
      }

      return `${dateStr} ${timeStr}`;
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  // Filter upcoming: appointments from now into the future, sorted by nearest first, excluding completed/cancelled
  const now = new Date();
  const nowISO = `${now.toISOString().split('T')[0]}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const upcomingList = appointments
    .filter((a) => {
      const appointmentDT = `${a.date}T${a.time}`;
      return appointmentDT >= nowISO && a.status !== 'cancelled' && a.status !== 'completed';
    })
    .slice(0, 6);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.statusConfirmed}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {t.statusPending}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t.upcomingTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.upcomingSubtitle}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-semibold">
          {upcomingList.length} Randevu
        </span>
      </div>

      {upcomingList.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-slate-400">{t.upcomingEmpty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {upcomingList.map((app) => (
            <div
              key={app.id}
              className="group relative bg-gradient-to-b from-slate-800/80 to-slate-800/40 hover:from-slate-800 hover:to-slate-800/70 border border-slate-700/70 hover:border-sky-500/50 rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md"
            >
              {/* Header with relative countdown and status badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{getRelativeTime(app.date, app.time)}</span>
                </div>
                {getStatusBadge(app.status)}
              </div>

              {/* Customer info */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm sm:text-base group-hover:text-sky-300 transition flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {app.customerName}
                  </h3>
                  {app.customerPhone && (
                    <a
                      href={`tel:${app.customerPhone}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{app.customerPhone}</span>
                    </a>
                  )}
                </div>

                {/* Price pill */}
                <div className="text-right">
                  <span className="font-bold text-sm text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {app.price} {currency}
                  </span>
                </div>
              </div>

              {/* Services tags */}
              {app.services && app.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {app.services.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 text-[11px] border border-slate-700/80"
                    >
                      <Tag className="w-2.5 h-2.5 text-sky-400" />
                      {s.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes if manual description exists */}
              {app.notes && (
                <p className="text-xs text-slate-400 italic line-clamp-1 mb-3 bg-slate-950/40 p-1.5 rounded-md">
                  "{app.notes}"
                </p>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => onEdit(app)}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-400 transition font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{t.editBooking}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateStatus(app.id, 'completed')}
                    title={t.statusCompleted}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStatus(app.id, 'cancelled')}
                    title={t.statusCancelled}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
