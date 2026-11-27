import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile, LibrarianProfile, UserRole } from '@college-library/shared';
import { authClient } from '@/lib/authClient';
import { API_BASE_URL } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  librarianProfile: LibrarianProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  loginWithGoogle: () => Promise<void>;
  registerStudent: (data: {
    fullName: string;
    email: string;
    password: string;
    studentId: string;
    department: string;
    academicYear: string;
    semester: string;
    collegeAffiliation: string;
  }) => Promise<boolean>;
  updateStudentProfile: (data: Partial<StudentProfile>) => Promise<void>;
  updateLibrarianProfile: (data: Partial<LibrarianProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [librarianProfile, setLibrarianProfile] = useState<LibrarianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount strictly against server-verified database role
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = localStorage.getItem('bookloop_token');

        if (token) {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setStudentProfile(data.profile || null);
            setLibrarianProfile(data.librarianProfile || null);
            setLoading(false);
            return;
          }
          localStorage.removeItem('bookloop_token');
        }

        // Check if returning from Neon Auth OAuth (e.g. Google Sign-In)
        try {
          const sessionRes = await authClient.getSession();
          const neonToken = sessionRes?.data?.session?.token;
          if (neonToken) {
            const syncRes = await fetch(`${API_BASE_URL}/auth/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ neonToken }),
            });
            if (syncRes.ok) {
              const data = await syncRes.json();
              localStorage.setItem('bookloop_token', data.token);
              setUser(data.user);
              setStudentProfile(data.profile || null);
              setLibrarianProfile(data.librarianProfile || null);
            }
          }
        } catch {
          // No active Neon Auth session
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        setUser(null);
        setStudentProfile(null);
        setLibrarianProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    const normalizedEmail = email.toLowerCase().trim();
    let neonToken: string | undefined;

    // 1. Authenticate via Neon Managed Better Auth
    try {
      const neonRes = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });
      if (!neonRes.error && neonRes.data?.token) {
        neonToken = neonRes.data.token;
      }
    } catch (e) {
      console.warn('Neon auth sign-in check:', e);
    }

    // 2. Verify credentials and fetch authoritative role from database
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password, neonToken }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials or account not found');
    }

    const data = await res.json();
    localStorage.setItem('bookloop_token', data.token);
    setUser(data.user);
    setStudentProfile(data.profile || null);
    setLibrarianProfile(data.librarianProfile || null);
    return data.user.role as UserRole;
  };

  const loginWithGoogle = async (): Promise<void> => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin,
    });
  };

  const registerStudent = async (data: {
    fullName: string;
    email: string;
    password: string;
    studentId: string;
    department: string;
    academicYear: string;
    semester: string;
    collegeAffiliation: string;
  }): Promise<boolean> => {
    const normalizedEmail = data.email.toLowerCase().trim();

    // 1. Create account via Neon's Managed Better Auth
    let neonUserId: string | undefined;
    try {
      const neonRes = await authClient.signUp.email({
        email: normalizedEmail,
        password: data.password,
        name: data.fullName,
      });

      if (neonRes.error) {
        throw new Error(neonRes.error.message || 'Neon Auth sign-up error');
      }
      neonUserId = neonRes.data?.user?.id;
    } catch (neonErr: any) {
      if (neonErr.message && !neonErr.message.includes('already exists')) {
        console.warn('Neon auth note:', neonErr.message);
      }
    }

    // 2. Persist student identity and profile with server-enforced STUDENT role
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        email: normalizedEmail,
        neonUserId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Student registration failed');
    }

    const resData = await res.json();
    localStorage.setItem('bookloop_token', resData.token);
    setUser(resData.user);
    setStudentProfile(resData.profile || null);
    setLibrarianProfile(null);
    return true;
  };

  const updateStudentProfile = async (data: Partial<StudentProfile>) => {
    if (!studentProfile) return;
    const token = localStorage.getItem('bookloop_token');
    const res = await fetch(`${API_BASE_URL}/auth/profile/${studentProfile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    const updated = await res.json();
    setStudentProfile(updated);
  };

  const updateLibrarianProfile = async (data: Partial<LibrarianProfile>) => {
    const token = localStorage.getItem('bookloop_token');
    const res = await fetch(`${API_BASE_URL}/auth/librarian-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update librarian profile');
    }
    const updated = await res.json();
    setLibrarianProfile(updated);
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      localStorage.removeItem('bookloop_token');
      setUser(null);
      setStudentProfile(null);
      setLibrarianProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        librarianProfile,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
        registerStudent,
        updateStudentProfile,
        updateLibrarianProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
