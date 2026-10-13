import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  List,
  Grid,
  Clock,
  User,
  Phone,
  Tag,
  Edit2,
  Trash2,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface MonthlyCalendarTableProps {
  appointments: Appointment[];
  currency: string;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onAddNew: (defaultDate?: string) => void;
}

export const MonthlyCalendarTable: React.FC<MonthlyCalendarTableProps> = ({
  appointments,
  currency,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const { currentLanguage } = useAuth();
  const t = translations[currentLanguage];

  // View state: 'table' or 'calendar'
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Month navigation: default to current year and month
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthYearString = useMemo(() => {
    return currentDate.toLocaleDateString(
      currentLanguage === 'sv' ? 'sv-SE' : 'en-US',
      { month: 'long', year: 'numeric' }
    );
  }, [currentDate, currentLanguage]);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayFilter(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayFilter(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayFilter(null);
  };

  // Filter appointments for the current month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthAppointments = useMemo(() => {
    return appointments.filter((a) => a.date.startsWith(monthPrefix));
  }, [appointments, monthPrefix]);

  // Applied filtered list for search & status & day filter
  const filteredList = useMemo(() => {
    return monthAppointments.filter((a) => {
      if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedDayFilter && a.date !== selectedDayFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.customerName.toLowerCase().includes(q);
        const matchesPhone = a.customerPhone?.toLowerCase().includes(q);
        const matchesNotes = a.notes?.toLowerCase().includes(q);
        const matchesServices = a.services?.some((s) => s.name.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesNotes && !matchesServices) {
          return false;
        }
      }
      return true;
    });
  }, [monthAppointments, selectedStatusFilter, selectedDayFilter, searchQuery]);

  // Month summary metrics
  const totalMonthAppointments = monthAppointments.length;
  const monthRevenue = monthAppointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const monthCompleted = monthAppointments.filter((a) => a.status === 'completed').length;

  // Calendar calculations (days grid)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dayNum: number;
      dateStr: string;
      appointmentsCount: number;
      revenue: number;
    } | null> = [];

    // Empty offset days
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayApps = monthAppointments.filter((a) => a.date === dateStr);
      const dayRev = dayApps
        .filter((a) => a.status !== 'cancelled')
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      days.push({
        dayNum: d,
        dateStr,
        appointmentsCount: dayApps.length,
        revenue: dayRev,
      });
    }

    return days;
  }, [year, month, monthAppointments]);

  const weekDayHeaders = currentLanguage === 'sv'
    ? ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {t.statusConfirmed}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {t.statusCompleted}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-2.5 h-2.5" />
            {t.statusPending}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-2.5 h-2.5" />
            {t.statusCancelled}
          </span>
        );
    }
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Month Toolbar & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white capitalize tracking-tight">
              {t.monthlyTitle}
            </h2>
            <p className="text-xs text-slate-400 capitalize">{monthYearString}</p>
          </div>
        </div>

        {/* Month Navigation & Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Stepper */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Önceki Ay"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-white capitalize min-w-[100px] text-center">
              {monthYearString}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Sonraki Ay"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
          >
            {t.today}
          </button>

          {/* View Mode Toggle: Table or Grid Calendar */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t.table}</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'calendar' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{t.calendar}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Month Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 my-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block">{t.totalAppointments}</span>
          <span className="text-base sm:text-lg font-bold text-white">{totalMonthAppointments}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block">{t.estimatedRevenue}</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400">
            {monthRevenue} {currency}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">{t.statusCompleted}</span>
            <span className="text-base sm:text-lg font-bold text-sky-400">{monthCompleted}</span>
          </div>
          <button
            onClick={() => onAddNew()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.newBooking}</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' ? (
        <div className="mt-3">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-1.5">
            {weekDayHeaders.map((day, i) => (
              <div key={i} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[64px] sm:min-h-[84px] rounded-xl bg-slate-950/20 border border-slate-900/40 opacity-30"
                  />
                );
              }

              const isSelected = selectedDayFilter === cell.dateStr;
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    if (selectedDayFilter === cell.dateStr) {
                      setSelectedDayFilter(null);
                    } else {
                      setSelectedDayFilter(cell.dateStr);
                    }
                  }}
                  className={`min-h-[64px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-600/20 border-sky-500 ring-2 ring-sky-500/30'
                      : isToday
                      ? 'bg-slate-800/90 border-sky-500/50'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center'
                          : 'text-slate-200'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {cell.appointmentsCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center border border-sky-500/30">
                        {cell.appointmentsCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    {cell.revenue > 0 && (
                      <span className="text-[10px] font-medium text-emerald-400 block truncate">
                        {cell.revenue} {currency}
                      </span>
                    )}
                    {cell.appointmentsCount === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNew(cell.dateStr);
                        }}
                        className="opacity-0 hover:opacity-100 text-[10px] text-slate-500 hover:text-sky-400 transition"
                      >
                        + Ekle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDayFilter && (
            <div className="mt-4 p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs text-sky-200">
              <span>
                Seçilen Gün: <strong>{selectedDayFilter}</strong> ({filteredList.length} Randevu)
              </span>
              <button
                onClick={() => setSelectedDayFilter(null)}
                className="underline hover:text-white"
              >
                Filtreyi Temizle
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Table List View (also shown or filtered below calendar) */}
      <div className="mt-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchCustomer}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="confirmed">{t.statusConfirmed}</option>
              <option value="pending">{t.statusPending}</option>
              <option value="completed">{t.statusCompleted}</option>
              <option value="cancelled">{t.statusCancelled}</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] sm:text-xs uppercase text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-3 sm:px-4">{t.date} & {t.time}</th>
                <th className="py-3 px-3 sm:px-4">{t.customerName}</th>
                <th className="py-3 px-3 sm:px-4">{t.presetServicesTitle}</th>
                <th className="py-3 px-3 sm:px-4">{t.totalPrice}</th>
                <th className="py-3 px-3 sm:px-4">{t.status}</th>
                <th className="py-3 px-3 sm:px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    {t.noResults}
                  </td>
                </tr>
              ) : (
                filteredList.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* Date and Time */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{app.date}</div>
                      <div className="text-[11px] text-sky-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {app.time}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {app.customerName}
                      </div>
                      {app.customerPhone && (
                        <a
                          href={`tel:${app.customerPhone}`}
                          className="text-[11px] text-slate-400 hover:text-sky-400 transition flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {app.customerPhone}
                        </a>
                      )}
                    </td>

                    {/* Services and Notes */}
                    <td className="py-3 px-3 sm:px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {app.services && app.services.length > 0 ? (
                          app.services.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
                            >
                              <Tag className="w-2.5 h-2.5 text-sky-400" />
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs italic">-</span>
                        )}
                      </div>
                      {app.notes && (
                        <p className="text-[11px] text-slate-400 italic mt-1 truncate">
                          {app.notes}
                        </p>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-bold text-emerald-400">
                      {app.price} {currency}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEdit(app)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title={t.editBooking}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(app.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
