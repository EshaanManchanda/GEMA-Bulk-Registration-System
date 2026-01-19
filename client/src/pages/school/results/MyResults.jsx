import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyResults } from '../../../hooks/useResults';

const MyResults = () => {
  const [page, setPage] = useState(1);
  const [hasResult, setHasResult] = useState('');

  const { data, isLoading } = useMyResults({
    page,
    limit: 25,
    hasResult: hasResult || undefined,
  });

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
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-600 mt-1">View results for your registered students</p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold">{data.stats.totalStudents || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Results Published</p>
            <p className="text-2xl font-bold text-green-600">{data.stats.withResults || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Certificates Available</p>
            <p className="text-2xl font-bold text-primary-600">{data.stats.withCertificates || 0}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={hasResult}
          onChange={(e) => setHasResult(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Students</option>
          <option value="true">With Results</option>
          <option value="false">Awaiting Results</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Award</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Certificate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.registrations?.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                data?.registrations?.map((reg) => (
                  <tr key={reg._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{reg.registration_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{reg.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <Link
                        to={`/school/events/${reg.event_id?._id}`}
                        className="hover:text-primary-600"
                      >
                        {reg.event_id?.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{reg.grade}{reg.section ? `-${reg.section}` : ''}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {reg.result?.score ?? <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {reg.result?.rank ?? <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {reg.result?.award ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          reg.result.award === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          reg.result.award === 'Silver' ? 'bg-gray-100 text-gray-800' :
                          reg.result.award === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {reg.result.award}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {reg.certificate_url ? (
                        <a
                          href={reg.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
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
    </div>
  );
};

export default MyResults;
