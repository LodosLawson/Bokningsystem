import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, LanguageCode, UserProfile } from '../types';

interface AuthContextType {
  user: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string, businessName?: string) => Promise<void>;
  continueAsGuest: (name?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'bokalist_active_session';
const PROFILE_KEY = 'bokalist_profile';
const REGISTERED_USERS_KEY = 'bokalist_registered_accounts';

interface StoredAccount {
  uid: string;
  name: string;
  email: string;
  passwordHash: string;
  businessName: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('bokalist_lang');
    if (saved && (saved === 'en' || saved === 'sv')) {
      return saved as LanguageCode;
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem('bokalist_lang', lang);
    if (user && userProfile) {
      updateProfileData({ language: lang }).catch(() => {});
    }
  };

  // Restore session on boot
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedSession) {
        const u = JSON.parse(savedSession) as AppUser;
        setUser(u);
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        }
      }
    } catch (e) {
      console.warn('Error reading saved session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Simple local account registration (works everywhere on Netlify without any third party)
  const signupWithEmail = async (name: string, email: string, pass: string, businessName?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    const users: StoredAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

    const existing = users.find((u) => u.email === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newAccount: StoredAccount = {
      uid,
      name: name.trim() || 'Business Owner',
      email: cleanEmail,
      passwordHash: pass, // Simple local credential storage
      businessName: businessName?.trim() || 'My Salon & Studio',
    };

    users.push(newAccount);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

    const appUser: AppUser = {
      uid,
      email: cleanEmail,
      displayName: newAccount.name,
    };

    const profile: UserProfile = {
      userId: uid,
      email: cleanEmail,
      displayName: newAccount.name,
      businessName: newAccount.businessName,
      currency: 'kr',
      language: currentLanguage,
      createdAt: new Date().toISOString(),
    };

    setUser(appUser);
    setUserProfile(profile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    const users: StoredAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

    const account = users.find((u) => u.email === cleanEmail && u.passwordHash === pass);
    if (!account) {
      // If no accounts yet, or credentials don't match, check if it's the first time
      if (users.length === 0) {
        // Auto register on first attempt for convenience
        await signupWithEmail(email.split('@')[0], email, pass, 'Bokalist Studio');
        return;
      }
      throw new Error('Invalid email or password.');
    }

    const appUser: AppUser = {
      uid: account.uid,
      email: account.email,
      displayName: account.name,
    };

    const profile: UserProfile = {
      userId: account.uid,
      email: account.email,
      displayName: account.name,
      businessName: account.businessName,
      currency: 'kr',
      language: currentLanguage,
      createdAt: new Date().toISOString(),
    };

    setUser(appUser);
    setUserProfile(profile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  };

  // Google sign in placeholder ready for when Google is connected
  const signInWithGoogle = async () => {
    // When Google is integrated later, this can call Google Auth
    await continueAsGuest('Mehemmed', 'MehemmedAC@gmail.com');
  };

  // 1-Click Instant Demo / Guest access
  const continueAsGuest = async (customName?: string, customEmail?: string) => {
    const uid = 'bokalist_default_user';
    const guestUser: AppUser = {
      uid,
      email: customEmail || 'MehemmedAC@gmail.com',
      displayName: customName || 'Mehemmed',
    };

    const guestProfile: UserProfile = {
      userId: uid,
      email: guestUser.email || '',
      displayName: guestUser.displayName || 'Mehemmed',
      businessName: 'Bokalist Studio & Spa',
      currency: 'kr',
      language: currentLanguage,
      createdAt: new Date().toISOString(),
    };

    setUser(guestUser);
    setUserProfile(guestProfile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(guestUser));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(guestProfile));
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setUser(null);
    setUserProfile(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const current = userProfile ? { ...userProfile, ...updates } : null;
    setUserProfile(current);
    if (current) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(current));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        currentLanguage,
        setLanguage,
        signInWithGoogle,
        loginWithEmail,
        signupWithEmail,
        continueAsGuest,
        logout,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
