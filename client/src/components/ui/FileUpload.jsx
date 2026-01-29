import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../utils/helpers';

/**
 * FileUpload Component
 * Drag-and-drop file upload with validation and preview
 * Uses react-dropzone for drag-drop functionality
 */
const FileUpload = ({
  onFileSelect,
  accept = {},
  maxSize = 20 * 1024 * 1024, // 20MB default
  multiple = false,
  label = '',
  helperText = '',
  error = '',
  disabled = false,
  className = '',
  showPreview = true,
}) => {
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setUploadError('');

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setUploadError(`File is too large. Maximum size is ${formatFileSize(maxSize)}`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setUploadError('Invalid file type. Please check the accepted formats.');
        } else {
          setUploadError('File upload failed. Please try again.');
        }
        return;
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const filesWithPreview = acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        );

        setFiles(filesWithPreview);

        // Call parent handler
        if (onFileSelect) {
          onFileSelect(multiple ? filesWithPreview : filesWithPreview[0]);
        }
      }
    },
    [maxSize, multiple, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Remove file
  const removeFile = (fileToRemove) => {
    const newFiles = files.filter((file) => file !== fileToRemove);
    setFiles(newFiles);
    URL.revokeObjectURL(fileToRemove.preview);

    if (onFileSelect) {
      onFileSelect(multiple ? newFiles : null);
    }
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const displayError = error || uploadError;

  return (
    <div className={cn('form-group', className)}>
      {/* Label */}
      {label && <label className="form-label">{label}</label>}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary-500 bg-primary-50',
          !isDragActive && !displayError && 'border-gray-300 hover:border-primary-400',
          displayError && 'border-red-500 bg-red-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        {/* Upload Icon */}
        <div className="flex justify-center mb-4">
          <svg
            className={cn(
              'w-12 h-12',
              isDragActive ? 'text-primary-600' : 'text-gray-400'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Upload Text */}
        <div className="space-y-1">
          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop the file here...</p>
          ) : (
            <>
              <p className="text-gray-700">
                <span className="font-medium text-primary-600">Click to upload</span> or drag and
                drop
              </p>
              {helperText && <p className="text-sm text-gray-500">{helperText}</p>}
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="form-error" role="alert">
          {displayError}
        </p>
      )}

      {/* File Preview */}
      {showPreview && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file);
                }}
                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                aria-label="Remove file"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
