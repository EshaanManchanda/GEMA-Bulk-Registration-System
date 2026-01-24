import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useTestCertificateConfig,
  useGenerateBatchCertificates,
  useBatchCertificates
} from '../../../hooks/useCertificates';

const CertificateManagement = () => {
  const { batchId } = useParams();
  const [testResult, setTestResult] = useState(null);

  const { data: certificatesData, isLoading, refetch } = useBatchCertificates(batchId);
  const testConfig = useTestCertificateConfig();
  const generateCertificates = useGenerateBatchCertificates();

  const handleTestConfig = async () => {
    try {
      const result = await testConfig.mutateAsync(certificatesData?.batch?.event?._id);
      setTestResult(result.data);
    } catch (error) {
      setTestResult({ error: error.response?.data?.message || 'Test failed' });
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Generate certificates for all students in this batch?')) return;

    try {
      await generateCertificates.mutateAsync(batchId);
      refetch();
    } catch (error) {
      alert(error.response?.data?.message || 'Generation failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const batch = certificatesData?.batch;
  const certificates = certificatesData?.certificates || [];
  const stats = certificatesData?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600 mt-1">
            Batch: {batch?.reference} | {batch?.event?.title}
          </p>
        </div>
        <Link to={`/admin/batches/${batch?.reference}`} className="btn-secondary">
          Back to Batch
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Students</p>
          <p className="text-2xl font-bold">{stats.total || certificates.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Generated</p>
          <p className="text-2xl font-bold text-green-600">{stats.generated || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleTestConfig}
            disabled={testConfig.isPending}
            className="btn-secondary"
          >
            {testConfig.isPending ? 'Testing...' : 'Test Configuration'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generateCertificates.isPending}
            className="btn-primary"
          >
            {generateCertificates.isPending ? 'Generating...' : 'Generate All Certificates'}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${testResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
            {testResult.error ? (
              <p className="text-red-700">{testResult.error}</p>
            ) : (
              <div>
                <p className="text-green-700 font-medium">Configuration is valid!</p>
                <p className="text-sm text-green-600 mt-1">
                  Template: {testResult.templateId || 'Default'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Certificates</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registration ID
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Result
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No registrations found for this batch
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{cert.student_name}</p>
                      <p className="text-xs text-gray-500">
                        Grade {cert.grade}{cert.section ? `-${cert.section}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {cert.registration_id}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cert.result?.award ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cert.result.award === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          cert.result.award === 'Silver' ? 'bg-gray-100 text-gray-800' :
                          cert.result.award === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {cert.result.award}
                        </span>
                      ) : cert.result?.score !== undefined ? (
                        <span className="text-sm">{cert.result.score}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cert.certificate_url ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Generated
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cert.certificate_url ? (
                        <a
                          href={cert.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CertificateManagement;
