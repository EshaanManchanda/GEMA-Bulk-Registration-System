const express = require('express');
const router = express.Router();
const { verifyToken, checkUserStatus } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const adminDashboardController = require('../controllers/admin/adminDashboard.controller');
const adminSchoolController = require('../controllers/admin/adminSchool.controller');
const adminEventController = require('../controllers/admin/adminEvent.controller');
const adminPaymentController = require('../controllers/admin/adminPayment.controller');
const adminMediaController = require('../controllers/admin/adminMedia.controller');
const paymentController = require('../controllers/payment/payment.controller');
const { uploadMediaLibrary } = require('../middleware/upload.middleware');

/**
 * Admin Routes
 * Base path: /api/v1/admin
 * All routes require admin authentication
 */

// Apply admin middleware to all routes
router.use(verifyToken, requireAdmin, checkUserStatus);

// ===============================================
// DASHBOARD ROUTES
// ===============================================

// Get dashboard statistics
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

// Get recent activities
router.get('/dashboard/activities', adminDashboardController.getRecentActivities);

// Get revenue analytics
router.get('/dashboard/revenue', adminDashboardController.getRevenueAnalytics);

// ===============================================
// SCHOOL MANAGEMENT ROUTES
// ===============================================

// Get all schools with filters and pagination
router.get('/schools', adminSchoolController.getAllSchools);

// Create school (Admin)
router.post('/schools', adminSchoolController.createSchool);

// Get school details
router.get('/schools/:schoolId', adminSchoolController.getSchoolDetails);

// Approve school
router.put('/schools/:schoolId/approve', adminSchoolController.approveSchool);

// Suspend school
router.put('/schools/:schoolId/suspend', adminSchoolController.suspendSchool);

// Activate suspended school
router.put('/schools/:schoolId/activate', adminSchoolController.activateSchool);

// Update school details
router.put('/schools/:schoolId', adminSchoolController.updateSchool);

// Get school's registration history
router.get('/schools/:schoolId/registrations', adminSchoolController.getSchoolRegistrations);

// Get school's payment history
router.get('/schools/:schoolId/payments', adminSchoolController.getSchoolPayments);

// ===============================================
// BATCH MANAGEMENT ROUTES
// ===============================================
const adminBatchController = require('../controllers/admin/adminBatch.controller');

// Get batch details
router.get('/batches/:batchReference', adminBatchController.getBatchDetails);
router.post('/batches/:batchReference/verify', adminBatchController.verifyBatchPayment);
router.post('/batches/:batchReference/reject', adminBatchController.rejectBatchPayment);
router.get('/batches/:batchReference/export', adminBatchController.exportBatchRegistrations);
router.delete('/batches/:batchReference', adminBatchController.deleteBatch);

// Get registration details
router.get('/registrations/:registrationId', adminBatchController.getRegistrationDetails);

// ===============================================
// EVENT MANAGEMENT ROUTES
// ===============================================

// Create new event
router.post('/events', adminEventController.createEvent);

// Get all events
router.get('/events', adminEventController.getAllEvents);

// Get event details
router.get('/events/:eventId', adminEventController.getEventDetails);

// Update event
router.put('/events/:eventId', adminEventController.updateEvent);

// Delete event
router.delete('/events/:eventId', adminEventController.deleteEvent);

// Toggle event active status
router.put('/events/:eventId/toggle-status', adminEventController.toggleEventStatus);

// Activate event (set status to 'active')
router.put('/events/:eventId/activate', adminEventController.activateEvent);

// Close event (set status to 'closed')
router.put('/events/:eventId/close', adminEventController.closeEvent);

// Archive event (set status to 'archived')
router.put('/events/:eventId/archive', adminEventController.archiveEvent);

// Get event batches
router.get('/events/:eventId/batches', adminEventController.getEventBatches);

// Get event registrations
router.get('/events/:eventId/registrations', adminEventController.getEventRegistrations);

// Get event analytics
router.get('/events/:eventId/analytics', adminEventController.getEventAnalytics);

// Export event registrations
router.get('/events/:eventId/export', adminEventController.exportEventRegistrations);

