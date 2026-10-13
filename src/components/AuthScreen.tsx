import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Mail,
  User,
  Building,
  AlertCircle,
  Globe,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { languageNames, translations } from '../i18n/translations';
import { LanguageCode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export const AuthScreen: React.FC = () => {
  const {
    signInWithGoogle,
    loginWithEmail,
    signupWithEmail,
    continueAsGuest,
    currentLanguage,
    setLanguage,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInstantOption, setShowInstantOption] = useState(false);

  const t = translations[currentLanguage];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowInstantOption(false);
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signupWithEmail(name, email, password, businessName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setShowInstantOption(true);

      if (msg.includes('operation-not-allowed')) {
        setError(t.operationNotAllowedNotice);
      } else if (msg.includes('email-already-in-use')) {
        setError('Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.');
      } else if (msg.includes('weak-password')) {
        setError('Şifre en az 6 karakter olmalıdır.');
      } else if (msg.includes('invalid-email')) {
        setError('Lütfen geçerli bir e-posta adresi girin.');
      } else if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError(t.loginError);
      } else {
        setError(isSignUp ? t.signupError : t.loginError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setShowInstantOption(false);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setShowInstantOption(true);

      if (msg.includes('popup-blocked')) {
        setError('Tarayıcı veya önizleme çerçevesi (iFrame) popup penceresini engelledi. Aşağıdaki "Hızlı Giriş" butonu ile hemen devam edebilirsiniz.');
      } else if (msg.includes('unauthorized-domain')) {
        setError('Bu alan adı Firebase OAuth izinlerinde henüz eklenmemiş. Aşağıdaki "Hızlı Giriş" ile anında bağlanabilirsiniz.');
      } else if (msg.includes('popup-closed-by-user')) {
        setError('Giriş penceresi kapatıldı.');
      } else {
        setError('Google ile bağlantı kurulamadı. "Hızlı Giriş" seçeneği ile doğrudan uygulamaya geçebilirsiniz.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickGuest = async () => {
    setSubmitting(true);
    try {
      await continueAsGuest(name || 'Mehemmed', email || 'MehemmedAC@gmail.com');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Top Header with Language selector and PWA install */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            Boka<span className="text-sky-400">list</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton lang={currentLanguage} />

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
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isSignUp ? t.signUp : t.signIn}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {t.appSubtitle}
          </p>
        </div>

        {/* 1. Instant / One-Click Entry (Local Netlify storage) */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleQuickGuest}
            disabled={submitting}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-semibold text-sm transition shadow-lg shadow-sky-600/25 active:scale-[0.98] disabled:opacity-50 group"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 fill-white" />
              <span>{t.quickStart}</span>
            </div>
            <div className="flex items-center gap-1 text-xs opacity-90 group-hover:translate-x-0.5 transition">
              <span>{currentLanguage === 'sv' ? 'Öppna' : 'Enter'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            {currentLanguage === 'sv' ? 'Snabb åtkomst för att testa bokningar direkt' : 'Fast access to start managing bookings immediately'}
          </p>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="absolute bg-slate-900 px-3 text-xs text-slate-500 font-medium">veya</span>
        </div>

        {/* 2. Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {t.googleSignIn}
        </button>

        {/* Error / Assistance notice */}
        {error && (
          <div className="my-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>

            {showInstantOption && (
              <div className="mt-3 pt-2.5 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={handleQuickGuest}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  ⚡ Hızlı Giriş ile Devam Et
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="absolute bg-slate-900 px-3 text-xs text-slate-500 font-medium">veya e-posta / şifre</span>
        </div>

        {/* 3. Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.fullName}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.businessName}</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Kuaför & Güzellik Salonu"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@posta.com"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? '...' : isSignUp ? t.signUp : t.signIn}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          <span>{isSignUp ? t.hasAccount : t.noAccount}</span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setShowInstantOption(false);
            }}
            className="font-semibold text-sky-400 hover:text-sky-300 transition underline underline-offset-4"
          >
            {isSignUp ? t.signIn : t.signUp}
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-500 py-3">
        Bokalist PWA © {new Date().getFullYear()} — Simple & Modern Booking
      </div>
    </div>
  );
};
