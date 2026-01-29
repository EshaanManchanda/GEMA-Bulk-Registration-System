import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useMediaList, useUploadMedia, useDeleteMedia, useBulkDeleteMedia } from '../../../hooks/useMedia';
import { Card, Input, Select, Button, Spinner, EmptyState, Pagination, Modal } from '../../../components/ui';
import { showError, showSuccess } from '../../../components/common/Toast';
import { formatDate, formatFileSize } from '../../../utils/helpers';
import {
  FiUpload, FiTrash2, FiDownload, FiX, FiImage, FiCheckSquare, FiSquare,
  FiSearch, FiFilter, FiCopy
} from 'react-icons/fi';

/**
 * Media Library Page
 * WordPress-style media management with grid layout
 */
const MediaLibrary = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 24,
    file_type: '',
    search: '',
    tags: '',
    sort: '-uploaded_at'
  });

  const [selectedMedia, setSelectedMedia] = useState(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadFolder, setUploadFolder] = useState('media');
  const [uploadTags, setUploadTags] = useState('');

  const { data, isLoading, refetch } = useMediaList(filters);
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const bulkDeleteMedia = useBulkDeleteMedia();

  const media = data?.media || [];
  const pagination = data?.pagination || {};

  // Handlers
  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFileTypeChange = (e) => {
    setFilters({ ...filters, file_type: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

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
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      showError('No files selected');
      return;
    }

    try {
      await uploadMedia.mutateAsync({
        files: uploadFiles,
        folder: uploadFolder,
        tags: uploadTags
      });
      showSuccess(`${uploadFiles.length} file(s) uploaded successfully!`);
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadTags('');
      refetch();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload files');
    }
  };

  const handleMediaClick = (mediaItem) => {
    setCurrentMedia(mediaItem);
    setShowDetailModal(true);
  };

  const handleSelectMedia = (mediaId) => {
    const newSelected = new Set(selectedMedia);
    if (newSelected.has(mediaId)) {
      newSelected.delete(mediaId);
    } else {
      newSelected.add(mediaId);
    }
    setSelectedMedia(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMedia.size === media.length) {
      setSelectedMedia(new Set());
    } else {
      setSelectedMedia(new Set(media.map(m => m._id)));
    }
  };

  const handleDeleteSingle = async (mediaId, forceDelete = false) => {
    if (!forceDelete && !window.confirm('Delete this media file?')) return;

    try {
      await deleteMedia.mutateAsync({ mediaId, force: forceDelete });
      showSuccess('Media deleted successfully');
      refetch();
    } catch (error) {
      // Extract error message from multiple possible locations
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete media';

      // Check if media is in use (case-insensitive, multiple patterns)
      const isInUse =
        errorMsg.toLowerCase().includes('in use') ||
        errorMsg.toLowerCase().includes('currently used') ||
        errorMsg.includes('document(s)');

      if (isInUse && !forceDelete) {
        // Show force delete confirmation
        const confirmed = window.confirm(
          `${errorMsg}\n\nForce delete anyway? This will break references in documents.`
        );

        if (confirmed) {
          return handleDeleteSingle(mediaId, true);
        }
      } else {
        // Show error for other cases
        showError(errorMsg);
      }
    }
  };

  const handleBulkDelete = async (forceDelete = false) => {
    if (selectedMedia.size === 0) {
      showError('No media selected');
      return;
    }

    if (!forceDelete && !window.confirm(`Delete ${selectedMedia.size} selected file(s)?`)) return;

    try {
      await bulkDeleteMedia.mutateAsync({ mediaIds: Array.from(selectedMedia), force: forceDelete });
      showSuccess(`${selectedMedia.size} file(s) deleted successfully`);
      setSelectedMedia(new Set());
      refetch();
    } catch (error) {
      // Extract error message from multiple possible locations
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete media';

      // Check if media is in use (case-insensitive, multiple patterns)
      const isInUse =
        errorMsg.toLowerCase().includes('in use') ||
        errorMsg.toLowerCase().includes('currently used') ||
        errorMsg.includes('document(s)');

      if (isInUse && !forceDelete) {
        // Show force delete confirmation
        const confirmed = window.confirm(
          `${errorMsg}\n\nForce delete anyway? This will break references in documents.`
        );

        if (confirmed) {
          return handleBulkDelete(true);
        }
      } else {
        // Show error for other cases
        showError(errorMsg);
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="large" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all media files</p>
          </div>
          <div className="flex gap-3">
            {selectedMedia.size > 0 && (
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMedia.isLoading}
              >
                <FiTrash2 className="mr-2" />
                Delete Selected ({selectedMedia.size})
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <FiUpload className="mr-2" />
              Upload Media
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by filename, alt text, caption..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filters.file_type} onChange={handleFileTypeChange}>
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="pdf">PDFs</option>
                <option value="excel">Excel Files</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                {pagination.total || 0} file(s)
              </span>
            </div>
          </div>
        </Card>

        {/* Selection Controls */}
        {media.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {selectedMedia.size === media.length ? (
                <FiCheckSquare className="text-blue-600" />
              ) : (
                <FiSquare />
              )}
              {selectedMedia.size === media.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedMedia.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedMedia.size} selected
              </span>
            )}
          </div>
        )}

        {/* Media Grid */}
        {media.length === 0 ? (
          <EmptyState
            icon={<FiImage className="w-12 h-12" />}
            message="No Media Files"
            description="Upload your first media file to get started"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {media.map((item) => (
              <div
                key={item._id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedMedia.has(item._id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMedia(item._id);
                    }}
                    className="bg-white rounded p-1 shadow-md hover:bg-gray-50"
                  >
                    {selectedMedia.has(item._id) ? (
                      <FiCheckSquare className="text-blue-600" />
                    ) : (
                      <FiSquare className="text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Image Thumbnail */}
                <div
                  onClick={() => handleMediaClick(item)}
                  className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden"
                >
                  {item.file_type === 'image' ? (
                    <img
                      src={item.file_url}
                      alt={item.alt_text || item.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiImage className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* File Info */}
                <div className="p-2 bg-white">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {item.original_filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.file_size_formatted || formatFileSize(item.file_size)}
                  </p>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item.file_url);
                      showSuccess('URL copied to clipboard');
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Copy URL"
                  >
                    <FiCopy />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.file_url, '_blank');
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="View"
                  >
                    <FiDownload />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingle(item._id);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-red-50 text-red-600"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setUploadFiles([]);
            setUploadTags('');
          }}
          title="Upload Media"
          size="medium"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {uploadFiles.length} file(s) selected
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uploadFiles.map((file, idx) => (
                  <div key={idx} className="text-xs text-gray-700 flex justify-between">
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder (optional)
              </label>
              <Input
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                placeholder="media"
              />
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

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                }}
                disabled={uploadMedia.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={uploadMedia.isLoading}
              >
                {uploadMedia.isLoading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Detail Modal */}
        {currentMedia && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setCurrentMedia(null);
            }}
            title="Media Details"
            size="large"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4">
                {currentMedia.file_type === 'image' ? (
                  <img
                    src={currentMedia.file_url}
                    alt={currentMedia.alt_text || currentMedia.original_filename}
                    className="max-w-full max-h-96 object-contain"
                  />
                ) : (
                  <FiImage className="w-24 h-24 text-gray-400" />
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Filename</label>
                  <p className="text-sm text-gray-900 mt-1">{currentMedia.original_filename}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">File Type</label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">{currentMedia.file_type}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">File Size</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {currentMedia.file_size_formatted || formatFileSize(currentMedia.file_size)}
                  </p>
                </div>

                {currentMedia.dimensions && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dimensions</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {currentMedia.dimensions.width} × {currentMedia.dimensions.height}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Uploaded</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(currentMedia.uploaded_at)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">URL</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={currentMedia.file_url}
                      readOnly
                      className="flex-1 text-xs px-2 py-1 border rounded bg-gray-50"
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(currentMedia.file_url);
                        showSuccess('URL copied to clipboard');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {currentMedia.tags && currentMedia.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentMedia.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentMedia.used_in && currentMedia.used_in.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Used In</label>
                    <div className="mt-1 space-y-1">
                      {currentMedia.used_in.map((usage, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <span className="font-medium capitalize">{usage.type}:</span>
                          <span>{usage.name || usage.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentMedia.used_in && currentMedia.used_in.length === 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Used In</label>
                    <p className="text-xs text-gray-500 mt-1 italic">Not currently used in any content</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="primary"
                    onClick={() => window.open(currentMedia.file_url, '_blank')}
                    className="flex-1"
                  >
                    <FiDownload className="mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDeleteSingle(currentMedia._id);
                    }}
                    className="flex-1"
                  >
                    <FiTrash2 className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default MediaLibrary;