// ===============================================
// RESULT MANAGEMENT ROUTES
// ===============================================
const adminResultController = require('../controllers/admin/adminResult.controller');
const { uploadCSV } = require('../middleware/upload.middleware');

// Upload results via CSV
router.post('/events/:eventId/results/upload', uploadCSV, adminResultController.uploadResults);

// Download results template
router.get('/events/:eventId/results/template', adminResultController.downloadResultsTemplate);

// Get event results
router.get('/events/:eventId/results', adminResultController.getEventResults);

// Clear all results for event
router.delete('/events/:eventId/results', adminResultController.clearEventResults);

// Get batch results
router.get('/batches/:batchReference/results', adminResultController.getBatchResults);

// Update single registration result
router.put('/registrations/:registrationId/result', adminResultController.updateSingleResult);

// ===============================================
// CERTIFICATE MANAGEMENT ROUTES
// ===============================================
const certificateController = require('../controllers/admin/certificate.controller');

// Test certificate configuration for an event
router.post('/events/:eventId/certificates/test', certificateController.testCertificateConfig);

// Generate certificates for entire event
router.post('/events/:eventId/generate-certificates', certificateController.generateEventCertificates);

// Generate certificates for a specific batch
router.post('/batches/:batchId/generate-certificates', certificateController.generateBatchCertificates);

// Get certificate results for a batch
router.get('/batches/:batchId/certificates', certificateController.getBatchCertificates);

// ===============================================
// PAYMENT MANAGEMENT ROUTES
// ===============================================

// Get all payments with filters
router.get('/payments', adminPaymentController.getAllPayments);

// Get pending offline payments
router.get('/payments/pending-offline', adminPaymentController.getPendingOfflinePayments);

// Get payment analytics
router.get('/payments/analytics', adminPaymentController.getPaymentAnalytics);

// Get payment details
router.get('/payments/:paymentId', adminPaymentController.getPaymentDetails);

// Verify offline payment
router.put('/payments/:paymentId/verify', paymentController.verifyOfflinePayment);

// Reject offline payment
router.put('/payments/:paymentId/reject', paymentController.rejectOfflinePayment);

// ===============================================
// MEDIA LIBRARY ROUTES
// ===============================================

// Upload media files (up to 10 at once)
router.post('/media/upload', uploadMediaLibrary, adminMediaController.uploadMedia);

// Get all media with filters
router.get('/media', adminMediaController.getAllMedia);

// Get single media details
router.get('/media/:mediaId', adminMediaController.getMediaDetails);

// Update media metadata
router.put('/media/:mediaId', adminMediaController.updateMedia);

// Delete media
router.delete('/media/:mediaId', adminMediaController.deleteMedia);

// Bulk delete media
router.post('/media/bulk-delete', adminMediaController.bulkDeleteMedia);

// ===============================================
// SETTINGS & ADMIN MANAGEMENT ROUTES
// ===============================================
const adminSettingsController = require('../controllers/admin/adminSettings.controller');
const brandController = require('../controllers/brand.controller');

// Brand Info
router.put('/brand', brandController.updateBrandInfo);

// Settings
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);

// Admin Users
router.get('/users', adminSettingsController.getAdminUsers);
router.post('/users', adminSettingsController.createAdminUser);
router.put('/users/:userId', adminSettingsController.updateAdminUser);
router.delete('/users/:userId', adminSettingsController.deleteAdminUser);

// ===============================================
// EXPORT & BACKUP ROUTES
// ===============================================
const adminExportController = require('../controllers/admin/adminExport.controller');

// Data export routes
router.post('/export/schools', adminExportController.exportSchools);
router.post('/export/events', adminExportController.exportEvents);
router.post('/export/registrations', adminExportController.exportRegistrations);
router.post('/export/payments', adminExportController.exportPayments);
router.post('/export/all', adminExportController.exportAllData);

// Database backup routes
router.post('/backup/create', adminExportController.createDatabaseBackup);
router.get('/backup/status', adminExportController.getBackupStatus);

module.exports = router;
