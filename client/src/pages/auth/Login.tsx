import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BookOpen, ShieldCheck, GraduationCap, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Login returns verified role from Neon Auth + database
      const verifiedRole = await login(email, password);
      if (verifiedRole === 'LIBRARIAN') {
        navigate('/librarian');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'STUDENT' | 'LIBRARIAN') => {
    setLoading(true);
    setError('');
    try {
      const emailToUse = role === 'LIBRARIAN' ? 'librarian@college.edu' : 'alex.rivera@college.edu';
      const verifiedRole = await login(emailToUse, 'password123');
      if (verifiedRole === 'LIBRARIAN') {
        navigate('/librarian');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-foreground text-background items-center justify-center font-bold mb-2 shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BookLoop</h1>
          <p className="text-sm text-muted-foreground">College Library Management & Book Exchange</p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your college credentials or select a one-click role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                  <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Password</label>
                  <span className="text-[11px] text-muted-foreground">Default: password123</span>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In with Email'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full text-xs font-medium"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google OAuth
            </Button>

            {/* Quick Fast Logins */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Fast Role Logins
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs flex items-center justify-center space-x-1"
                  onClick={() => handleDemoLogin('STUDENT')}
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1" />
                  <span>Student Demo</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs flex items-center justify-center space-x-1"
                  onClick={() => handleDemoLogin('LIBRARIAN')}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  <span>Librarian Demo</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-foreground underline underline-offset-4">
                Register as a Student
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
