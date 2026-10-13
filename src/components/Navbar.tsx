import React from 'react';
import {
  Calendar,
  Plus,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { languageNames, translations } from '../i18n/translations';
import { LanguageCode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenNewBooking: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewBooking,
  onOpenSettings,
}) => {
  const { userProfile, logout, currentLanguage, setLanguage } = useAuth();
  const t = translations[currentLanguage];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and business branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-base sm:text-lg text-white tracking-tight truncate block">
              Boka<span className="text-sky-400">list</span>
            </span>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
              {userProfile?.businessName || t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fast 1-Click Language Switcher (EN & SV) */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentLanguage === 'en'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="English"
            >
              🇬🇧 EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('sv')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentLanguage === 'sv'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Svenska"
            >
              🇸🇪 SV
            </button>
          </div>

          {/* New Appointment button */}
          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-600/30 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">{t.newBooking}</span>
          </button>

          {/* Settings modal trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition flex items-center gap-1.5"
            title={t.settings}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">{t.settings}</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton lang={currentLanguage} />

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700/60 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
            title={t.signOut}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
