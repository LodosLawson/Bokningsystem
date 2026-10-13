import React, { useState } from 'react';
import {
  X,
  Settings,
  Scissors,
  Plus,
  Trash2,
  Globe,
  Building,
  Check,
  Sparkles,
  Download,
  Upload,
  HardDrive,
} from 'lucide-react';
import { ServiceItem, LanguageCode, UserProfile } from '../types';
import { languageNames, translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { exportAllData, importDataFromFile } from '../services/bookingService';

interface SettingsModalProps {
  isOpen: boolean;
  presetServices: ServiceItem[];
  currency: string;
  onClose: () => void;
  onAddService: (service: ServiceItem) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onUpdateCurrency: (currency: string) => Promise<void>;
  onUpdateBusinessName: (name: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  presetServices,
  currency,
  onClose,
  onAddService,
  onDeleteService,
  onUpdateCurrency,
  onUpdateBusinessName,
}) => {
  const { user, userProfile, currentLanguage, setLanguage } = useAuth();
  const t = translations[currentLanguage];

  const [activeTab, setActiveTab] = useState<'services' | 'business' | 'language' | 'backup'>('services');

  // New service inputs
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('30');
  const [savingService, setSavingService] = useState(false);

  // Business settings
  const [businessNameInput, setBusinessNameInput] = useState(userProfile?.businessName || '');
  const [currencyInput, setCurrencyInput] = useState(currency || 'kr');
  const [savingProfile, setSavingProfile] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setSavingService(true);
    try {
      const newService: ServiceItem = {
        id: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.uid,
        name: newServiceName.trim(),
        price: Number(newServicePrice) || 0,
        durationMinutes: Number(newServiceDuration) || 30,
        createdAt: new Date().toISOString(),
      };
      await onAddService(newService);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('30');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingService(false);
    }
  };

  // Pre-load common sample services if user has none
  const handleLoadSampleServices = async () => {
    setSavingService(true);
    const samples = currentLanguage === 'sv' ? [
      { name: 'Klippning & Styling', price: 350, durationMinutes: 45 },
      { name: 'Skäggvård & Formning', price: 200, durationMinutes: 25 },
      { name: 'Ansiktsbehandling', price: 450, durationMinutes: 60 },
      { name: 'Färgning & Slingor', price: 750, durationMinutes: 90 },
      { name: 'Manikyr & Spa', price: 300, durationMinutes: 40 },
    ] : [
      { name: 'Haircut & Styling', price: 350, durationMinutes: 45 },
      { name: 'Beard Trim & Grooming', price: 200, durationMinutes: 25 },
      { name: 'Facial Skin Treatment', price: 450, durationMinutes: 60 },
      { name: 'Hair Coloring & Highlights', price: 750, durationMinutes: 90 },
      { name: 'Manicure & Spa', price: 300, durationMinutes: 40 },
    ];
    try {
      for (const sample of samples) {
        await onAddService({
          id: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: user.uid,
          name: sample.name,
          price: sample.price,
          durationMinutes: sample.durationMinutes,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setSavingService(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (businessNameInput !== userProfile?.businessName) {
        await onUpdateBusinessName(businessNameInput.trim());
      }
      if (currencyInput !== currency) {
        await onUpdateCurrency(currencyInput.trim());
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportBackup = () => {
    exportAllData(user.uid);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importDataFromFile(user.uid, file);
      setImportStatus(currentLanguage === 'sv' ? 'Säkerhetskopia återställd!' : 'Backup restored successfully!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus(currentLanguage === 'sv' ? 'Kunde inte läsa filen.' : 'Failed to import file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            {t.settings}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 mt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'services'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>{t.manageServices}</span>
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'business'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{t.businessName}</span>
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'language'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t.language}</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'backup'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>{t.dataBackup}</span>
          </button>
        </div>

        {/* Tab 1: Preset Services Manager */}
        {activeTab === 'services' && (
          <div className="mt-4 space-y-4">
            {/* Add new preset service form */}
            <form onSubmit={handleCreateService} className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                {t.addService}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder={currentLanguage === 'sv' ? 'T.ex. Klippning, Massage...' : 'e.g., Haircut, Massage...'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder={`${t.defaultPrice} (${currency})`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{t.duration}:</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                  <span className="text-xs text-slate-500">min</span>
                </div>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {savingService ? '...' : t.addService}
                </button>
              </div>
            </form>

            {/* List of existing services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {t.manageServices} ({presetServices.length})
                </span>
                {presetServices.length === 0 && (
                  <button
                    onClick={handleLoadSampleServices}
                    disabled={savingService}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.loadSamples}</span>
                  </button>
                )}
              </div>

              {presetServices.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                  {currentLanguage === 'sv' ? 'Inga förvalda tjänster än.' : 'No preset services yet.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {presetServices.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition"
                    >
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-white">
                          {srv.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {srv.durationMinutes ? `${srv.durationMinutes} min • ` : ''}
                          <strong className="text-emerald-400">{srv.price} {currency}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteService(srv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Business & Currency Settings */}
        {activeTab === 'business' && (
          <form onSubmit={handleSaveBusiness} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.businessName}
              </label>
              <input
                type="text"
                value={businessNameInput}
                onChange={(e) => setBusinessNameInput(e.target.value)}
                placeholder="e.g., Bokalist Studio"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.currency}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {['kr', '€', '$', '£', '₺', 'DKK'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrencyInput(curr)}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                      currencyInput === curr
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-50"
              >
                {savingProfile ? '...' : t.save}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Language Selector (English & Svenska) */}
        {activeTab === 'language' && (
          <div className="mt-4 space-y-2.5">
            <p className="text-xs text-slate-400 mb-3">
              {currentLanguage === 'sv' ? 'Välj språk för Bokalist:' : 'Select language for Bokalist:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(languageNames) as LanguageCode[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition text-left ${
                    currentLanguage === lang
                      ? 'bg-sky-600/20 border-sky-500 text-sky-300 ring-1 ring-sky-500'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{languageNames[lang].flag}</span>
                    <div>
                      <span className="text-sm font-semibold block">{languageNames[lang].name}</span>
                      <span className="text-[11px] text-slate-400 uppercase">{lang}</span>
                    </div>
                  </div>
                  {currentLanguage === lang && (
                    <Check className="w-5 h-5 text-sky-400 stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Data Storage & Backup for Netlify */}
        {activeTab === 'backup' && (
          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                {t.dataBackup}
              </h4>
              <p className="text-xs text-slate-400">
                {t.dataStoredLocally}
              </p>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-semibold text-white transition active:scale-95"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>{t.exportData}</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-semibold text-white transition cursor-pointer active:scale-95">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{t.importData}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Close Button footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
