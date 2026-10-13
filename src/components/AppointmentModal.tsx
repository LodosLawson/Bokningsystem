import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Tag,
  DollarSign,
  FileText,
  Plus,
  Check,
} from 'lucide-react';
import { Appointment, AppointmentStatus, SelectedServiceRef, ServiceItem } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface AppointmentModalProps {
  isOpen: boolean;
  appointmentToEdit: Appointment | null;
  defaultDate?: string;
  presetServices: ServiceItem[];
  currency: string;
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<void>;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  appointmentToEdit,
  defaultDate,
  presetServices,
  currency,
  onClose,
  onSave,
}) => {
  const { user, currentLanguage } = useAuth();
  const t = translations[currentLanguage];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [selectedServices, setSelectedServices] = useState<SelectedServiceRef[]>([]);
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [saving, setSaving] = useState(false);
  const [manualTagInput, setManualTagInput] = useState('');

  // Initialize or reset form fields
  useEffect(() => {
    if (appointmentToEdit) {
      setCustomerName(appointmentToEdit.customerName || '');
      setCustomerPhone(appointmentToEdit.customerPhone || '');
      setDate(appointmentToEdit.date || '');
      setTime(appointmentToEdit.time || '10:00');
      setSelectedServices(appointmentToEdit.services || []);
      setNotes(appointmentToEdit.notes || '');
      setPrice(appointmentToEdit.price || 0);
      setStatus(appointmentToEdit.status || 'confirmed');
    } else {
      const todayISO = defaultDate || new Date().toISOString().split('T')[0];
      setCustomerName('');
      setCustomerPhone('');
      setDate(todayISO);
      setTime('10:00');
      setSelectedServices([]);
      setNotes('');
      setPrice(0);
      setStatus('confirmed');
    }
  }, [appointmentToEdit, defaultDate, isOpen]);

  if (!isOpen || !user) return null;

  // Toggle a preset service tag
  const handleToggleService = (service: ServiceItem) => {
    const existsIndex = selectedServices.findIndex((s) => s.name === service.name);
    let updated: SelectedServiceRef[];

    if (existsIndex >= 0) {
      // Remove
      updated = selectedServices.filter((_, idx) => idx !== existsIndex);
    } else {
      // Add
      updated = [
        ...selectedServices,
        {
          serviceId: service.id,
          name: service.name,
          price: Number(service.price) || 0,
        },
      ];
    }

    setSelectedServices(updated);

    // Auto calculate price based on selected items
    const newSum = updated.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    setPrice(newSum);
  };

  // Add a manual custom tag on the fly
  const handleAddManualTag = () => {
    if (!manualTagInput.trim()) return;
    const newService: SelectedServiceRef = {
      name: manualTagInput.trim(),
      price: 0,
    };
    const updated = [...selectedServices, newService];
    setSelectedServices(updated);
    setManualTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !date || !time) return;

    setSaving(true);
    try {
      const appData: Appointment = {
        id: appointmentToEdit ? appointmentToEdit.id : `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.uid,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        date,
        time,
        services: selectedServices,
        notes: notes.trim(),
        price: Number(price) || 0,
        status,
        createdAt: appointmentToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(appData);
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            {appointmentToEdit ? t.editBooking : t.newBooking}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.customerName} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Müşteri Adı Soyadı"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.customerPhone}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.date} *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.time} *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Preset Services & Tags Selector (Clickable Chips) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-400" />
                {t.presetServicesTitle}
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedServices.length} {currentLanguage === 'sv' ? 'valda' : currentLanguage === 'en' ? 'selected' : 'seçildi'}
              </span>
            </div>

            {presetServices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800 max-h-36 overflow-y-auto">
                {presetServices.map((srv) => {
                  const isSelected = selectedServices.some((s) => s.name === srv.name);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleToggleService(srv)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition active:scale-95 border ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{srv.name}</span>
                      <span className="text-[10px] opacity-80">
                        ({srv.price} {currency})
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                {currentLanguage === 'sv'
                  ? 'Inga sparade tjänster. Lägg till i inställningar.'
                  : currentLanguage === 'en'
                  ? 'No preset services yet. Add them in settings.'
                  : 'Henüz kayıtlı işlem etiketi yok. Ayarlar menüsünden ekleyebilirsiniz.'}
              </p>
            )}

            {/* Quick manual tag addition */}
            <div className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={manualTagInput}
                onChange={(e) => setManualTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManualTag();
                  }
                }}
                placeholder={
                  currentLanguage === 'sv'
                    ? 'Lägg till egen etikett...'
                    : currentLanguage === 'en'
                    ? 'Add custom tag...'
                    : 'Özel işlem etiketi ekle...'
                }
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleAddManualTag}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium border border-slate-700 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Description / Manual Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {t.manualNotes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.manualNotesPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          {/* Price & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.totalPrice} ({currency}) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.status}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="confirmed">{t.statusConfirmed}</option>
                <option value="pending">{t.statusPending}</option>
                <option value="completed">{t.statusCompleted}</option>
                <option value="cancelled">{t.statusCancelled}</option>
              </select>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-300 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {saving ? '...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
