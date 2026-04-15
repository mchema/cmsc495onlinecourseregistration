import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '../pages/LoginPage.jsx';
import StudentDashboard from '../pages/StudentDashboard.jsx';
import CourseCatalog from '../pages/CourseCatalog.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ProtectedRoute from '../components/layout/shared/ProtectedRoute.jsx';
import ChangePasswordPage from '../pages/ChangePasswordPage.jsx';

// Add this later when ready
// import ChangePasswordPage from '../pages/ChangePasswordPage.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Add this route when you create the change password page */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Student-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/catalog" element={<CourseCatalog />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Default/fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}




/* v.1 
-it only checks user
-it does not wait for auth/session restoration
-it does not handle firstLogin
-it compares roles as lowercase strings like "student" and "admin"

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

import LoginPage from '../pages/LoginPage.jsx';
import StudentDashboard from '../pages/StudentDashboard.jsx';
import CourseCatalog from '../pages/CourseCatalog.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public }
        <Route path="/login" element={<LoginPage />} />

        {/* Student routes 
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute role="student">
              <CourseCatalog />
            </ProtectedRoute>
          }
        />

        {/* Admin routes 
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback 
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
*/