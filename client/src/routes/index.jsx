import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from '../components/common/PublicRoute';
import { SchoolRoute, AdminRoute } from '../components/common/ProtectedRoute';

/**
 * Main Router Configuration
 * Defines all application routes
 *
 * Note: Actual page components will be created in Phase 4 & 5
 * For now, we'll use placeholder components
 */

// Placeholder components (will be replaced with actual pages)
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
    <div className="card max-w-2xl w-full text-center">
      <img src="/assets/images/gema-logo.png" alt="GEMA Events" className="h-20 w-auto mx-auto mb-4" />
      <p className="text-xl text-gray-600 mb-8">Bulk Registration System</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/school/login" className="btn-primary">
          School Login
        </a>
        <a href="/admin/login" className="btn-secondary">
          Admin Login
        </a>
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="card max-w-md w-full text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Page not found</p>
      <a href="/" className="btn-primary">
        Go Home
      </a>
    </div>
  </div>
);


const ComingSoon = ({ title = 'Coming Soon' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="card max-w-md w-full text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-6">This page is under construction</p>
      <p className="text-sm text-gray-500">Phase 4 & 5 will implement all pages</p>
    </div>
  </div>
);

// School Auth Pages
import SchoolLogin from '../pages/school/auth/Login';
import SchoolRegister from '../pages/school/auth/Register';
import SchoolForgotPassword from '../pages/school/auth/ForgotPassword';
import SchoolResetPassword from '../pages/school/auth/ResetPassword';
import SchoolVerifyEmail from '../pages/school/auth/VerifyEmail';

// Admin Auth Pages
import AdminLogin from '../pages/admin/auth/Login';

// School Portal Pages
import SchoolDashboard from '../pages/school/dashboard/Dashboard';
import SchoolEvents from '../pages/school/events/EventsList';
import EventDetails from '../pages/school/events/EventDetails';
import MyBatches from '../pages/school/batches/MyBatches';
import BatchDetails from '../pages/school/batches/BatchDetails';
import UploadBatch from '../pages/school/batches/UploadBatch';

// Payment Pages
import MakePayment from '../pages/school/payments/MakePayment';
import PaymentHistory from '../pages/school/payments/PaymentHistory';
import PaymentDetails from '../pages/school/payments/PaymentDetails';
import PaymentSuccess from '../pages/school/payments/PaymentSuccess';
import PaymentFailure from '../pages/school/payments/PaymentFailure';

// Invoice Pages
import InvoicesList from '../pages/school/invoices/InvoicesList';

// Profile Pages
import ViewProfile from '../pages/school/profile/ViewProfile';
import EditProfile from '../pages/school/profile/EditProfile';
import ChangePassword from '../pages/school/profile/ChangePassword';

// Admin Portal Pages
import AdminDashboard from '../pages/admin/dashboard/Dashboard';
import SchoolsList from '../pages/admin/schools/SchoolsList';
import SchoolDetails from '../pages/admin/schools/SchoolDetails';
import SchoolEdit from '../pages/admin/schools/SchoolEdit';
import PaymentsList from '../pages/admin/payments/PaymentsList';
import PendingVerifications from '../pages/admin/payments/PendingVerifications';
import AdminPaymentDetails from '../pages/admin/payments/PaymentDetails';
import EventsList from '../pages/admin/events/EventsList';
import AdminEventDetails from '../pages/admin/events/EventDetails';
import AdminBatchDetails from '../pages/admin/events/BatchDetails';
import AdminStudentDetails from '../pages/admin/registrations/StudentDetails';
import CreateEvent from '../pages/admin/events/CreateEvent';
import EditEvent from '../pages/admin/events/EditEvent';
import EventAnalytics from '../pages/admin/events/EventAnalytics';
import ChatbotAnalytics from '../pages/admin/chatbot/ChatbotAnalytics';
import GlobalAnalytics from '../pages/admin/analytics/GlobalAnalytics';
import Settings from '../pages/admin/settings/Settings';
import BrandSettings from '../pages/admin/settings/BrandSettings';
import MediaLibrary from '../pages/admin/media/MediaLibrary';
import AdminProfile from '../pages/admin/profile/ViewProfile';
import AdminEditProfile from '../pages/admin/profile/EditProfile';
import AdminChangePassword from '../pages/admin/profile/ChangePassword';

// Public Pages
import EventPublic from '../pages/public/EventPublic';
import ResultLookup from '../pages/public/ResultLookup';

// Result Pages
import ResultUpload from '../pages/admin/results/ResultUpload';
import EventResults from '../pages/admin/results/EventResults';
import MyResults from '../pages/school/results/MyResults';

// Certificate Pages
import CertificatesList from '../pages/school/certificates/CertificatesList';
import CertificateManagement from '../pages/admin/certificates/CertificateManagement';
import CertificateVerify from '../pages/public/CertificateVerify';

// Error Pages
import Unauthorized from '../pages/Unauthorized';

/**
 * Router Component
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* ========================================
          PUBLIC EVENT PAGES (No Auth Required)
      ======================================== */}
      <Route path="/events/:slug" element={<EventPublic />} />
      <Route path="/results" element={<ResultLookup />} />
      <Route path="/results/:registrationId" element={<ResultLookup />} />
      <Route path="/verify" element={<CertificateVerify />} />
      <Route path="/verify/:certificateId" element={<CertificateVerify />} />

      {/* ========================================
          SCHOOL AUTH ROUTES (Public)
      ======================================== */}
      <Route
        path="/school/login"
        element={
          <PublicRoute>
            <SchoolLogin />
          </PublicRoute>
        }
      />
      <Route
        path="/school/register"
        element={
          <PublicRoute>
            <SchoolRegister />
          </PublicRoute>
        }
      />
      <Route path="/school/forgot-password" element={<SchoolForgotPassword />} />
      <Route path="/school/reset-password" element={<SchoolResetPassword />} />
      <Route path="/school/verify-email" element={<SchoolVerifyEmail />} />
      <Route path="/verify-email" element={<SchoolVerifyEmail />} />
      <Route path="/reset-password" element={<SchoolResetPassword />} />

      {/* ========================================
          SCHOOL PORTAL ROUTES (Protected)
      ======================================== */}
      <Route
        path="/school/dashboard"
        element={
          <SchoolRoute>
            <SchoolDashboard />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/events"
        element={
          <SchoolRoute>
            <SchoolEvents />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/events/:slug"
        element={
          <SchoolRoute>
            <EventDetails />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/batches"
        element={
          <SchoolRoute>
            <MyBatches />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/batches/upload/:slug"
        element={
          <SchoolRoute>
            <UploadBatch />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/batches/:batchReference"
        element={
          <SchoolRoute>
            <BatchDetails />
          </SchoolRoute>
        }
      />

      {/* Payment Routes */}
      <Route
        path="/school/payments"
        element={
          <SchoolRoute>
            <PaymentHistory />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/payments/make-payment"
        element={
          <SchoolRoute>
            <MakePayment />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/payments/:paymentId"
        element={
          <SchoolRoute>
            <PaymentDetails />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/payments/success"
        element={
          <SchoolRoute>
            <PaymentSuccess />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/payments/failure"
        element={
          <SchoolRoute>
            <PaymentFailure />
          </SchoolRoute>
        }
      />

      {/* Invoice Routes */}
      <Route
        path="/school/invoices"
        element={
          <SchoolRoute>
            <InvoicesList />
          </SchoolRoute>
        }
      />

      {/* Results Routes */}
      <Route
        path="/school/results"
        element={
          <SchoolRoute>
            <MyResults />
          </SchoolRoute>
        }
      />

      {/* Certificates Routes */}
      <Route
        path="/school/certificates"
        element={
          <SchoolRoute>
            <CertificatesList />
          </SchoolRoute>
        }
      />

      {/* Profile Routes */}
      <Route
        path="/school/profile"
        element={
          <SchoolRoute>
            <ViewProfile />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/profile/edit"
        element={
          <SchoolRoute>
            <EditProfile />
          </SchoolRoute>
        }
      />
      <Route
        path="/school/profile/change-password"
        element={
          <SchoolRoute>
            <ChangePassword />
          </SchoolRoute>
        }
      />

      {/* ========================================
          ADMIN AUTH ROUTES (Public)
      ======================================== */}
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        }
      />

      {/* ========================================
          ADMIN PORTAL ROUTES (Protected)
      ======================================== */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Schools Management */}
      <Route
        path="/admin/schools"
        element={
          <AdminRoute>
            <SchoolsList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/schools/:schoolId"
        element={
          <AdminRoute>
            <SchoolDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/schools/:schoolId/edit"
        element={
          <AdminRoute>
            <SchoolEdit />
          </AdminRoute>
        }
      />

      {/* Events Management */}
      <Route
        path="/admin/events"
        element={
          <AdminRoute>
            <EventsList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/create"
        element={
          <AdminRoute>
            <CreateEvent />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId"
        element={
          <AdminRoute>
            <AdminEventDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/batches/:batchReference"
        element={
          <AdminRoute>
            <AdminBatchDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/registrations/:registrationId"
        element={
          <AdminRoute>
            <AdminStudentDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/edit"
        element={
          <AdminRoute>
            <EditEvent />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/analytics"
        element={
          <AdminRoute>
            <EventAnalytics />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/analytics"
        element={
          <AdminRoute>
            <EventAnalytics />
          </AdminRoute>
        }
      />

      {/* Payments Management */}
      <Route
        path="/admin/payments"
        element={
          <AdminRoute>
            <PaymentsList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payments/pending"
        element={
          <AdminRoute>
            <PendingVerifications />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payments/:paymentId"
        element={
          <AdminRoute>
            <AdminPaymentDetails />
          </AdminRoute>
        }
      />

      {/* Media Library */}
      <Route
        path="/admin/media"
        element={
          <AdminRoute>
            <MediaLibrary />
          </AdminRoute>
        }
      />

      {/* Analytics */}
      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <GlobalAnalytics />
          </AdminRoute>
        }
      />

      {/* Results Management */}
      <Route
        path="/admin/events/:eventId/results"
        element={
          <AdminRoute>
            <EventResults />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/results/upload"
        element={
          <AdminRoute>
            <ResultUpload />
          </AdminRoute>
        }
      />

      {/* Certificate Management */}
      <Route
        path="/admin/batches/:batchId/certificates"
        element={
          <AdminRoute>
            <CertificateManagement />
          </AdminRoute>
        }
      />

      {/* Chatbot Analytics */}
      <Route
        path="/admin/chatbot/analytics"
        element={
          <AdminRoute>
            <ChatbotAnalytics />
          </AdminRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        }
      />

      {/* Brand Settings */}
      <Route
        path="/admin/settings/brand"
        element={
          <AdminRoute>
            <BrandSettings />
          </AdminRoute>
        }
      />

      {/* Admin Profile */}
      <Route
        path="/admin/settings/profile"
        element={
          <AdminRoute>
            <AdminProfile />
          </AdminRoute>
        }
      />

      {/* Admin Edit Profile */}
      <Route
        path="/admin/settings/profile/edit"
        element={
          <AdminRoute>
            <AdminEditProfile />
          </AdminRoute>
        }
      />

      {/* Admin Change Password */}
      <Route
        path="/admin/settings/change-password"
        element={
          <AdminRoute>
            <AdminChangePassword />
          </AdminRoute>
        }
      />

      {/* ========================================
          ERROR ROUTES
      ======================================== */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
