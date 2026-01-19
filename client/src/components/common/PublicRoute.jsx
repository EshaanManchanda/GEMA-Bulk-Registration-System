import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

/**
 * Public Route Component
 * For routes that should only be accessible when NOT authenticated
 * (e.g., login, register pages)
 * Redirects authenticated users to their dashboard
 */
const PublicRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, userRole } = useAuthStore();

  if (isAuthenticated) {
    // Get the redirect path from location state, or default based on role
    const from = location.state?.from?.pathname;

    // If there's a saved location, go there
    if (from) {
      return <Navigate to={from} replace />;
    }

    // Otherwise, redirect to appropriate dashboard based on role
    if (userRole === 'school') {
      return <Navigate to="/school/dashboard" replace />;
    } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Fallback to home
    return <Navigate to="/" replace />;
  }

  // User is not authenticated, render the public content
  return children;
};

export default PublicRoute;
