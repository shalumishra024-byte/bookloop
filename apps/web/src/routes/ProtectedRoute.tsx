import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@college-library/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-2 text-center">
          <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-muted-foreground">Connecting to library system...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If student attempts to access librarian page, redirect to student dashboard
    if (role === 'STUDENT') {
      return <Navigate to="/student" replace />;
    }
    // If librarian attempts to access student page, redirect to librarian dashboard
    return <Navigate to="/librarian" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};
