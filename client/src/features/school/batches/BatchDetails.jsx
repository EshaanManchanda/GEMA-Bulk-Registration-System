import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import {
  useBatchDetails,
  useDownloadBatchCSV,
  useDeleteBatch,
  useBatchEditableStatus,
  useAddStudent,
  useUpdateStudent,
  useRemoveStudent
} from '../../../hooks/useBatches';
import { Card, Badge, Button, Spinner, Table, Modal, Input } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { BATCH_STATUS, PAYMENT_STATUS, BADGE_CLASSES } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';
import PaymentSelectionModal from '../../../components/PaymentSelectionModal';

/**
 * Batch Details Page
 * Shows detailed information about a specific batch with editing capabilities
 */
const BatchDetails = () => {
  const { batchReference } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useBatchDetails(batchReference);
  const { data: editableStatus } = useBatchEditableStatus(batchReference);
  const batch = data?.batch;
  const payment = data?.payment;

  const downloadCSV = useDownloadBatchCSV();
  const deleteBatchMutation = useDeleteBatch();
  const addStudentMutation = useAddStudent();
  const updateStudentMutation = useUpdateStudent();
  const removeStudentMutation = useRemoveStudent();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [studentForm, setStudentForm] = useState({
    student_name: '',
    student_email: '',
    grade: '',
    section: '',
    exam_date: ''
  });

  const isEditable = editableStatus?.editable ?? false;

  const handleDownloadCSV = async () => {
    try {
      await downloadCSV.mutateAsync(batchReference);
      showSuccess('CSV file downloaded successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to download CSV file');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBatchMutation.mutateAsync(batchReference);
      showSuccess('Batch deleted successfully');
      navigate('/school/batches');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete batch');
      setShowDeleteModal(false);
    }
  };

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setStudentForm({ student_name: '', student_email: '', grade: '', section: '', exam_date: '' });
    setShowStudentModal(true);
  };

  const openEditStudentModal = (student) => {
    setEditingStudent(student);
    setStudentForm({
      student_name: student.name || student.student_name || '',
      student_email: student.student_email || '',
      grade: student.grade || '',
      section: student.section || '',
      exam_date: student.exam_date ? new Date(student.exam_date).toISOString().split('T')[0] : ''
    });
    setShowStudentModal(true);
  };

  const openRemoveStudentModal = (student) => {
    setStudentToRemove(student);
    setShowRemoveModal(true);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudentMutation.mutateAsync({
          batchReference,
          registrationId: editingStudent.registration_id,
          studentData: studentForm
        });
        showSuccess('Student updated successfully');
      } else {
        await addStudentMutation.mutateAsync({
          batchReference,
          studentData: studentForm
        });
        showSuccess('Student added successfully');
      }
      setShowStudentModal(false);
      refetch();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleRemoveStudent = async () => {
    try {
      await removeStudentMutation.mutateAsync({
        batchReference,
        registrationId: studentToRemove.registration_id
      });
      showSuccess('Student removed successfully');
      setShowRemoveModal(false);
      setStudentToRemove(null);
      refetch();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to remove student');
    }
  };

  if (isLoading) {
    return (
      <SchoolLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </SchoolLayout>
    );
  }

  if (!batch) {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
            <p className="text-gray-600 mb-6">The batch you're looking for doesn't exist.</p>
            <Link to="/school/batches">
              <Button variant="primary">Back to My Batches</Button>
            </Link>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  const studentColumns = [
    { key: 'index', label: '#', render: (_, __, index) => index + 1 },
    { key: 'name', label: 'Name' },
    { key: 'student_email', label: 'Email', render: (_, row) => row.student_email || '-' },
    { key: 'exam_date', label: 'Exam Date', render: (_, row) => row.exam_date ? formatDate(row.exam_date) : '-' },
    { key: 'grade', label: 'Grade' },
    { key: 'section', label: 'Section' },
    ...(isEditable ? [{
      key: 'actions',
      label: 'Actions',
      render: (_, student) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditStudentModal(student)}
            className="text-primary-600 hover:text-primary-800"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => openRemoveStudentModal(student)}
            className="text-red-600 hover:text-red-800"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }] : [])
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/school/batches" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{batch.batch_reference}</h1>
            <p className="text-gray-600 mt-1">Batch Details</p>
          </div>
          <Badge variant={BADGE_CLASSES[batch.status]?.variant || 'info'} size="lg">
            {batch.status}
          </Badge>
        </div>

        {/* Editing Status Banner */}
        {!isEditable && payment?.status === 'completed' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-amber-800 text-sm">
              <strong>Batch is locked.</strong> Payment has been completed. Student data cannot be modified.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Information */}
            <Card>
              <Card.Header>
                <Card.Title>Batch Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event</p>
                    <Link
                      to={`/school/events/${batch.event?.slug}`}
                      className="text-lg font-medium text-primary-600 hover:text-primary-700"
                    >
                      {batch.event?.name || 'N/A'}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Batch Reference</p>
                    <p className="text-lg font-medium text-gray-900">{batch.batch_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Students</p>
                    <p className="text-lg font-medium text-gray-900">{batch.num_students}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Currency</p>
                    <p className="text-lg font-medium text-gray-900">{batch.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created Date</p>
                    <p className="text-lg font-medium text-gray-900">{formatDate(batch.created_at)}</p>
                  </div>
                  {batch.excel_file_url && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CSV File</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCSV}
                        loading={downloadCSV.isPending}
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        }
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Students List */}
            <Card>
              <Card.Header className="flex items-center justify-between">
                <Card.Title>Registered Students ({batch.students?.length || 0})</Card.Title>
                {isEditable && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openAddStudentModal}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    Add Student
                  </Button>
                )}
              </Card.Header>
              <Card.Body>
                {batch.students && batch.students.length > 0 ? (
                  <Table columns={studentColumns} data={batch.students} />
                ) : (
                  <p className="text-gray-500 text-center py-8">No student data available</p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <Card.Header>
                <Card.Title>Payment Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatCurrency(batch.subtotal_amount || batch.base_amount, batch.currency)}</span>
                  </div>
                  {batch.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({batch.discount_percentage}%)</span>
                      <span>-{formatCurrency(batch.discount_amount, batch.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatCurrency(batch.total_amount, batch.currency)}</span>
                  </div>

                  {/* Payment Status */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Status</span>
                        {payment ? (
                          <Badge variant={
                            payment.status === 'completed' ? 'success' :
                              payment.status === 'processing' ? 'warning' :
                                payment.status === 'failed' ? 'danger' : 'info'
                          }>
                            {payment.status}
                          </Badge>
                        ) : (
                          <Badge variant="warning">Not Paid</Badge>
                        )}
                      </div>
                      {payment?.payment_mode && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Mode</span>
                          <span className="font-medium capitalize">{payment.payment_mode}</span>
                        </div>
                      )}
                      {payment?.payment_gateway && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Gateway</span>
                          <span className="font-medium capitalize">{payment.payment_gateway}</span>
                        </div>
                      )}
                      {payment && payment.status === 'completed' && (
                        <div className="mt-3">
                          <Link to={`/school/payments/${payment.payment_reference}`}>
                            <Button variant="outline" size="sm" fullWidth>
                              View Payment Details
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Actions</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {(!payment || payment.status === 'failed') && batch.status === 'draft' && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setShowPaymentModal(true)}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      }
                    >
                      Make Payment
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleDownloadCSV}
                    loading={downloadCSV.isPending}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    }
                  >
                    Download CSV
                  </Button>
                  {batch.invoice && (
                    <Link to={`/school/invoices/${batch.invoice.invoice_number}`}>
                      <Button
                        variant="outline"
                        fullWidth
                        leftIcon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                      >
                        View Invoice
                      </Button>
                    </Link>
                  )}
                  {batch.status === 'draft' && (
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => setShowDeleteModal(true)}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      Delete Batch
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Event Info */}
            {batch.event && (
              <Card>
                <Card.Header>
                  <Card.Title>Event Details</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Event Date</p>
                      <p className="text-gray-900 font-medium">{formatDate(batch.event.event_date)}</p>
                    </div>
                    {batch.event.venue && (
                      <div>
                        <p className="text-gray-600 mb-1">Venue</p>
                        <p className="text-gray-900 font-medium">{batch.event.venue}</p>
                      </div>
                    )}
                    <Link to={`/school/events/${batch.event.slug}`}>
                      <Button variant="outline" size="sm" fullWidth>
                        View Event Details
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>

        {/* Payment Selection Modal */}
        {showPaymentModal && (
          <PaymentSelectionModal
            batchReference={batch.batch_reference}
            amount={batch.total_amount}
            currency={batch.currency}
            onClose={() => setShowPaymentModal(false)}
            onSelect={(mode) => {
              setShowPaymentModal(false);
              navigate(`/school/payments/make-payment?batch=${batch.batch_reference}&mode=${mode}`);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
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
                Are you sure you want to delete batch <strong>{batchReference}</strong>?
                This action cannot be undone and all {batch.num_students} registration records will be permanently lost.
              </p>
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
                Yes, Delete Batch
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add/Edit Student Modal */}
        <Modal
          isOpen={showStudentModal}
          onClose={() => setShowStudentModal(false)}
          title={editingStudent ? 'Edit Student' : 'Add Student'}
          size="md"
        >
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={studentForm.student_name}
                onChange={(e) => setStudentForm(f => ({ ...f, student_name: e.target.value }))}
                placeholder="Enter student name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={studentForm.grade}
                onChange={(e) => setStudentForm(f => ({ ...f, grade: e.target.value }))}
                placeholder="e.g., 5, 6, 7"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <Input
                type="text"
                value={studentForm.section}
                onChange={(e) => setStudentForm(f => ({ ...f, section: e.target.value }))}
                placeholder="e.g., A, B, C"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Email
              </label>
              <Input
                type="email"
                value={studentForm.student_email}
                onChange={(e) => setStudentForm(f => ({ ...f, student_email: e.target.value }))}
                placeholder="Enter student email"
              />
            </div>

            {batch?.event?.schedule_type === 'multiple_dates' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date <span className="text-red-500">*</span>
                </label>
                {batch.event.event_dates && batch.event.event_dates.length > 0 ? (
                  <select
                    value={studentForm.exam_date}
                    onChange={(e) => setStudentForm(f => ({ ...f, exam_date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Exam Date</option>
                    {batch.event.event_dates.map((d, i) => (
                      <option key={i} value={new Date(d.date || d).toISOString().split('T')[0]}>
                        {d.label ? `${d.label} - ` : ''}{formatDate(d.date || d)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="date"
                    value={studentForm.exam_date}
                    onChange={(e) => setStudentForm(f => ({ ...f, exam_date: e.target.value }))}
                    required
                  />
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowStudentModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={addStudentMutation.isPending || updateStudentMutation.isPending}
              >
                {editingStudent ? 'Update Student' : 'Add Student'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Remove Student Confirmation Modal */}
        <Modal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          title="Remove Student"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to remove <strong>{studentToRemove?.name || studentToRemove?.student_name}</strong> from this batch?
            </p>
            <p className="text-sm text-gray-500">
              The batch total will be recalculated after removal.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRemoveModal(false)}
                disabled={removeStudentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveStudent}
                isLoading={removeStudentMutation.isPending}
              >
                Remove Student
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </SchoolLayout>
  );
};

export default BatchDetails;
