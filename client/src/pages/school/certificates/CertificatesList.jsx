import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyCertificates, useDownloadCertificate } from '../../../hooks/useCertificates';

const CertificatesList = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyCertificates({ page, limit: 25 });
  const downloadCertificate = useDownloadCertificate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600 mt-1">Download certificates for your registered students</p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold">{data.stats.totalStudents || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">With Results</p>
            <p className="text-2xl font-bold text-blue-600">{data.stats.withResults || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Certificates Available</p>
            <p className="text-2xl font-bold text-green-600">{data.stats.totalCertificates || 0}</p>
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      {data?.registrations?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-600">No Certificates Yet</h3>
          <p className="text-gray-500 mt-2">
            Certificates will appear here once they are generated for your students.
          </p>
          <Link to="/school/results" className="btn-primary mt-4 inline-block">
            View Results
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.registrations?.map((reg) => (
            <div key={reg._id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Certificate Preview */}
              <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>

              {/* Certificate Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{reg.student_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{reg.event_id?.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Grade {reg.grade}{reg.section ? `-${reg.section}` : ''} | {reg.registration_id}
                </p>

                {/* Award Badge */}
                {reg.result?.award && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    reg.result.award === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                    reg.result.award === 'Silver' ? 'bg-gray-100 text-gray-800' :
                    reg.result.award === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {reg.result.award}
                  </span>
                )}

                {/* Download Button */}
                <button
                  onClick={() => downloadCertificate.mutate(reg.certificate_url)}
                  className="mt-4 w-full btn-primary text-sm flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">
            Page {data.pagination.page} of {data.pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pagination.pages}
              className="btn-secondary text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesList;
