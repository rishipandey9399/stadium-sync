import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

/**
 * @typedef {Object} AuthContextValue
 * @property {import('firebase/auth').User | null} currentUser - The active Firebase user.
 * @property {boolean} loading - True while the auth state is being resolved.
 * @property {function(string, string): Promise<void>} login - Email/password sign-in.
 * @property {function(string, string): Promise<void>} signup - Email/password sign-up.
 * @property {function(): Promise<void>} loginWithGoogle - Google OAuth sign-in.
 * @property {function(): Promise<void>} logout - Sign out the current user.
 */

const AuthContext = createContext(null);

/**
 * Custom hook to access the authentication context.
 * Throws descriptively if used outside of AuthProvider.
 *
 * @returns {AuthContextValue}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};

const IS_DEMO_MODE = auth.app.options.apiKey === import.meta.env.VITE_FIREBASE_API_KEY &&
  !import.meta.env.VITE_FIREBASE_API_KEY;

/**
 * AuthProvider Component
 *
 * Wraps the application with Firebase authentication state management.
 * Supports email/password and Google OAuth sign-in flows.
 * Falls back to a safe demo mode if Firebase keys are not configured.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Handles errors that arise from an unconfigured Firebase instance.
   * @param {import('firebase/auth').AuthError} error
   * @param {string} fallbackEmail
   */
  const handleDemoFallback = (error, fallbackEmail) => {
    const demoErrors = ['auth/invalid-api-key', 'auth/app-not-authorized'];
    if (demoErrors.includes(error.code)) {
      console.warn('[AuthContext] Demo mode active — Firebase not configured.');
      setCurrentUser({ email: fallbackEmail, uid: 'demo-user' });
      return;
    }
    throw error;
  };

  /** @param {string} email @param {string} password */
  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      handleDemoFallback(error, email);
    }
  };

  /** @param {string} email @param {string} password */
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      handleDemoFallback(error, email);
    }
  };

  /**
   * Initiates a Google Sign-In popup flow using Firebase Auth.
   * Prompts the user to select their Google account.
   */
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      // In demo mode, simulate a successful Google login
      handleDemoFallback(error, 'google-user@gmail.com');
    }
  };

  const logout = () => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /** @type {AuthContextValue} */
  const value = { currentUser, loading, login, signup, loginWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
