import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { usePublicResultLookup } from '../../hooks/useResults';

const ResultLookup = () => {
  const { registrationId: paramRegId } = useParams();
  const [searchParams] = useSearchParams();
  const [inputRegId, setInputRegId] = useState(paramRegId || searchParams.get('id') || '');
  const [searchRegId, setSearchRegId] = useState(paramRegId || searchParams.get('id') || '');

  const { data, isLoading, error } = usePublicResultLookup(searchRegId);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputRegId.trim()) {
      setSearchRegId(inputRegId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Result Lookup</h1>
          <p className="text-center mt-2 text-primary-100">
            Enter your registration ID to view your results
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={inputRegId}
              onChange={(e) => setInputRegId(e.target.value)}
              placeholder="Enter Registration ID (e.g., GEMA-REG-XXXXX)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800">Registration Not Found</h3>
            <p className="text-red-600 mt-2">
              Please check your registration ID and try again.
            </p>
          </div>
        )}

        {/* Result */}
        {data?.registration && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Event Banner */}
            {data.registration.event?.banner && (
              <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800 relative">
                <img
                  src={data.registration.event.banner}
                  alt={data.registration.event.title}
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-2xl font-bold text-white">{data.registration.event.title}</h2>
                </div>
              </div>
            )}

            {/* Student Info */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Registration ID</p>
                <p className="text-lg font-mono font-bold text-gray-900">{data.registration.id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="text-lg font-semibold">{data.registration.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">School</p>
                  <p className="text-lg font-semibold">{data.registration.school}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="text-lg font-semibold">
                    {data.registration.grade}{data.registration.section ? `-${data.registration.section}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event</p>
                  <p className="text-lg font-semibold">{data.registration.event?.title}</p>
                </div>
              </div>

              {/* Results Section */}
              {data.registration.result ? (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-center mb-6">Results</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Score</p>
                      <p className="text-3xl font-bold text-primary-600">
                        {data.registration.result.score ?? '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Rank</p>
                      <p className="text-3xl font-bold text-primary-600">
                        {data.registration.result.rank ?? '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2">
                      <p className="text-sm text-gray-500">Award</p>
                      {data.registration.result.award ? (
                        <span className={`inline-block mt-2 px-4 py-2 rounded-full text-lg font-bold ${
                          data.registration.result.award === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          data.registration.result.award === 'Silver' ? 'bg-gray-200 text-gray-800' :
                          data.registration.result.award === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {data.registration.result.award}
                        </span>
                      ) : (
                        <p className="text-3xl font-bold text-gray-400">-</p>
                      )}
                    </div>
                  </div>

                  {data.registration.result.remarks && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Remarks</p>
                      <p className="text-blue-800">{data.registration.result.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-6 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-600">Results Not Yet Published</h3>
                  <p className="text-gray-500 mt-2">Please check back later.</p>
                </div>
              )}

              {/* Certificate Download */}
              {data.registration.certificateUrl && (
                <div className="border-t pt-6 mt-6 text-center">
                  <a
                    href={data.registration.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Certificate
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No search yet */}
        {!searchRegId && !isLoading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-600">Enter Registration ID</h3>
            <p className="text-gray-500 mt-2">
              Your registration ID was provided when you registered for the event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultLookup;
