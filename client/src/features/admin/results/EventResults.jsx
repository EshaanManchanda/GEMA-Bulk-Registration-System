import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventResults, useUpdateResult, useClearEventResults } from '../../../hooks/useResults';
import { useAdminEventDetails } from '../../../hooks/useAdmin';

const EventResults = () => {
  const { eventId } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hasResult, setHasResult] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: eventData, isLoading: eventLoading } = useAdminEventDetails(eventId);
  const event = eventData?.event;
  const { data, isLoading, refetch } = useEventResults(eventId, {
    page,
    limit: 25,
    search: search || undefined,
    hasResult: hasResult || undefined,
  });

  const updateMutation = useUpdateResult();
  const clearMutation = useClearEventResults();

  const handleEdit = (reg) => {
    setEditingId(reg._id);
    setEditData({
      score: reg.result?.score || '',
      rank: reg.result?.rank || '',
      award: reg.result?.award || '',
      remarks: reg.result?.remarks || '',
    });
  };

  const handleSave = async (regId) => {
    try {
      await updateMutation.mutateAsync({
        registrationId: regId,
        resultData: {
          score: editData.score ? parseFloat(editData.score) : null,
          rank: editData.rank ? parseInt(editData.rank) : null,
          award: editData.award || null,
          remarks: editData.remarks || null,
        },
      });
      setEditingId(null);
      refetch();
    } catch (error) {
      alert('Failed to update result');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL results for this event? This cannot be undone.')) {
      return;
    }
    try {
      await clearMutation.mutateAsync(eventId);
      refetch();
    } catch (error) {
      alert('Failed to clear results');
    }
  };

  if (eventLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Results</h1>
          <p className="text-gray-600 mt-1">{event?.title}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/events/${eventId}/results/upload`} className="btn-primary">
            Upload Results
          </Link>
          <button onClick={handleClearAll} className="btn-danger" disabled={clearMutation.isPending}>
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold">{data.stats.totalRegistrations || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">With Results</p>
            <p className="text-xl font-bold text-green-600">{data.stats.withResults || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Avg Score</p>
            <p className="text-xl font-bold">{data.stats.avgScore?.toFixed(1) || '-'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Gold</p>
            <p className="text-xl font-bold text-yellow-600">{data.stats.goldCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-600">Silver</p>
            <p className="text-xl font-bold text-gray-500">{data.stats.silverCount || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1 min-w-[200px]"
          />
          <select
            value={hasResult}
            onChange={(e) => setHasResult(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All</option>
            <option value="true">With Results</option>
            <option value="false">Without Results</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Award</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.registrations?.map((reg) => (
                <tr key={reg._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{reg.registration_id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{reg.student_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{reg.school_id?.name}</td>
                  <td className="px-4 py-3 text-sm">{reg.grade}{reg.section ? `-${reg.section}` : ''}</td>

                  {editingId === reg._id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editData.score}
                          onChange={(e) => setEditData({ ...editData, score: e.target.value })}
                          className="w-16 px-2 py-1 text-sm border rounded"
                          placeholder="Score"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editData.rank}
                          onChange={(e) => setEditData({ ...editData, rank: e.target.value })}
                          className="w-16 px-2 py-1 text-sm border rounded"
                          placeholder="Rank"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editData.award}
                          onChange={(e) => setEditData({ ...editData, award: e.target.value })}
                          className="w-20 px-2 py-1 text-sm border rounded"
                        >
                          <option value="">None</option>
                          <option value="Gold">Gold</option>
                          <option value="Silver">Silver</option>
                          <option value="Bronze">Bronze</option>
                          <option value="Merit">Merit</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editData.remarks}
                          onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                          className="w-32 px-2 py-1 text-sm border rounded"
                          placeholder="Remarks"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleSave(reg._id)}
                          className="text-green-600 hover:text-green-800 mr-2"
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-center">{reg.result?.score ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{reg.result?.rank ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {reg.result?.award && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${reg.result.award === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                              reg.result.award === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                reg.result.award === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                            }`}>
                            {reg.result.award}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{reg.result?.remarks || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEdit(reg)}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
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

export default EventResults;
