const School = require('../../models/School');
const Event = require('../../models/Event');
const Registration = require('../../models/Registration');
const Payment = require('../../models/Payment');
const csvExportService = require('../../services/csvExport.service');
const backupService = require('../../services/backup.service');
const logger = require('../../utils/logger');

/**
 * Admin Export Controller
 * Handles data export and backup operations
 */

/**
 * Export all schools data to CSV
 * @route POST /api/v1/admin/export/schools
 */
exports.exportSchools = async (req, res) => {
    try {
        logger.info('Exporting schools data...');

        // Fetch all schools
        const schools = await School.find({}).sort({ created_at: -1 });

        if (!schools || schools.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No schools found to export'
            });
        }

        // Generate CSV
        const csvBuffer = csvExportService.generateSchoolsCSV(schools);
        const filename = csvExportService.generateExportFilename('schools');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', csvBuffer.length);

        logger.info(`Schools export successful: ${schools.length} schools`);
        res.send(csvBuffer);
    } catch (error) {
        logger.error('Schools export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export schools data',
            error: error.message
        });
    }
};

/**
 * Export all events data to CSV
 * @route POST /api/v1/admin/export/events
 */
exports.exportEvents = async (req, res) => {
    try {
        logger.info('Exporting events data...');

        // Fetch all events
        const events = await Event.find({}).sort({ created_at: -1 });

        if (!events || events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No events found to export'
            });
        }

        // Generate CSV
        const csvBuffer = csvExportService.generateEventsCSV(events);
        const filename = csvExportService.generateExportFilename('events');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', csvBuffer.length);

        logger.info(`Events export successful: ${events.length} events`);
        res.send(csvBuffer);
    } catch (error) {
        logger.error('Events export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export events data',
            error: error.message
        });
    }
};

/**
 * Export all registrations data to CSV
 * @route POST /api/v1/admin/export/registrations
 */
exports.exportRegistrations = async (req, res) => {
    try {
        logger.info('Exporting registrations data...');

        // Fetch all registrations with populated relations
        const registrations = await Registration.find({})
            .populate('school_id', 'school_code name')
            .populate('event_id', 'title')
            .populate('batch_id', 'batch_reference payment_status payment_mode total_amount currency')
            .sort({ created_at: -1 });

        if (!registrations || registrations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registrations found to export'
            });
        }

        // Generate CSV
        const csvBuffer = csvExportService.generateAllRegistrationsCSV(registrations);
        const filename = csvExportService.generateExportFilename('registrations');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', csvBuffer.length);

        logger.info(`Registrations export successful: ${registrations.length} registrations`);
        res.send(csvBuffer);
    } catch (error) {
        logger.error('Registrations export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export registrations data',
            error: error.message
        });
    }
};

/**
 * Export all payments data to CSV
 * @route POST /api/v1/admin/export/payments
 */
exports.exportPayments = async (req, res) => {
    try {
        logger.info('Exporting payments data...');

        // Fetch all payments with populated relations
        const payments = await Payment.find({})
            .populate('school_id', 'school_code name')
            .populate('event_id', 'title')
            .populate('batch_id', 'batch_reference')
            .sort({ created_at: -1 });

        if (!payments || payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payments found to export'
            });
        }

        // Generate CSV
        const csvBuffer = csvExportService.generatePaymentsCSV(payments);
        const filename = csvExportService.generateExportFilename('payments');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', csvBuffer.length);

        logger.info(`Payments export successful: ${payments.length} payments`);
        res.send(csvBuffer);
    } catch (error) {
        logger.error('Payments export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export payments data',
            error: error.message
        });
    }
};

/**
 * Export all system data as ZIP archive
 * @route POST /api/v1/admin/export/all
 */
exports.exportAllData = async (req, res) => {
    try {
        logger.info('Exporting all system data...');

        // Fetch all data in parallel
        const [schools, events, registrations, payments] = await Promise.all([
            School.find({}).sort({ created_at: -1 }),
            Event.find({}).sort({ created_at: -1 }),
            Registration.find({})
                .populate('school_id', 'school_code name')
                .populate('event_id', 'title')
                .populate('batch_id', 'batch_reference payment_status payment_mode total_amount currency')
                .sort({ created_at: -1 }),
            Payment.find({})
                .populate('school_id', 'school_code name')
                .populate('event_id', 'title')
                .populate('batch_id', 'batch_reference')
                .sort({ created_at: -1 })
        ]);

        // Check if any data exists
        const totalRecords = schools.length + events.length + registrations.length + payments.length;
        if (totalRecords === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data found to export'
            });
        }

        // Generate CSV files
        const files = {};

        if (schools.length > 0) {
            files['schools.csv'] = csvExportService.generateSchoolsCSV(schools);
        }

        if (events.length > 0) {
            files['events.csv'] = csvExportService.generateEventsCSV(events);
        }

        if (registrations.length > 0) {
            files['registrations.csv'] = csvExportService.generateAllRegistrationsCSV(registrations);
        }

        if (payments.length > 0) {
            files['payments.csv'] = csvExportService.generatePaymentsCSV(payments);
        }

        // Create ZIP archive
        const zipBuffer = await backupService.createZipArchive(files);
        const filename = csvExportService.generateExportFilename('export_all').replace('.csv', '.zip');

        // Set headers for file download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', zipBuffer.length);

        logger.info(`Complete export successful: ${Object.keys(files).length} files, ${totalRecords} total records`);
        res.send(zipBuffer);
    } catch (error) {
        logger.error('Complete export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export all data',
            error: error.message
        });
    }
};

/**
 * Create database backup
 * @route POST /api/v1/admin/backup/create
 */
exports.createDatabaseBackup = async (req, res) => {
    try {
        logger.info('Creating database backup...');

        const backupInfo = await backupService.createDatabaseBackup();

        // Cleanup old backups (keep last 10)
        await backupService.cleanupOldBackups(10);

        res.status(200).json({
            success: true,
            message: 'Database backup created successfully',
            data: backupInfo
        });
    } catch (error) {
        logger.error('Database backup error:', error);

        // Check if it's a mongodump not installed error
        if (error.message.includes('not installed')) {
            return res.status(503).json({
                success: false,
                message: 'Database backup service unavailable',
                error: 'MongoDB Database Tools (mongodump) is not installed on the server. Please install it to use this feature.',
                installInstructions: 'https://www.mongodb.com/try/download/database-tools'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create database backup',
            error: error.message
        });
    }
};

/**
 * Get backup status and information
 * @route GET /api/v1/admin/backup/status
 */
exports.getBackupStatus = async (req, res) => {
    try {
        const backupInfo = await backupService.getLastBackupInfo();

        res.status(200).json({
            success: true,
            data: backupInfo
        });
    } catch (error) {
        logger.error('Get backup status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve backup status',
            error: error.message
        });
    }
};
