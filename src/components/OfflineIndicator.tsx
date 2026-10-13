import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { translations } from '../i18n/translations';
import { LanguageCode } from '../types';

export const OfflineIndicator: React.FC<{ lang: LanguageCode }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  const t = translations[lang];

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl border border-amber-300 animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 text-slate-950 flex-shrink-0 animate-bounce" />
      <span>{t.offlineNotice}</span>
    </div>
  );
};
