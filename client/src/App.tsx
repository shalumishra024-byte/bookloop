import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { BookCatalog } from './pages/student/BookCatalog';
import { BookDetails } from './pages/student/BookDetails';
import { StudentBorrowings } from './pages/student/StudentBorrowings';
import { StudentQueue } from './pages/student/StudentQueue';
import { StudentDonations } from './pages/student/StudentDonations';

// Librarian Pages
import { LibrarianDashboard } from './pages/librarian/LibrarianDashboard';
import { LibrarianBorrowings } from './pages/librarian/LibrarianBorrowings';
import { LibrarianReturns } from './pages/librarian/LibrarianReturns';
import { LibrarianBooks } from './pages/librarian/LibrarianBooks';
import { LibrarianStudents } from './pages/librarian/LibrarianStudents';
import { LibrarianQueue } from './pages/librarian/LibrarianQueue';
import { LibrarianDonations } from './pages/librarian/LibrarianDonations';

// Shared Pages
import { ProfileSettings } from './pages/shared/ProfileSettings';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-2 text-center">
          <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'LIBRARIAN' ? '/librarian' : '/student'} replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/borrowings" element={<StudentBorrowings />} />
              <Route path="/student/queue" element={<StudentQueue />} />
              <Route path="/student/donations" element={<StudentDonations />} />
            </Route>

            {/* Common Student/Librarian Accessible Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'LIBRARIAN']} />}>
              <Route path="/catalog" element={<BookCatalog />} />
              <Route path="/catalog/:id" element={<BookDetails />} />
              <Route path="/profile" element={<ProfileSettings />} />
            </Route>

            {/* Protected Librarian Routes */}
            <Route element={<ProtectedRoute allowedRoles={['LIBRARIAN']} />}>
              <Route path="/librarian" element={<LibrarianDashboard />} />
              <Route path="/librarian/requests" element={<LibrarianBorrowings />} />
              <Route path="/librarian/returns" element={<LibrarianReturns />} />
              <Route path="/librarian/books" element={<LibrarianBooks />} />
              <Route path="/librarian/students" element={<LibrarianStudents />} />
              <Route path="/librarian/queue" element={<LibrarianQueue />} />
              <Route path="/librarian/donations" element={<LibrarianDonations />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
