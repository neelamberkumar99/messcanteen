import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Can optionally check for specific roles
 */
const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Still loading auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (requiredRoles && user?.role) {
    const hasRole = requiredRoles.includes(user.role.toLowerCase());
    if (!hasRole) {
      // Redirect to their own dashboard instead of a loop
      const roleRouteMap = {
        'student': '/student/dashboard',
        'vendor': '/vendor/dashboard',
        'contractor': '/vendor/dashboard',
        'admin': '/admin/dashboard',
        'superadmin': '/superadmin/dashboard',
      };
      const fallback = roleRouteMap[user.role.toLowerCase()] || '/login';
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
