import React, { useState } from 'react';
import { useMediaList, useUploadMedia } from '@/hooks/useMedia';
import { Modal, Button, Input, Spinner, EmptyState } from '@/components/ui';
import { showError, showSuccess } from '@/components/common/Toast';
import { formatFileSize } from '@/utils/helpers';
import {
  FiUpload, FiX, FiImage, FiSearch, FiCheckCircle
} from 'react-icons/fi';

/**
 * MediaPicker Component
 * Reusable media selector for forms
 *
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close handler
 * @param {function} onSelect - Callback with selected media object
 * @param {string} selectedUrl - Currently selected media URL (optional)
 * @param {boolean} allowUpload - Allow uploading new files
 * @param {array} acceptTypes - Accepted file types ['image', 'pdf', etc]
 */
const MediaPicker = ({
  isOpen,
  onClose,
  onSelect,
  selectedUrl = null,
  allowUpload = true,
  acceptTypes = ['image']
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTags, setUploadTags] = useState('');

  const { data, isLoading, refetch } = useMediaList({
    page,
    limit: 18,
    search,
    file_type: acceptTypes.length === 1 ? acceptTypes[0] : ''
  });

  const uploadMedia = useUploadMedia();

  const media = data?.media || [];
  const pagination = data?.pagination || {};

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      showError('Maximum 10 files allowed per upload');
      return;
    }

    const invalidFiles = files.filter(f => f.size > 20 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      showError(`Some files are too large. Max size is 20MB.`);
      return;
    }

    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      showError('No files selected');
      return;
    }

    try {
      const result = await uploadMedia.mutateAsync({
        files: uploadFiles,
        folder: 'media',
        tags: uploadTags
      });

      showSuccess(`${uploadFiles.length} file(s) uploaded successfully!`);
      setUploadFiles([]);
      setUploadTags('');
      setShowUploadSection(false);
      refetch();

      // Auto-select first uploaded file if single upload
      if (result.data.media.length === 1) {
        onSelect(result.data.media[0]);
        onClose();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload files');
    }
  };

  const handleMediaSelect = (mediaItem) => {
    onSelect(mediaItem);
    onClose();
  };

  const handleRemoveFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Media"
      size="large"
    >
      <div className="space-y-4">
        {/* Search and Upload Toggle */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {allowUpload && (
            <Button
              variant={showUploadSection ? "secondary" : "primary"}
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              <FiUpload className="mr-2" />
              {showUploadSection ? 'Browse' : 'Upload'}
            </Button>
          )}
        </div>

        {/* Upload Section */}
        {showUploadSection && allowUpload && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <input
                type="file"
                multiple
                accept={acceptTypes.includes('image') ? 'image/*' : '*'}
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 10 files, 20MB each
              </p>
            </div>

            {uploadFiles.length > 0 && (
              <>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                      <span className="truncate flex-1">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">{formatFileSize(file.size)}</span>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated, optional)
                  </label>
                  <Input
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="banner, event, promo"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setUploadFiles([]);
                      setUploadTags('');
                    }}
                    disabled={uploadMedia.isLoading}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={uploadMedia.isLoading}
                  >
                    {uploadMedia.isLoading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Media Grid */}
        {!showUploadSection && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="large" />
              </div>
            ) : media.length === 0 ? (
              <EmptyState
                icon={FiImage}
                title="No Media Files"
                description={search ? 'No results found' : 'Upload your first media file'}
              />
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2">
                {media.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleMediaSelect(item)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg ${selectedUrl === item.file_url
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    {/* Selected Indicator */}
                    {selectedUrl === item.file_url && (
                      <div className="absolute top-1 right-1 z-10 bg-blue-500 rounded-full p-1">
                        <FiCheckCircle className="text-white text-sm" />
                      </div>
                    )}

                    {/* Image Thumbnail */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.file_type === 'image' ? (
                        <img
                          src={item.file_url}
                          alt={item.alt_text || item.original_filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiImage className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Filename */}
                    <div className="p-1 bg-white">
                      <p className="text-xs text-gray-900 truncate">
                        {item.original_filename}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 pt-4 border-t">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {page} / {pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MediaPicker;
