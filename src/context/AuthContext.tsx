import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { request } from '../lib/api';
import { supabase } from '../lib/supabase';

export type UserRole = 'customer' | 'organizer' | 'admin';

interface Profile {
  id:            string;
  username:      string;
  email:         string;
  name:          string;
  role:          UserRole;
  avatar_url:    string | null;
  phone:         string | null;
  is_verified:   boolean;
  is_suspended:  boolean;
  business_name: string | null;
}

interface AuthContextType {
  user:            Profile | null;
  loading:         boolean;
  isAuthModalOpen: boolean;
  authMode:        'signin' | 'signup';
  defaultRole:     'customer' | 'organizer';
  hideRegisterTab: boolean;
  openAuthModal:   (mode?: 'signin' | 'signup', role?: 'customer' | 'organizer', hideReg?: boolean) => void;
  closeAuthModal:  () => void;
  setAuthMode:     (mode: 'signin' | 'signup') => void;
  signIn:          (username: string, password: string, code?: string) => Promise<any>;
  adminSignIn:     (email: string, password: string) => Promise<any>;
  signUp:          (username: string, email: string, password: string, name: string, role?: UserRole, businessName?: string, phone?: string) => Promise<any>;
  signOut:         () => Promise<void>;
  updateProfile:   (name: string, email: string, phone?: string, businessName?: string) => Promise<void>;
  updatePassword:  (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword:   (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user,            setUser]            = useState<Profile | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode,        setAuthMode]        = useState<'signin' | 'signup'>('signin');
  const [defaultRole,     setDefaultRole]     = useState<'customer' | 'organizer'>('customer');
  const [hideRegisterTab, setHideRegisterTab] = useState(false);

  // Load profile from Express backend on startup
  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await request('/auth/me');
      setUser({
        id:            data.id,
        username:      data.username,
        email:         data.email,
        name:          data.full_name,
        role:          data.role,
        avatar_url:    data.avatar_url,
        phone:         data.phone,
        is_verified:   data.is_verified,
        is_suspended:  data.is_suspended,
        business_name: data.business_name || null,
      });
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Sign out admin when navigating away from /admin/*
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const wasAdmin = prevPath.current.startsWith('/admin');
    const isAdmin = location.pathname.startsWith('/admin');
    prevPath.current = location.pathname;
    if (wasAdmin && !isAdmin) {
      signOut();
    }
  }, [location.pathname]);

  const openAuthModal  = (mode: 'signin' | 'signup' = 'signin', role: 'customer' | 'organizer' = 'customer', hideReg?: boolean) => { 
    setAuthMode(mode); 
    setDefaultRole(role); 
    setHideRegisterTab(hideReg ?? false);
    setIsAuthModalOpen(true); 
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signIn = async (username: string, password: string, code?: string) => {
    const data = await request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password, code })
    });
    localStorage.setItem('token', data.token);
    setUser({
      id:            data.user.id,
      username:      data.user.username,
      email:         data.user.email,
      name:          data.user.full_name,
      role:          data.user.role,
      avatar_url:    data.user.avatar_url,
      phone:         data.user.phone,
      is_verified:   data.user.is_verified,
      is_suspended:  data.user.is_suspended,
      business_name: data.user.business_name || null,
    });
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    if (redirect) { sessionStorage.removeItem('redirectAfterLogin'); navigate(redirect, { replace: true }); }
    return data.user;
  };

  const adminSignIn = async (email: string, password: string) => {
    const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
    if (sbError) throw new Error(sbError.message || 'Invalid email or password');
    if (!sbData.session?.access_token) throw new Error('No session token received');

    const data = await request('/auth/admin-signin', {
      method: 'POST',
      body: JSON.stringify({ accessToken: sbData.session.access_token })
    });
    localStorage.setItem('token', data.token);
    setUser({
      id:            data.user.id,
      username:      data.user.username,
      email:         data.user.email,
      name:          data.user.full_name,
      role:          data.user.role,
      avatar_url:    data.user.avatar_url,
      phone:         data.user.phone,
      is_verified:   data.user.is_verified,
      is_suspended:  data.user.is_suspended,
      business_name: data.user.business_name || null,
    });
    return data.user;
  };

  const signUp = async (username: string, email: string, password: string, name: string, role: UserRole = 'customer', businessName?: string, phone?: string) => {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, full_name: name, role, business_name: businessName, phone })
    });
    if (role === 'organizer') {
      // Organizers require admin approval and should not be automatically logged in
      return data;
    }
    localStorage.setItem('token', data.token);
    setUser({
      id:            data.user.id,
      username:      data.user.username,
      email:         data.user.email,
      name:          data.user.full_name,
      role:          data.user.role,
      avatar_url:    data.user.avatar_url,
      phone:         data.user.phone,
      is_verified:   data.user.is_verified,
      is_suspended:  data.user.is_suspended,
      business_name: data.user.business_name || null,
    });
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    if (redirect) { sessionStorage.removeItem('redirectAfterLogin'); navigate(redirect, { replace: true }); }
    return data.user;
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (name: string, email: string, phone?: string, businessName?: string) => {
    if (!user) throw new Error('Not authenticated');
    const data = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: name, email, phone, business_name: businessName })
    });
    setUser(prev => prev ? {
      ...prev,
      name: data.full_name,
      email: data.email,
      phone: data.phone,
      business_name: data.business_name || null
    } : prev);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not authenticated');
    await request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  };

  const resetPassword = async (email: string) => {
    await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAuthModalOpen, authMode, defaultRole, hideRegisterTab,
      openAuthModal, closeAuthModal, setAuthMode,
      signIn, adminSignIn, signUp, signOut, updateProfile, updatePassword, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
