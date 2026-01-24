import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUploadResults, useDownloadResultsTemplate, useEventResults } from '../../../hooks/useResults';
import { useAdminEventDetails } from '../../../hooks/useAdmin';

const ResultUpload = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const { data: eventData, isLoading: eventLoading } = useAdminEventDetails(eventId);
  const { data: resultsData } = useEventResults(eventId, { limit: 1 });
  const uploadMutation = useUploadResults();
  const downloadTemplate = useDownloadResultsTemplate();

  const event = eventData?.event;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadResult(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const result = await uploadMutation.mutateAsync({ eventId, file });
      setUploadResult(result.data);
      setFile(null);
    } catch (error) {
      setUploadResult({ error: error.response?.data?.message || 'Upload failed' });
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate.mutate(eventId);
  };

  if (eventLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Upload Results</h1>
          <p className="text-gray-600 mt-1">{event?.title}</p>
        </div>
        <Link
          to={`/admin/events/${eventId}/results`}
          className="btn-secondary"
        >
          View Results
        </Link>
      </div>

      {/* Stats */}
      {resultsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Registrations</p>
            <p className="text-2xl font-bold">{resultsData.stats.totalRegistrations || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">With Results</p>
            <p className="text-2xl font-bold text-green-600">{resultsData.stats.withResults || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(resultsData.stats.totalRegistrations || 0) - (resultsData.stats.withResults || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Results CSV</h2>

        {/* Download Template */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            Download the template with all confirmed registrations, then fill in the results.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary text-sm"
            disabled={downloadTemplate.isPending}
          >
            {downloadTemplate.isPending ? 'Downloading...' : 'Download Template CSV'}
          </button>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0 file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
          )}
        </div>

        {/* CSV Format Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">CSV Format:</p>
          <code className="text-xs bg-gray-200 px-2 py-1 rounded">
            registration_id, student_name, grade, section, score, rank, award, remarks
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Only registration_id is required. score, rank, award, remarks are optional.
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="btn-primary"
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Results'}
        </button>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`mt-4 p-4 rounded-lg ${uploadResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
            {uploadResult.error ? (
              <p className="text-red-700">{uploadResult.error}</p>
            ) : (
              <div>
                <p className="text-green-700 font-medium">Upload successful!</p>
                <p className="text-sm text-green-600 mt-1">
                  Updated: {uploadResult.summary?.updated} / {uploadResult.summary?.total} registrations
                </p>
                {uploadResult.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-700">Warnings:</p>
                    <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside">
                      {uploadResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>...and {uploadResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultUpload;
