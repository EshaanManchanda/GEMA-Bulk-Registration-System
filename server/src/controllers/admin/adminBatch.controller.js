const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const Batch = require('../../models/Batch');
const Payment = require('../../models/Payment');

/**
 * @desc    Get batch details
 * @route   GET /api/v1/admin/batches/:batchReference
 * @access  Private (Admin)
 */
exports.getBatchDetails = asyncHandler(async (req, res, next) => {
    const { batchReference } = req.params;

    const batch = await Batch.findOne({ batch_reference: batchReference })
        .populate('school_id', 'name school_code')
        .populate('event_id', 'title event_slug')
        .populate({
            path: 'registrations',
            select: 'student_name grade section status dynamic_data registration_id'
        });

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { batch }
    });
});

/**
 * @desc    Verify batch payment (offline)
 * @route   POST /api/v1/admin/batches/:batchReference/verify
 * @access  Private (Admin)
 */
exports.verifyBatchPayment = asyncHandler(async (req, res, next) => {
    const { batchReference } = req.params;
    const { notes } = req.body;

    const batch = await Batch.findOne({ batch_reference: batchReference });

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    // Verify payment on Batch
    await batch.verifyOfflinePayment(req.user._id, notes);

    // Sync Payment record
    const payment = await Payment.findOne({ batch_id: batch._id });
    if (payment) {
        payment.payment_status = 'completed';
        payment.paid_at = new Date();
        payment.offline_payment_details = {
            ...payment.offline_payment_details,
            verified_by: req.user._id,
            verified_at: new Date(),
            verification_notes: notes
        };
        await payment.save();
    }

    res.status(200).json({
        status: 'success',
        data: { batch }
    });
});

/**
 * @desc    Reject batch payment (offline)
 * @route   POST /api/v1/admin/batches/:batchReference/reject
 * @access  Private (Admin)
 */
exports.rejectBatchPayment = asyncHandler(async (req, res, next) => {
    const { batchReference } = req.params;
    const { reason } = req.body;

    const batch = await Batch.findOne({ batch_reference: batchReference });

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    // Reject payment on Batch
    await batch.rejectOfflinePayment(req.user._id, reason);

    // Sync Payment record
    const payment = await Payment.findOne({ batch_id: batch._id });
    if (payment) {
        payment.payment_status = 'failed';
        payment.offline_payment_details = {
            ...payment.offline_payment_details,
            verified_by: req.user._id,
            verified_at: new Date(),
            verification_notes: reason
        };
        await payment.save();
    }

    res.status(200).json({
        status: 'success',
        data: { batch }
    });
});

/**
 * @desc    Export batch registrations to CSV
 * @route   GET /api/v1/admin/batches/:batchReference/export
 * @access  Private (Admin)
 */
exports.exportBatchRegistrations = asyncHandler(async (req, res, next) => {
    const { batchReference } = req.params;

    const batch = await Batch.findOne({ batch_reference: batchReference })
        .populate('event_id');

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    const Registration = require('../../models/Registration');
    const csvExport = require('../../services/csvExport.service');

    const registrations = await Registration.find({ batch_id: batch._id })
        .sort({ created_at: 1 });

    const buffer = csvExport.generateBatchCSV(batch, registrations, batch.event_id.form_schema);
    const filename = csvExport.generateBatchFilename(batch.batch_reference);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
});

/**
 * @desc    Get single registration details
 * @route   GET /api/v1/admin/registrations/:registrationId
 * @access  Private (Admin)
 */
exports.getRegistrationDetails = asyncHandler(async (req, res, next) => {
    const { registrationId } = req.params;
    const Registration = require('../../models/Registration');

    const registration = await Registration.findOne({ registration_id: registrationId })
        .populate('school_id', 'name school_code contact_person')
        .populate('event_id', 'title event_slug form_schema')
        .populate('batch_id', 'batch_reference status payment_status');

    if (!registration) {
        return next(new AppError('Registration not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { registration }
    });
});

/**
 * @desc    Delete batch
 * @route   DELETE /api/v1/admin/batches/:batchReference
 * @access  Private (Admin)
 */
exports.deleteBatch = asyncHandler(async (req, res, next) => {
    const { batchReference } = req.params;
    const { startTransaction, commitTransaction, abortTransaction } = require('../../utils/transactionHelper');
    const Registration = require('../../models/Registration');

    const batch = await Batch.findOne({ batch_reference: batchReference });

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    // Check if payment exists and is completed
    const existingPayment = await Payment.findOne({ batch_id: batch._id });
    if (existingPayment && existingPayment.payment_status === 'completed') {
        return next(new AppError(
            'Cannot delete batch with completed payment. Please contact support if this is required.',
            400
        ));
    }

    // Start transaction for atomic deletion
    const { session, useTransaction } = await startTransaction();

    try {
        // Delete all registrations in this batch
        if (useTransaction) {
            await Registration.deleteMany({ batch_id: batch._id }, { session });
            if (existingPayment) {
                await Payment.deleteOne({ _id: existingPayment._id }, { session });
            }
            await batch.deleteOne({ session });
        } else {
            await Registration.deleteMany({ batch_id: batch._id });
            if (existingPayment) {
                await Payment.deleteOne({ _id: existingPayment._id });
            }
            await batch.deleteOne();
        }

        // Commit transaction
        await commitTransaction(session, useTransaction);

        res.status(200).json({
            status: 'success',
            message: 'Batch deleted successfully'
        });

    } catch (error) {
        // Rollback transaction on error
        await abortTransaction(session, useTransaction);
        const errorMessage = error.message || 'Failed to delete batch. Please try again.';
        throw new AppError(errorMessage, 500);
    }
});
