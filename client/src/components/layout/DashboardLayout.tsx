import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  LayoutDashboard,
  Library,
  GitPullRequest,
  HeartHandshake,
  Users,
  Clock,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, studentProfile, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLibrarian = role === 'LIBRARIAN';

  const studentNavItems = [
    { label: 'Overview', path: '/student', icon: LayoutDashboard },
    { label: 'Book Catalog', path: '/catalog', icon: Library },
    { label: 'My Borrowings', path: '/student/borrowings', icon: BookmarkCheck },
    { label: 'Waiting Queue', path: '/student/queue', icon: Clock },
    { label: 'Donate Books', path: '/student/donations', icon: HeartHandshake },
    { label: 'Account Profile', path: '/profile', icon: Settings },
  ];

  const librarianNavItems = [
    { label: 'Librarian Dashboard', path: '/librarian', icon: LayoutDashboard },
    { label: 'Manage Inventory', path: '/librarian/books', icon: Library },
    { label: 'Borrow Requests', path: '/librarian/requests', icon: GitPullRequest },
    { label: 'Issued Books', path: '/librarian/returns', icon: BookmarkCheck },
    { label: 'Queue Priority', path: '/librarian/queue', icon: Clock },
    { label: 'Donation Requests', path: '/librarian/donations', icon: HeartHandshake },
    { label: 'Registered Students', path: '/librarian/students', icon: Users },
    { label: 'Account Profile', path: '/profile', icon: Settings },
  ];

  const navItems = isLibrarian ? librarianNavItems : studentNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-2">
          <BrandLogo className="h-7 w-7 rounded-lg" />
          <span className="font-bold tracking-tight text-lg">BookLoop</span>
          <Badge variant={isLibrarian ? 'default' : 'secondary'} className="text-[10px] ml-1">
            {isLibrarian ? 'Librarian' : 'Student'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card flex flex-col justify-between
        transition-transform duration-200 md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 hidden md:flex'}
      `}>
        <div>
          {/* Logo & Branding */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <Link to={isLibrarian ? '/librarian' : '/student'} className="flex items-center space-x-2.5">
              <BrandLogo className="h-9 w-9 rounded-lg shadow-sm" />
              <div>
                <span className="font-bold text-base tracking-tight block">BookLoop</span>
                <span className="text-xs text-muted-foreground block -mt-1">College Library</span>
              </div>
            </Link>
            <Badge variant={isLibrarian ? 'default' : 'secondary'} className="text-[11px] font-mono">
              {isLibrarian ? 'Authority' : 'Student'}
            </Badge>
          </div>

          {/* User Quick Info */}
          <div className="p-4 mx-3 my-3 rounded-lg bg-muted/60 border border-border/60">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              {!isLibrarian && studentProfile && (
                <div className="text-right flex-shrink-0" title="Donation-based Impact Score">
                  <div className="flex items-center text-xs font-bold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500 fill-amber-500" />
                    <span>{studentProfile.impactScore} pts</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Impact</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links (Strictly derived from authenticated database role) */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-[#CE6F87] text-white font-semibold shadow-sm' 
                      : 'text-muted-foreground hover:bg-[#F8DBBD] hover:text-[#2D161D] active:bg-[#CE6F87] active:text-white'}
                  `}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Theme & Logout only - Switch View removed for security) */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-2 flex items-center space-x-1"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 mr-1" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 mr-1" />
                  <span>Dark</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Header bar */}
        <div className="hidden md:flex h-14 items-center justify-between px-6 border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-muted-foreground">
              {isLibrarian ? 'Library Administration Portal' : 'Student Library Portal'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {!isLibrarian && studentProfile && (
              <div className="flex items-center space-x-2 bg-muted px-3 py-1 rounded-full text-xs font-medium border border-border">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>Impact Score: <strong>{studentProfile.impactScore}</strong></span>
              </div>
            )}
            <Badge variant="outline" className="text-xs font-mono">
              {user?.role}
            </Badge>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
