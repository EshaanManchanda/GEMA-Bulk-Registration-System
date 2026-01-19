/**
 * Transaction Helper Utility
 * Provides fallback support for MongoDB transactions
 * Works in both replica set and standalone modes
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Start a transaction session with fallback
 * @returns {Object} { session, useTransaction }
 */
async function startTransaction() {
  let session = null;
  let useTransaction = false;

  try {
    // Check if connected to replica set
    const client = mongoose.connection.getClient();
    const topology = client?.topology;

    // If not a replica set, skip transaction attempt
    if (!topology || topology.description?.type !== 'ReplicaSetWithPrimary') {
      logger.warn('MongoDB not running as replica set. Transactions disabled. Using fallback mode.');
      return { session: null, useTransaction: false };
    }

    session = await mongoose.startSession();
    await session.startTransaction();
    useTransaction = true;
    logger.debug('Transaction started');
  } catch (error) {
    logger.warn('Transactions not supported (requires replica set), using fallback mode:', error.message);
    if (session) {
      try {
        session.endSession();
      } catch (endError) {
        // Ignore
      }
    }
    session = null;
    useTransaction = false;
  }

  return { session, useTransaction };
}

/**
 * Commit a transaction with fallback
 * @param {Object} session - Mongoose session
 * @param {Boolean} useTransaction - Whether transaction is active
 */
async function commitTransaction(session, useTransaction) {
  if (useTransaction && session) {
    try {
      await session.commitTransaction();
      session.endSession();
      logger.debug('Transaction committed');
    } catch (error) {
      logger.error('Failed to commit transaction:', error);
      throw error;
    }
  }
}

/**
 * Abort a transaction with fallback
 * @param {Object} session - Mongoose session
 * @param {Boolean} useTransaction - Whether transaction is active
 */
async function abortTransaction(session, useTransaction) {
  if (useTransaction && session) {
    try {
      await session.abortTransaction();
      session.endSession();
      logger.debug('Transaction aborted');
    } catch (error) {
      logger.error('Failed to abort transaction:', error);
      // Don't throw - we're already in error handling
    }
  }
}

/**
 * Get session options for create/save operations
 * @param {Object} session - Mongoose session
 * @param {Boolean} useTransaction - Whether transaction is active
 * @returns {Object} Options object with session if transaction is active
 */
function getSessionOptions(session, useTransaction) {
  return useTransaction && session ? { session } : {};
}

module.exports = {
  startTransaction,
  commitTransaction,
  abortTransaction,
  getSessionOptions
};
