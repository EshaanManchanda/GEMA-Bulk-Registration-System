const Papa = require('papaparse');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');
const Registration = require('../models/Registration');

/**
 * Result Parser Service
 * Handles parsing and validation of result CSV files
 */
class ResultParserService {
  /**
   * Parse results CSV buffer
   * @param {Buffer} buffer - CSV file buffer
   * @returns {Promise<Array>} Parsed results array
   */
  async parseResultsCSV(buffer) {
    return new Promise((resolve, reject) => {
      const csvString = buffer.toString('utf-8');

      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          if (results.errors.length > 0) {
            logger.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new AppError(`CSV parsing failed: ${error.message}`, 400));
        }
      });
    });
  }

  /**
   * Validate results data
   * @param {Array} results - Parsed results array
   * @param {string} eventId - Event ID to validate against
   * @returns {Object} { valid: Array, errors: Array }
   */
  async validateResultsData(results, eventId) {
    const validResults = [];
    const errors = [];
    const seenRegistrationIds = new Set();
    const ranks = new Map(); // Track ranks per category if needed

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNum = i + 2; // Account for header row
      const rowErrors = [];

      // Required field: registration_id
      const regId = row.registration_id?.trim();
      if (!regId) {
        rowErrors.push(`Row ${rowNum}: Missing registration_id`);
      } else if (seenRegistrationIds.has(regId)) {
        rowErrors.push(`Row ${rowNum}: Duplicate registration_id '${regId}'`);
      } else {
        seenRegistrationIds.add(regId);
      }

      // Validate score (optional but must be numeric if present)
      const score = row.score !== undefined && row.score !== ''
        ? parseFloat(row.score)
        : null;
      if (score !== null && (isNaN(score) || score < 0)) {
        rowErrors.push(`Row ${rowNum}: Invalid score '${row.score}'`);
      }

      // Validate rank (optional but must be positive integer if present)
      const rank = row.rank !== undefined && row.rank !== ''
        ? parseInt(row.rank, 10)
        : null;
      if (rank !== null && (isNaN(rank) || rank < 1)) {
        rowErrors.push(`Row ${rowNum}: Invalid rank '${row.rank}'`);
      }

      // Award is optional string
      const award = row.award?.trim() || null;

      // Remarks is optional string
      const remarks = row.remarks?.trim() || null;

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validResults.push({
          registration_id: regId,
          score,
          rank,
          award,
          remarks,
          rowNumber: rowNum
        });
      }
    }

    // Verify registration IDs exist for this event
    if (validResults.length > 0) {
      const regIds = validResults.map(r => r.registration_id);
      const existingRegs = await Registration.find({
        registration_id: { $in: regIds },
        event_id: eventId
      }).select('registration_id');

      const existingIds = new Set(existingRegs.map(r => r.registration_id));

      for (const result of validResults) {
        if (!existingIds.has(result.registration_id)) {
          errors.push(`Registration ID '${result.registration_id}' not found for this event`);
          // Remove from valid results
          const idx = validResults.indexOf(result);
          if (idx > -1) validResults.splice(idx, 1);
        }
      }
    }

    return { valid: validResults, errors };
  }

  /**
   * Bulk update results in database
   * @param {string} eventId - Event ID
   * @param {Array} results - Validated results array
   * @returns {Promise<Object>} Update summary
   */
  async bulkUpdateResults(eventId, results) {
    const bulkOps = results.map(result => ({
      updateOne: {
        filter: {
          registration_id: result.registration_id,
          event_id: eventId
        },
        update: {
          $set: {
            'result.score': result.score,
            'result.rank': result.rank,
            'result.award': result.award,
            'result.remarks': result.remarks,
            updated_at: new Date()
          }
        }
      }
    }));

    const bulkResult = await Registration.bulkWrite(bulkOps);

    logger.info(`Bulk results update: ${bulkResult.modifiedCount} of ${results.length} registrations updated`);

    return {
      total: results.length,
      updated: bulkResult.modifiedCount,
      matched: bulkResult.matchedCount
    };
  }

  /**
   * Generate results template CSV
   * @param {string} eventId - Event ID
   * @returns {Promise<string>} CSV string
   */
  async generateResultsTemplate(eventId) {
    const registrations = await Registration.find({
      event_id: eventId,
      status: { $in: ['confirmed', 'attended'] }
    })
      .select('registration_id student_name grade section')
      .sort('student_name');

    const rows = registrations.map(reg => ({
      registration_id: reg.registration_id,
      student_name: reg.student_name,
      grade: reg.grade,
      section: reg.section || '',
      score: '',
      rank: '',
      award: '',
      remarks: ''
    }));

    return Papa.unparse(rows, {
      header: true,
      columns: ['registration_id', 'student_name', 'grade', 'section', 'score', 'rank', 'award', 'remarks']
    });
  }
}

module.exports = new ResultParserService();
