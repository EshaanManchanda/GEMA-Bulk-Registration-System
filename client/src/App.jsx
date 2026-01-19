import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import queryClient from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';
import AppRouter from './routes';

/**
 * Main App Component
 * Sets up all providers and routing
 */
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            {/* Main Application Router */}
            <AppRouter />

            {/* Toast Notifications Container */}
            <ToastContainer />

            {/* React Query DevTools (only in development) */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
