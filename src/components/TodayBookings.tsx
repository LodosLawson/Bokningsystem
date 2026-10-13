import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Tag,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Edit2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface TodayBookingsProps {
  appointments: Appointment[];
  currency: string;
  onEdit: (appointment: Appointment) => void;
  onAddNew: (defaultDate?: string) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}

export const TodayBookings: React.FC<TodayBookingsProps> = ({
  appointments,
  currency,
  onEdit,
  onAddNew,
  onUpdateStatus,
}) => {
  const { currentLanguage } = useAuth();
  const t = translations[currentLanguage];

  // Today string YYYY-MM-DD in local time
  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const todayList = appointments.filter((a) => a.date === todayStr);

  // Status metrics for today
  const totalToday = todayList.length;
  const completedToday = todayList.filter((a) => a.status === 'completed').length;
  const pendingToday = todayList.filter((a) => a.status === 'pending').length;
  const confirmedToday = todayList.filter((a) => a.status === 'confirmed').length;
  const todayRevenue = todayList
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {t.statusConfirmed}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {t.statusCompleted}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            {t.statusPending}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            {t.statusCancelled}
          </span>
        );
    }
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Header with Title and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {t.todayTitle}
              <span className="text-xs font-normal text-slate-400">
                ({new Date().toLocaleDateString(currentLanguage === 'sv' ? 'sv-SE' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })})
              </span>
            </h2>
          </div>
        </div>

        {/* Today summary pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-slate-400">{t.todayCount}:</span>{' '}
            <strong className="text-white font-bold">{totalToday}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            {todayRevenue} {currency}
          </div>
          <button
            onClick={() => onAddNew(todayStr)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-600 text-white font-medium transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.newBooking}</span>
          </button>
        </div>
      </div>

      {todayList.length === 0 ? (
        <div className="py-10 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
          <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
          <p className="text-sm text-slate-400">{t.todayEmpty}</p>
          <button
            onClick={() => onAddNew(todayStr)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.newBooking}</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {todayList.map((app) => (
            <div
              key={app.id}
              className={`py-3.5 sm:py-4 px-2 sm:px-3 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                app.status === 'completed'
                  ? 'bg-slate-950/30 opacity-75'
                  : app.status === 'cancelled'
                  ? 'bg-rose-950/10 opacity-60 line-through'
                  : 'hover:bg-slate-800/40'
              }`}
            >
              {/* Left: Time and Customer info */}
              <div className="flex items-start sm:items-center gap-3">
                {/* Time badge */}
                <div className="w-16 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center flex-shrink-0">
                  <Clock className="w-3 h-3 text-sky-400 mb-0.5" />
                  <span className="text-xs font-bold text-white tracking-wide">{app.time}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      {app.customerName}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                    {app.customerPhone && (
                      <a
                        href={`tel:${app.customerPhone}`}
                        className="inline-flex items-center gap-1 hover:text-sky-400 transition"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{app.customerPhone}</span>
                      </a>
                    )}

                    {/* Services and Tags */}
                    {app.services && app.services.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.services.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
                          >
                            <Tag className="w-2.5 h-2.5 text-sky-400" />
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-xs text-slate-400 italic mt-1 max-w-xl">
                      "{app.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Price & Quick Status Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-xs text-slate-400 block">{t.totalPrice}</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400">
                    {app.price} {currency}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Status toggle actions */}
                  {app.status !== 'completed' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'completed')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1"
                      title={t.statusCompleted}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.statusCompleted}</span>
                    </button>
                  )}

                  {app.status !== 'confirmed' && app.status !== 'completed' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'confirmed')}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/30 transition flex items-center gap-1"
                      title={t.statusConfirmed}
                    >
                      <span>{t.statusConfirmed}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(app)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title={t.editBooking}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
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
