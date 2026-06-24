import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Notification, UserDocument, Application, UserProfile } from '../types.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  notifications: Notification[];
  documents: UserDocument[];
  applications: Application[];
  isLoading: boolean;
  signup: (fullName: string, email: string, phoneNumber: string, password: string) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
  updateProfile: (profile: UserProfile) => Promise<any>;
  refreshUser: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  uploadDocument: (documentType: string, file: File) => Promise<any>;
  markNotificationRead: (id: string) => Promise<void>;
  toggleBookmark: (schemeId: string) => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from LocalStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('bharat_token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // Token expired or invalid
            localStorage.removeItem('bharat_token');
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  // Sync state data whenever user updates or logs in
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      fetchDocuments();
      fetchApplications();
    } else {
      setNotifications([]);
      setDocuments([]);
      setApplications([]);
    }
  }, [user, token]);

  const signup = async (fullName: string, email: string, phoneNumber: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phoneNumber, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed");
    
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('bharat_token', data.token);
    return data;
  };

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || "Login failed");
      (err as any).requiresVerification = data.requiresVerification;
      (err as any).email = data.email;
      throw err;
    }

    setToken(data.token);
    setUser(data.user);
    if (rememberMe) {
      localStorage.setItem('bharat_token', data.token);
    } else {
      sessionStorage.setItem('bharat_token', data.token);
      localStorage.setItem('bharat_token', data.token); // For persistence safety
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bharat_token');
    sessionStorage.removeItem('bharat_token');
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Action failed");
    return data;
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Action failed");
    return data;
  };

  const updateProfile = async (profile: UserProfile) => {
    if (!token) throw new Error("No active credentials");
    const res = await fetch('/api/profile/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save profile");
    setUser(data.user);
    return data;
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to refresh session context", err);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to retrieve system alerts", err);
    }
  };

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to retrieve documents index", err);
    }
  };

  const fetchApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Failed to retrieve applications tracking", err);
    }
  };

  const uploadDocument = async (documentType: string, file: File) => {
    if (!token) throw new Error("No active credentials");
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Document verification failed");
    
    await fetchDocuments();
    await fetchNotifications();
    return data.document;
  };

  const markNotificationRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error("Failed to update alert state", err);
    }
  };

  const toggleBookmark = async (schemeId: string): Promise<string[]> => {
    if (!token || !user) throw new Error("Authentication required");
    const res = await fetch(`/api/schemes/${schemeId}/bookmark`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to bookmark");
    
    setUser(prev => prev ? { ...prev, savedSchemes: data.savedSchemes } : null);
    return data.savedSchemes;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      notifications,
      documents,
      applications,
      isLoading,
      signup,
      verifyOtp,
      login,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshUser,
      fetchNotifications,
      fetchDocuments,
      fetchApplications,
      uploadDocument,
      markNotificationRead,
      toggleBookmark
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be called inside AuthProvider");
  return context;
}
