/*
v.1 
this : 
-waits for session restoration to finish
-blocks unauthenticated access
-forces first-login users to /change-password
-enforces role-based access
*/


import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading, firstLogin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (firstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!firstLogin && location.pathname === '/change-password') {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
}