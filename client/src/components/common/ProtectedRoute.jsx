import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { showError, showSuccess } from './Toast';

/**
 * Protected Route Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * Optionally checks for specific roles
 */
const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/login' }) => {
  const location = useLocation();
  const { isAuthenticated, userRole, user, token } = useAuthStore();
  const { isLoading, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Handle Resend Verification Email
  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      await apiClient.post(ENDPOINTS.AUTH.SCHOOL_RESEND_VERIFICATION);
      showSuccess('Verification email sent! Please check your inbox.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification email.';
      showError(message);
    } finally {
      setIsResending(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    // Redirect to login, saving the attempted location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check for required role if specified
  if (requiredRole) {
    // Handle array of roles
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        // User doesn't have required role, redirect to unauthorized
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      // Handle single role
      if (userRole !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Check if school email is verified (if applicable)
  if (userRole === 'school' && user && !user.is_verified) {
    // Allow access to profile/settings but redirect from other pages
    const allowedPaths = ['/school/profile', '/school/settings'];
    if (!allowedPaths.some(path => location.pathname.startsWith(path))) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Email Verification Required
                </h2>
                <p className="text-gray-600 mb-4">
                  Please verify your email address to access this page. Check your inbox for the
                  verification link.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary w-full"
                  >
                    I've Verified My Email
                  </button>
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="btn-outline w-full text-primary-600 border-primary-600 hover:bg-primary-50"
                  >
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  <button
                    onClick={logout}
                    className="btn-secondary w-full"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and authorized, render the protected content
  return children;
};

/**
 * School-only Protected Route
 */
export const SchoolRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="school" redirectTo="/school/login">
      {children}
    </ProtectedRoute>
  );
};

/**
 * Admin-only Protected Route
 */
export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute
      requiredRole={['admin', 'super_admin', 'moderator']}
      redirectTo="/admin/login"
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Super Admin-only Protected Route
 */
export const SuperAdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="super_admin" redirectTo="/admin/login">
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
