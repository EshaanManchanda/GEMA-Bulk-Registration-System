import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useEventBySlug } from '../../../hooks/useEvents';
import { useDownloadTemplate, useValidateBatch, useUploadBatch } from '../../../hooks/useBatches';
import { Card, Button, Spinner, FileUpload, Badge, Table } from '../../../components/ui';
import Stepper from '../../../components/ui/Stepper';
import { formatCurrency } from '../../../utils/helpers';
import { showError, showSuccess } from '../../../components/common/Toast';
import { FILE_SIZE_LIMITS, ALLOWED_FILE_TYPES } from '../../../utils/constants';

/**
 * Batch Upload Page
 * Multi-step batch registration upload process
 */
const UploadBatch = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading: eventLoading } = useEventBySlug(slug);
  const downloadTemplate = useDownloadTemplate();
  const validateBatch = useValidateBatch();
  const uploadBatch = useUploadBatch();

  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationId, setValidationId] = useState(null);

  const steps = [
    { label: 'Download Template', description: 'Get CSV template' },
    { label: 'Upload & Validate', description: 'Upload your file' },
    { label: 'Preview Data', description: 'Review students' },
    { label: 'Confirm & Submit', description: 'Complete registration' },
  ];

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate.mutateAsync(slug);
      showSuccess('Template downloaded! Fill it and come back to upload.');
      setCurrentStep(1);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to download template');
    }
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setValidationResult(null);
    setValidationErrors([]);
  };

  const handleValidate = async () => {
    if (!uploadedFile) {
      showError('Please select a file to upload');
      return;
    }

    try {
      const result = await validateBatch.mutateAsync({
        eventSlug: slug,
        file: uploadedFile,
      });

      // Result is already unwrapped by the mutation hook
      if (result.valid) {
        setValidationResult(result);
        setValidationErrors([]);
        setValidationId(result.validation_id);
        showSuccess(`Validation successful! ${result.summary?.valid || 0} students ready to register.`);
        setCurrentStep(2);
      } else {
        setValidationResult(result);
        setValidationErrors(result.errors || []);
        showError(`Validation failed with ${result.summary?.invalid || result.errors?.length || 0} errors. Please fix and try again.`);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Validation failed');
      setValidationErrors(error.response?.data?.errors || []);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await uploadBatch.mutateAsync({
        eventSlug: slug,
        file: uploadedFile,
        validationId: validationId, // Pass validation ID for cache optimization
      });

      showSuccess('Batch uploaded successfully! Proceed to payment.');

      // Navigate to payment page with batch reference
      navigate(`/school/payments/make-payment?batch=${result.batch.batch_reference}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload batch');
    }
  };

  const handleDownloadErrors = () => {
    if (!validationErrors || validationErrors.length === 0) return;

    // Create CSV content
    const csvContent = [
      ['Row', 'Field', 'Error Message'].join(','),
      ...validationErrors.map(err =>
        [err.row, err.field || 'N/A', `"${err.message}"`].join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation-errors-${slug}-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateDiscount = () => {
    if (!validationResult || !event || !event.bulk_discount_rules) return 0;

    const numStudents = validationResult.students?.length || 0;
    let applicableDiscount = 0;

    event.bulk_discount_rules.forEach((rule) => {
      if (numStudents >= rule.min_students) {
        applicableDiscount = Math.max(applicableDiscount, rule.discount_percentage);
      }
    });

    return applicableDiscount;
  };

  const calculateTotal = () => {
    if (!validationResult || !event) return { subtotal: 0, discount: 0, total: 0 };

    const numStudents = validationResult.students?.length || 0;
    const feePerStudent = validationResult.currency === 'INR' ? event.base_fee_inr : event.base_fee_usd;
    const subtotal = numStudents * feePerStudent;
    const discountPercent = calculateDiscount();
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal - discountAmount;

    return { subtotal, discount: discountAmount, total, discountPercent };
  };

  if (eventLoading) {
    return (
      <SchoolLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </SchoolLayout>
    );
  }

  if (!event) {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <Link to="/school/events">
              <Button variant="primary">Back to Events</Button>
            </Link>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  const totals = calculateTotal();

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/school/events/${slug}`} className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Registration Batch</h1>
            <p className="text-gray-600 mt-1">{event.name}</p>
          </div>
        </div>

        {/* Stepper */}
        <Stepper steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 0: Download Template */}
          {currentStep === 0 && (
            <Card>
              <Card.Header>
                <Card.Title>Step 1: Download Excel Template</Card.Title>
                <Card.Description>
                  Download the template, fill in student details, and return to upload
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Template Instructions:</p>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      <li>Download the CSV template for {event.name}</li>
                      <li>Fill in all required student information</li>
                      <li>Do not modify column headers</li>
                      <li>Ensure all data follows the format specified</li>
                      <li>Save the file and return here to upload</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      onClick={handleDownloadTemplate}
                      loading={downloadTemplate.isPending}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      }
                    >
                      Download Template
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Skip (I have the template)
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Step 1: Upload & Validate */}
          {currentStep === 1 && (
            <Card>
              <Card.Header>
                <Card.Title>Step 2: Upload & Validate File</Card.Title>
                <Card.Description>Upload your filled Excel or CSV file for validation</Card.Description>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    accept={{
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                      'application/vnd.ms-excel': ['.xls', '.xlsx'],
                      'text/csv': ['.csv'],
                      'text/plain': ['.csv'],
                      'application/csv': ['.csv'],
                    }}
                    maxSize={FILE_SIZE_LIMITS.SPREADSHEET}
                    label="Upload Excel or CSV File"
                    helperText="Supported formats: .xlsx, .csv (max 10MB)"
                  />

                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium text-red-900">
                          Validation Errors ({validationErrors.length})
                        </p>
                        {validationErrors.length > 0 && (
                          <button
                            onClick={handleDownloadErrors}
                            className="text-xs text-red-700 hover:text-red-900 underline"
                          >
                            Download Error Report
                          </button>
                        )}
                      </div>

                      {validationResult?.error_report?.most_common_errors && (
                        <div className="mb-3 p-2 bg-red-100 rounded">
                          <p className="text-xs font-medium text-red-900 mb-1">Most Common Issues:</p>
                          <div className="flex flex-wrap gap-2">
                            {validationResult.error_report.most_common_errors.map((err, idx) => (
                              <span key={idx} className="text-xs bg-red-200 px-2 py-1 rounded">
                                {err.field}: {err.count} errors
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="max-h-60 overflow-y-auto">
                        <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>
                              <strong>Row {error.row}</strong>
                              {error.field && <>, {error.field}</>}: {error.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleValidate}
                      loading={validateBatch.isPending}
                      disabled={!uploadedFile}
                    >
                      Validate File
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Step 2: Preview Data */}
          {currentStep === 2 && validationResult && (
            <Card>
              <Card.Header>
                <Card.Title>Step 3: Preview Student Data</Card.Title>
                <Card.Description>Review the students before submitting</Card.Description>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {validationResult.students?.length || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600 mb-1">Fee Per Student</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(
                          validationResult.currency === 'INR' ? event.base_fee_inr : event.base_fee_usd,
                          validationResult.currency
                        )}
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">Currency</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {validationResult.currency}
                      </p>
                    </div>
                  </div>

                  {/* Students Table - First 10 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Student List (showing first 10 of {validationResult.students?.length})
                    </p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Additional Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.students?.slice(0, 10).map((student, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{student.student_name || 'N/A'}</td>
                              <td>{student.grade}{student.section ? ` - ${student.section}` : ''}</td>
                              <td className="text-xs text-gray-500">
                                {Object.keys(student).length - 2} more fields
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {validationResult.students?.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">
                        + {validationResult.students.length - 10} more students
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button variant="primary" onClick={() => setCurrentStep(3)}>
                      Continue to Confirmation
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Step 3: Confirm & Submit */}
          {currentStep === 3 && validationResult && (
            <Card>
              <Card.Header>
                <Card.Title>Step 4: Confirm & Submit</Card.Title>
                <Card.Description>Review the final details and submit your registration</Card.Description>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {/* Cost Breakdown */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-700">
                        <span>{validationResult.students?.length} students × {formatCurrency(
                          validationResult.currency === 'INR' ? event.base_fee_inr : event.base_fee_usd,
                          validationResult.currency
                        )}</span>
                        <span>{formatCurrency(totals.subtotal, validationResult.currency)}</span>
                      </div>
                      {totals.discountPercent > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Bulk Discount ({totals.discountPercent}%)</span>
                          <span>-{formatCurrency(totals.discount, validationResult.currency)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold text-lg text-gray-900">
                        <span>Total Amount</span>
                        <span>{formatCurrency(totals.total, validationResult.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Next Steps:</p>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                      <li>Submit your registration batch</li>
                      <li>You'll be redirected to payment</li>
                      <li>Complete payment to confirm registration</li>
                      <li>Receive confirmation email with invoice</li>
                    </ol>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      loading={uploadBatch.isPending}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    >
                      Submit & Proceed to Payment
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </SchoolLayout>
  );
};

export default UploadBatch;
