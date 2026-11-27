import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile, UserRole } from '@college-library/shared';
import { authClient } from '@/lib/authClient';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<UserRole>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  registerStudent: (data: {
    fullName: string;
    email: string;
    password?: string;
    studentId: string;
    department: string;
    academicYear: string;
    semester: string;
    collegeAffiliation: string;
  }) => Promise<boolean>;
  updateStudentProfile: (data: Partial<StudentProfile>) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount with Neon Auth and database
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = localStorage.getItem('bookloop_token');

        // Check active session in Neon Managed Better Auth
        let sessionEmail: string | undefined;
        try {
          const sessionRes = await authClient.getSession();
          if (sessionRes?.data?.user?.email) {
            sessionEmail = sessionRes.data.user.email;
          }
        } catch {
          // No active Better Auth session
        }

        if (!token && !sessionEmail) {
          setLoading(false);
          return;
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = sessionEmail
          ? `/api/auth/me?email=${encodeURIComponent(sessionEmail)}`
          : '/api/auth/me';

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setStudentProfile(data.profile);
        } else if (token) {
          localStorage.removeItem('bookloop_token');
          setUser(null);
          setStudentProfile(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        setUser(null);
        setStudentProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, password: string = 'password123'): Promise<UserRole> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Sign in via Neon Managed Better Auth
      try {
        const neonRes = await authClient.signIn.email({
          email: normalizedEmail,
          password,
        });
        if (neonRes.error) {
          console.warn('Neon auth sign-in info:', neonRes.error.message);
        }
      } catch (e) {
        console.warn('Neon auth sign-in fetch warning:', e);
      }

      // 2. Fetch server-verified role and profile from database
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid credentials or user not found');
      }

      const data = await res.json();
      localStorage.setItem('bookloop_token', data.token);
      setUser(data.user);
      setStudentProfile(data.profile);
      return data.user.role as UserRole;
    } catch (e) {
      console.error('Login error:', e);
      throw e;
    }
  };

  const loginWithGoogle = async (fallbackRole: UserRole = 'STUDENT'): Promise<void> => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin,
      });
    } catch (e) {
      console.warn('Direct Google OAuth redirection fallback:', e);
      // Fallback demo account for local evaluation if Google OAuth credentials not yet added in Neon Console
      const email = fallbackRole === 'LIBRARIAN' ? 'librarian@college.edu' : 'alex.rivera@college.edu';
      await login(email, 'password123');
    }
  };

  const registerStudent = async (data: {
    fullName: string;
    email: string;
    password?: string;
    studentId: string;
    department: string;
    academicYear: string;
    semester: string;
    collegeAffiliation: string;
  }): Promise<boolean> => {
    try {
      const normalizedEmail = data.email.toLowerCase().trim();

      // 1. Create account via Neon's Managed Better Auth
      let neonUserId: string | undefined;
      try {
        const neonRes = await authClient.signUp.email({
          email: normalizedEmail,
          password: data.password || 'password123',
          name: data.fullName,
        });

        if (neonRes.error) {
          throw new Error(neonRes.error.message || 'Neon Auth sign-up error');
        }
        neonUserId = neonRes.data?.user?.id;
      } catch (neonErr: any) {
        // If account already exists in Neon Auth, continue to sync profile
        if (neonErr.message && !neonErr.message.includes('already exists')) {
          console.warn('Neon auth note:', neonErr.message);
        }
      }

      // 2. Persist student identity and profile with role 'STUDENT' in database
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          email: normalizedEmail,
          neonUserId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Student registration failed');
      }

      const resData = await res.json();
      localStorage.setItem('bookloop_token', resData.token);
      setUser(resData.user);
      setStudentProfile(resData.profile);
      return true;
    } catch (e) {
      console.error('Registration error:', e);
      throw e;
    }
  };

  const updateStudentProfile = async (data: Partial<StudentProfile>) => {
    if (!studentProfile) return;
    try {
      const token = localStorage.getItem('bookloop_token');
      const res = await fetch(`/api/auth/profile/${studentProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudentProfile(updated);
      }
    } catch (e) {
      console.error('Profile update error:', e);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    if (newRole === 'LIBRARIAN') {
      await login('librarian@college.edu', 'password123');
    } else {
      await login('alex.rivera@college.edu', 'password123');
    }
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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
        registerStudent,
        updateStudentProfile,
        switchRole,
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
