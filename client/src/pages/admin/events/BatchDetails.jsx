import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminBatchDetails, useVerifyBatchPayment, useRejectBatchPayment, useDownloadBatchData, useDeleteBatch } from '../../../hooks/useAdmin';
import { Card, Badge, Spinner, Button, Modal } from '../../../components/ui';
import { formatDate, formatCurrency, capitalizeFirst, toTitleCase, cn } from '../../../utils/helpers';
import { STATUS_VARIANTS } from '../../../utils/constants';
import { showSuccess, showError } from '../../../components/common/Toast';
import { Download, Eye, Trash2 } from 'lucide-react';

const BatchDetails = () => {
    const { batchReference } = useParams();
    const navigate = useNavigate();
    const { data: batch, isLoading, error } = useAdminBatchDetails(batchReference);

    // Mutation hooks
    const verifyPayment = useVerifyBatchPayment();
    const rejectPayment = useRejectBatchPayment();
    const downloadBatchDataMutation = useDownloadBatchData();
    const deleteBatchMutation = useDeleteBatch();

    // Modal states
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [verificationNotes, setVerificationNotes] = useState('');

    const handleVerifyStart = () => setShowVerifyModal(true);
    const handleRejectStart = () => setShowRejectModal(true);

    const handleVerifyConfirm = async () => {
        try {
            await verifyPayment.mutateAsync({
                batchReference,
                notes: verificationNotes
            });
            setShowVerifyModal(false);
            showSuccess('Payment verified successfully');
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to verify payment');
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            showError('Please provide a reason for rejection');
            return;
        }
        try {
            await rejectPayment.mutateAsync({
                batchReference,
                reason: rejectReason
            });
            setShowRejectModal(false);
            showSuccess('Payment rejected successfully');
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to reject payment');
        }
    };

    const handleDownloadData = async () => {
        try {
            const data = await downloadBatchDataMutation.mutateAsync(batchReference);

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `batch_${batchReference}_students.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            showSuccess('Student data downloaded successfully');
        } catch (error) {
            showError('Failed to download student data');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteBatchMutation.mutateAsync(batchReference);
            showSuccess('Batch deleted successfully');
            navigate('/admin/events');
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to delete batch');
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <Spinner size="xl" />
                </div>
            </AdminLayout>
        );
    }

    if (error || !batch) {
        return (
            <AdminLayout>
                <Card>
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
                        <p className="text-gray-600 mb-6">The batch you're looking for doesn't exist or you don't have permission to view it.</p>
                        <Button variant="primary" onClick={() => navigate('/admin/events')}>
                            Back to Events
                        </Button>
                    </div>
                </Card>
            </AdminLayout>
        );
    }

    const isOfflinePending = batch.payment_mode === 'OFFLINE' &&
        (batch.payment_status === 'pending' || batch.payment_status === 'processing' || batch.payment_status === 'pending_verification');

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Link to="/admin/events" className="hover:text-purple-600">Events</Link>
                            <span>/</span>
                            {batch.event_id && (
                                <>
                                    <Link to={`/admin/events/${batch.event_id._id}`} className="hover:text-purple-600">
                                        {batch.event_id.title}
                                    </Link>
                                    <span>/</span>
                                </>
                            )}
                            <span className="text-gray-900 font-medium">Batch Details</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Batch: {batch.batch_reference}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="danger"
                            onClick={() => setShowDeleteModal(true)}
                            icon={Trash2}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownloadData}
                            isLoading={downloadBatchDataMutation.isPending}
                            icon={Download}
                        >
                            Download Student Data
                        </Button>
                        <Badge variant={STATUS_VARIANTS[batch.payment_status?.toLowerCase()] || 'default'} size="lg">
                            {capitalizeFirst(batch.payment_status)}
                        </Badge>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <Card.Header>
                                <Card.Title>Batch Information</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">School Name</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {batch.school_id?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">School Code</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {batch.school_id?.school_code || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Event</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {batch.event_id?.title || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Total Students</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {batch.total_students || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Created Date</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {formatDate(batch.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Students List */}
                        <Card>
                            <Card.Header>
                                <div className="flex justify-between items-center">
                                    <Card.Title>Registered Students</Card.Title>
                                    <span className="text-sm text-gray-500">
                                        {batch.registrations?.length || 0} registered
                                    </span>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {batch.registrations && batch.registrations.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Grade / Section
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Dynamic Data
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {batch.registrations.map((student, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {student.student_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-600">
                                                                {student.student_email || batch.school_id?.contact_person?.email || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-600">
                                                                {student.student_phone || batch.school_id?.contact_person?.phone || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-600">
                                                                {student.grade} {student.section ? `- ${student.section}` : ''}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {student.dynamic_data ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Object.entries(student.dynamic_data).slice(0, 2).map(([key, value]) => (
                                                                        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[150px]">
                                                                            {value}
                                                                        </span>
                                                                    ))}
                                                                    {Object.keys(student.dynamic_data).length > 2 && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 border border-gray-100">
                                                                            +{Object.keys(student.dynamic_data).length - 2} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic">No extra data</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <Link
                                                                to={`/admin/registrations/${student.registration_id}`}
                                                                className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                                                            >
                                                                <Eye className="h-4 w-4" /> View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No students found in this batch.
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Sidebar - Payment Info */}
                    <div className="space-y-6">
                        <Card>
                            <Card.Header>
                                <Card.Title>Payment Details</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Total Amount</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(batch.total_amount, batch.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Payment Status</span>
                                        <Badge variant={STATUS_VARIANTS[batch.payment_status?.toLowerCase()] || 'default'}>
                                            {capitalizeFirst(batch.payment_status)}
                                        </Badge>
                                    </div>
                                    {batch.payment_mode && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-600">Payment Mode</span>
                                            <span className="text-sm font-medium">
                                                {toTitleCase(batch.payment_mode)}
                                            </span>
                                        </div>
                                    )}
                                    {batch.payment_id && (
                                        <div className="py-2">
                                            <span className="text-sm text-gray-600 block mb-1">Transaction ID</span>
                                            <code className="text-xs bg-gray-100 p-1 rounded break-all">
                                                {batch.payment_id}
                                            </code>
                                        </div>
                                    )}
                                    {batch.invoice_number && (
                                        <div className="py-2">
                                            <span className="text-sm text-gray-600 block mb-1">Invoice Number</span>
                                            <span className="text-sm font-medium">{batch.invoice_number}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Offline Payment Details & Actions */}
                                {batch.offline_payment_details && (
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Offline Payment Proof</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500 block">Transaction Reference</span>
                                                <span className="text-sm font-medium text-gray-900">{batch.offline_payment_details.transaction_reference || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-1">Receipt</span>
                                                {batch.offline_payment_details.receipt_url ? (
                                                    <div className="relative group cursor-pointer" onClick={() => setShowReceiptModal(true)}>
                                                        <img
                                                            src={batch.offline_payment_details.receipt_url}
                                                            alt="Receipt"
                                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                                                Click to view
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">No receipt uploaded</span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {isOfflinePending && (
                                                <div className="pt-4 flex flex-col gap-2">
                                                    <Button
                                                        variant="success"
                                                        fullWidth
                                                        onClick={handleVerifyStart}
                                                        isLoading={verifyPayment.isLoading}
                                                    >
                                                        Verify Payment
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        fullWidth
                                                        onClick={handleRejectStart}
                                                        isLoading={rejectPayment.isLoading}
                                                    >
                                                        Reject Payment
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {batch.payment_status === 'completed' && batch.invoice_pdf_url && (
                                    <div className="mt-6">
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            onClick={() => window.open(batch.invoice_pdf_url, '_blank')}
                                        >
                                            Download Invoice
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* Verify Modal */}
                <Modal
                    isOpen={showVerifyModal}
                    onClose={() => setShowVerifyModal(false)}
                    title="Verify Offline Payment"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Confirmation Required</h4>
                            <p className="text-sm text-yellow-700">
                                verifying this payment will mark the batch as "Completed" and generate an invoice. This action cannot be undone.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Verification Notes (Optional)
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                rows="3"
                                placeholder="Add any notes about this verification..."
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowVerifyModal(false)}
                                disabled={verifyPayment.isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleVerifyConfirm}
                                isLoading={verifyPayment.isLoading}
                            >
                                Confirm Verification
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Reject Modal */}
                <Modal
                    isOpen={showRejectModal}
                    onClose={() => setShowRejectModal(false)}
                    title="Reject Offline Payment"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-red-800 mb-1">Warning</h4>
                            <p className="text-sm text-red-700">
                                Rejecting this payment will mark the batch as "Failed". The school will be notified to correct and re-upload proof.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                rows="3"
                                placeholder="Explain why this payment is being rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(false)}
                                disabled={rejectPayment.isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleRejectConfirm}
                                isLoading={rejectPayment.isLoading}
                                disabled={!rejectReason.trim()}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Batch"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-red-800 mb-1">Critical Warning</h4>
                            <p className="text-sm text-red-700">
                                This action will PERMANENTLY DELETE this batch and all its {batch.total_students} student registrations.
                                This action cannot be undone.
                            </p>
                            {batch.payment_status === 'completed' && (
                                <p className="text-sm font-bold text-red-800 mt-2">
                                    NOTE: This batch has a COMPLETED payment. Deleting it is highly discouraged unless strictly necessary.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteBatchMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteConfirm}
                                isLoading={deleteBatchMutation.isPending}
                            >
                                Confirm Delete
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Receipt Preview Modal */}
                <Modal
                    isOpen={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                    title="Payment Receipt"
                    size="2xl"
                >
                    <div className="flex justify-center bg-gray-100 rounded-lg p-2">
                        {batch?.offline_payment_details?.receipt_url && (
                            <img
                                src={batch.offline_payment_details.receipt_url}
                                alt="Receipt Full View"
                                className="max-w-full max-h-[70vh] object-contain"
                            />
                        )}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
                            Close
                        </Button>
                    </div>
                </Modal>

            </div>
        </AdminLayout>
    );
};

export default BatchDetails;
