import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiClient, ENDPOINTS } from '../../api';

const CertificateVerify = () => {
  const { certificateId: paramCertId } = useParams();
  const [searchParams] = useSearchParams();
  const [inputCertId, setInputCertId] = useState(paramCertId || searchParams.get('id') || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-verify if certificate ID is in URL
  useEffect(() => {
    if (paramCertId || searchParams.get('id')) {
      handleVerify();
    }
  }, []);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!inputCertId.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await apiClient.get(ENDPOINTS.CERTIFICATES.VERIFY(inputCertId));
      setVerificationResult({
        valid: true,
        certificate: response.data.data
      });
    } catch (error) {
      setVerificationResult({
        valid: false,
        message: error.response?.data?.message || 'Certificate not found or invalid'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Certificate Verification</h1>
          <p className="text-center mt-2 text-primary-100">
            Verify the authenticity of a GEMA Events certificate
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleVerify} className="flex gap-4">
            <input
              type="text"
              value={inputCertId}
              onChange={(e) => setInputCertId(e.target.value)}
              placeholder="Enter Certificate ID or Registration ID"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>

        {/* Loading */}
        {isVerifying && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying certificate...</p>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && !isVerifying && (
          <div className={`bg-white rounded-lg shadow overflow-hidden ${
            verificationResult.valid ? 'border-2 border-green-500' : 'border-2 border-red-500'
          }`}>
            {/* Status Banner */}
            <div className={`p-6 ${verificationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-center">
                {verificationResult.valid ? (
                  <>
                    <svg className="w-12 h-12 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h2 className="text-2xl font-bold text-green-800">Valid Certificate</h2>
                      <p className="text-green-600">This certificate is authentic and verified.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-red-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h2 className="text-2xl font-bold text-red-800">Invalid Certificate</h2>
                      <p className="text-red-600">This certificate could not be verified.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Certificate Details */}
            {verificationResult.valid && verificationResult.certificate && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Certificate Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="text-lg font-medium">
                      {verificationResult.certificate.student_name || verificationResult.certificate.studentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event</p>
                    <p className="text-lg font-medium">
                      {verificationResult.certificate.event?.title || verificationResult.certificate.event}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">School</p>
                    <p className="text-lg font-medium">
                      {verificationResult.certificate.school?.school_name || verificationResult.certificate.school}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Award</p>
                    <p className="text-lg font-medium">
                      {(verificationResult.certificate.result?.award || verificationResult.certificate.award) && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          (verificationResult.certificate.result?.award || verificationResult.certificate.award) === 'Gold'
                            ? 'bg-yellow-100 text-yellow-800' :
                          (verificationResult.certificate.result?.award || verificationResult.certificate.award) === 'Silver'
                            ? 'bg-gray-200 text-gray-800' :
                          (verificationResult.certificate.result?.award || verificationResult.certificate.award) === 'Bronze'
                            ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {verificationResult.certificate.result?.award || verificationResult.certificate.award}
                        </span>
                      )}
                    </p>
                  </div>
                  {verificationResult.certificate.registration_id && (
                    <div>
                      <p className="text-sm text-gray-500">Registration ID</p>
                      <p className="text-lg font-medium font-mono">{verificationResult.certificate.registration_id}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Issued On</p>
                    <p className="text-lg font-medium">
                      {new Date(
                        verificationResult.certificate.certificate_generated_at ||
                        verificationResult.certificate.issuedAt ||
                        verificationResult.certificate.createdAt
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!verificationResult && !isVerifying && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">How to Verify</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Enter the Certificate ID found at the bottom of the certificate</li>
              <li>Alternatively, enter the Registration ID</li>
              <li>Click "Verify" to check the certificate authenticity</li>
              <li>A valid certificate will display the student and event details</li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All GEMA Events certificates contain a unique ID that can be used
                for verification. If you have concerns about a certificate's authenticity, please contact us.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerify;
