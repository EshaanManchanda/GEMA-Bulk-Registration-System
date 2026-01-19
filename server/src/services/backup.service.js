const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const logger = require('../utils/logger');

/**
 * Backup Service
 * Handles MongoDB backups and ZIP file operations
 */
class BackupService {
    constructor() {
        this.backupDir = path.join(process.cwd(), 'backups', 'mongodb');
        this.tempDir = path.join(process.cwd(), 'temp', 'exports');
    }

    /**
     * Initialize backup directories
     * @private
     */
    async _ensureDirectories() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            logger.error('Error creating backup directories:', error);
            throw error;
        }
    }

    /**
     * Create MongoDB database backup using mongodump
     * @returns {Promise<Object>} - Backup information
     */
    async createDatabaseBackup() {
        try {
            await this._ensureDirectories();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
            const backupFileName = `backup_${timestamp}.gz`;
            const backupPath = path.join(this.backupDir, backupFileName);

            // Get MongoDB connection details from environment
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bulk_registration';

            // Build mongodump command
            const command = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;

            logger.info('Starting database backup...');

            return new Promise((resolve, reject) => {
                exec(command, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
                    if (error) {
                        logger.error('Backup error:', error);
                        logger.error('stderr:', stderr);

                        // Check if mongodump is not installed
                        if (error.message.includes('not found') || error.message.includes('not recognized')) {
                            return reject(new Error('mongodump is not installed. Please install MongoDB Database Tools.'));
                        }

                        return reject(error);
                    }

                    try {
                        // Get backup file size
                        const stats = await fs.stat(backupPath);
                        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

                        const backupInfo = {
                            filename: backupFileName,
                            path: backupPath,
                            size: `${sizeInMB} MB`,
                            sizeBytes: stats.size,
                            created_at: new Date(),
                            timestamp
                        };

                        logger.info(`Database backup created successfully: ${backupFileName} (${sizeInMB} MB)`);
                        resolve(backupInfo);
                    } catch (statError) {
                        logger.error('Error getting backup file stats:', statError);
                        reject(statError);
                    }
                });
            });
        } catch (error) {
            logger.error('Database backup failed:', error);
            throw error;
        }
    }

    /**
     * Get information about the last backup
     * @returns {Promise<Object>} - Last backup information
     */
    async getLastBackupInfo() {
        try {
            await this._ensureDirectories();

            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.gz'));

            if (backupFiles.length === 0) {
                return {
                    exists: false,
                    message: 'No backups found'
                };
            }

            // Sort by filename (which includes timestamp) to get the latest
            backupFiles.sort().reverse();
            const latestBackup = backupFiles[0];
            const backupPath = path.join(this.backupDir, latestBackup);

            const stats = await fs.stat(backupPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            return {
                exists: true,
                filename: latestBackup,
                path: backupPath,
                size: `${sizeInMB} MB`,
                sizeBytes: stats.size,
                created_at: stats.mtime,
                location: `/backups/mongodb/${latestBackup}`
            };
        } catch (error) {
            logger.error('Error getting last backup info:', error);
            return {
                exists: false,
                message: 'Error retrieving backup information',
                error: error.message
            };
        }
    }

    /**
     * Create ZIP archive from multiple CSV buffers
     * @param {Object} files - Object with { filename: buffer } pairs
     * @returns {Promise<Buffer>} - ZIP file buffer
     */
    async createZipArchive(files) {
        return new Promise((resolve, reject) => {
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            const buffers = [];

            archive.on('data', (chunk) => {
                buffers.push(chunk);
            });

            archive.on('end', () => {
                const zipBuffer = Buffer.concat(buffers);
                logger.info(`ZIP archive created: ${(zipBuffer.length / 1024).toFixed(2)} KB`);
                resolve(zipBuffer);
            });

            archive.on('error', (error) => {
                logger.error('ZIP archive error:', error);
                reject(error);
            });

            // Add each file to the archive
            Object.entries(files).forEach(([filename, buffer]) => {
                archive.append(buffer, { name: filename });
            });

            archive.finalize();
        });
    }

    /**
     * Clean up old backup files (keep last N backups)
     * @param {number} keepCount - Number of backups to keep (default: 10)
     */
    async cleanupOldBackups(keepCount = 10) {
        try {
            await this._ensureDirectories();

            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.gz'));

            if (backupFiles.length <= keepCount) {
                logger.info(`No cleanup needed. Found ${backupFiles.length} backups.`);
                return;
            }

            // Sort by filename (oldest first)
            backupFiles.sort();

            // Delete oldest backups
            const filesToDelete = backupFiles.slice(0, backupFiles.length - keepCount);

            for (const file of filesToDelete) {
                const filePath = path.join(this.backupDir, file);
                await fs.unlink(filePath);
                logger.info(`Deleted old backup: ${file}`);
            }

            logger.info(`Cleanup complete. Deleted ${filesToDelete.length} old backups.`);
        } catch (error) {
            logger.error('Error cleaning up old backups:', error);
            // Don't throw - cleanup errors shouldn't break the main flow
        }
    }
}

// Export singleton instance
module.exports = new BackupService();
