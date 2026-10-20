// Auth Context — manages global auth state across the whole app
// Wraps Firebase auth: login, signup, guest, logout

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  // ── Sign Up ──────────────────────────────────────────────
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name on the Firebase user profile
      await updateProfile(result.user, { displayName });
      return { success: true, user: result.user };
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── Login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── Guest / Anonymous Login ───────────────────────────────
  const continueAsGuest = async () => {
    try {
      setError(null);
      const result = await signInAnonymously(auth);
      return { success: true, user: result.user };
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Friendly error messages ───────────────────────────────
  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':   return 'This email is already registered.';
      case 'auth/invalid-email':          return 'Please enter a valid email address.';
      case 'auth/weak-password':          return 'Password must be at least 6 characters.';
      case 'auth/user-not-found':         return 'No account found with this email.';
      case 'auth/wrong-password':         return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':      return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed': return 'Network error. Please check your connection.';
      default:                            return 'Something went wrong. Please try again.';
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    continueAsGuest,
    logout,
    isGuest: user?.isAnonymous ?? false,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
