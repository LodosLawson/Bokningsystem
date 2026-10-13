import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  testConnection,
} from '../firebase/config';
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

const LOCAL_SESSION_KEY = 'randevu_active_session';
const LOCAL_PROFILE_KEY = 'randevu_local_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('randevu_lang');
    if (saved && ['tr', 'en', 'az', 'ku', 'sv'].includes(saved)) {
      return saved as LanguageCode;
    }
    return 'tr';
  });

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem('randevu_lang', lang);
    if (user && userProfile) {
      updateProfileData({ language: lang }).catch(() => {});
    }
  };

  // Test server connection on boot
  useEffect(() => {
    testConnection().catch(() => {});
  }, []);

  // Fetch or initialize user profile doc in Firestore
  const syncUserProfile = async (currentUser: { uid: string; email: string | null; displayName: string | null }) => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        if (data.language && ['tr', 'en', 'az', 'ku', 'sv'].includes(data.language)) {
          setCurrentLanguage(data.language);
          localStorage.setItem('randevu_lang', data.language);
        }
      } else {
        const newProfile: UserProfile = {
          userId: currentUser.uid,
          email: currentUser.email || 'user@randevupro.app',
          displayName: currentUser.displayName || 'İşletme Sahibi',
          businessName: 'Benim Salonum & İşletmem',
          currency: '₺',
          language: currentLanguage,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Sync profile Firestore fallback to local profile:', err);
      // Fallback local profile
      const localProfile: UserProfile = {
        userId: currentUser.uid,
        email: currentUser.email || 'user@randevupro.app',
        displayName: currentUser.displayName || 'İşletme Sahibi',
        businessName: 'Benim Salonum & İşletmem',
        currency: '₺',
        language: currentLanguage,
        createdAt: new Date().toISOString(),
      };
      setUserProfile(localProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(appUser);
        try {
          await syncUserProfile(currentUser);
        } catch (e) {
          console.warn('Profile sync warning:', e);
        }
        setLoading(false);
      } else {
        // Check for local guest session
        try {
          const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
          const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
          if (savedSession) {
            const parsedUser = JSON.parse(savedSession) as AppUser;
            setUser(parsedUser);
            if (savedProfile) {
              setUserProfile(JSON.parse(savedProfile));
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } catch {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        const appUser: AppUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
        };
        setUser(appUser);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        await syncUserProfile(cred.user);
      }
    } catch (error: unknown) {
      const errCode = (error as { code?: string })?.code || '';
      console.warn('Google Sign In result notice:', errCode);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        const appUser: AppUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
        };
        setUser(appUser);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        await syncUserProfile(cred.user);
      }
    } catch (error: unknown) {
      console.warn('Email login notice:', error);
      throw error;
    }
  };

  const signupWithEmail = async (name: string, email: string, pass: string, businessName?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        if (name) {
          try {
            await updateProfile(cred.user, { displayName: name });
          } catch (pErr) {
            console.warn('DisplayName update note:', pErr);
          }
        }
        const appUser: AppUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: name || cred.user.displayName,
        };
        setUser(appUser);
        localStorage.removeItem(LOCAL_SESSION_KEY);

        const newProfile: UserProfile = {
          userId: cred.user.uid,
          email,
          displayName: name || 'Kullanıcı',
          businessName: businessName || 'Randevu Merkezi',
          currency: '₺',
          language: currentLanguage,
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
          setUserProfile(newProfile);
        } catch {
          setUserProfile(newProfile);
        }
      }
    } catch (error: unknown) {
      console.warn('Email signup notice:', error);
      throw error;
    }
  };

  /**
   * Instant local demo / guest login
   */
  const continueAsGuest = async (customName?: string, customEmail?: string) => {
    const guestUser: AppUser = {
      uid: 'local_admin_user',
      email: customEmail || 'MehemmedAC@gmail.com',
      displayName: customName || 'Mehemmed',
    };

    const guestProfile: UserProfile = {
      userId: guestUser.uid,
      email: guestUser.email || '',
      displayName: guestUser.displayName || 'Mehemmed',
      businessName: 'Randevu & Rezervasyon Salonu',
      currency: '₺',
      language: currentLanguage,
      createdAt: new Date().toISOString(),
    };

    setUser(guestUser);
    setUserProfile(guestProfile);

    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(guestUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(guestProfile));
    } catch (e) {
      console.warn('Local storage session write warning:', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore if not signed in to Firebase
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    setUser(null);
    setUserProfile(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));

    // Save to local storage
    try {
      const current = userProfile ? { ...userProfile, ...updates } : null;
      if (current) {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(current));
      }
    } catch {}

    // If real Firebase auth, also update Firestore
    if (auth.currentUser && !user.uid.startsWith('local_')) {
      try {
        await updateDoc(doc(db, 'users', user.uid), updates);
      } catch (err) {
        console.warn('Profile Firestore update note:', err);
      }
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
