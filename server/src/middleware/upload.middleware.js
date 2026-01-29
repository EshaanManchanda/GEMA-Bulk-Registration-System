const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler.middleware');
const { ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } = require('../utils/constants');

/**
 * Sanitize filename to prevent path traversal and special characters
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};

/**
 * Disk storage configuration for local file storage
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Base upload directory - files will be moved to proper subdirectories by storage service
    const baseDir = path.join(__dirname, '../../uploads');
    cb(null, baseDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(file.originalname);
    const uniqueName = `${timestamp}-${sanitized}`;
    cb(null, uniqueName);
  }
});

/**
 * Memory storage configuration for Cloudinary upload
 */
const memoryStorage = multer.memoryStorage();

/**
 * Select storage based on MEDIA_PROVIDER environment variable
 * - 'local' uses disk storage
 * - 'cloudinary' (default) uses memory storage
 */
const storage = process.env.MEDIA_PROVIDER === 'local' ? diskStorage : memoryStorage;

/**
 * File filter for CSV files
 */
const csvFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.csv.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only CSV files (.csv) are allowed.', 400), false);
  }
};

/**
 * File filter for Excel files (.xlsx)
 */
const excelFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.excel.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only Excel files (.xlsx) are allowed.', 400), false);
  }
};

/**
 * File filter for spreadsheet files (CSV or Excel)
 */
const spreadsheetFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.spreadsheet.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only Excel (.xlsx) or CSV (.csv) files are allowed.', 400), false);
  }
};

/**
 * File filter for image files
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.image.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.', 400), false);
  }
};

/**
 * File filter for PDF files
 */
const pdfFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.pdf.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF files are allowed.', 400), false);
  }
};

/**
 * CSV file upload configuration
 */
const uploadCSV = multer({
  storage: memoryStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.csv
  }
}).single('csv_file');

/**
 * Excel file upload configuration
 */
const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.excel
  }
}).single('excel_file');

/**
 * Spreadsheet file upload (Excel or CSV) - primary for bulk registration
 */
const uploadSpreadsheet = multer({
  storage: memoryStorage,
  fileFilter: spreadsheetFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.spreadsheet
  }
}).single('file');

/**
 * Image file upload configuration (for receipts, banners, etc.)
 */
const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image
  }
}).single('image');

/**
 * Multiple images upload
 */
const uploadImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image
  }
}).array('images', 5); // Max 5 images

/**
 * Media library upload (up to 10 images)
 * Always use memory storage so buffer is available for both cloudinary and local storage
 */
const uploadMediaLibrary = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.image.includes(file.mimetype) || ALLOWED_MIME_TYPES.pdf.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only images and PDFs are allowed.', 400), false);
    }
  },
  limits: {
    fileSize: FILE_SIZE_LIMITS.image // Using the larger 20MB limit
  }
}).array('files', 10);

/**
 * PDF file upload configuration
 */
const uploadPDF = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.pdf
  }
}).single('pdf_file');

/**
 * Receipt upload (image)
 * Always use memory storage to ensure buffer is available for storage services
 */
const uploadReceipt = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image
  }
}).single('receipt');

/**
 * Error handler for Multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size is too large. Please check the file size limit.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field name in file upload.', 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum is 5 files.', 400));
    }
    return next(new AppError(`File upload error: ${err.message}`, 400));
  }
  next(err);
};

/**
 * Validate uploaded file exists
 */
const validateFileExists = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded. Please select a file.', 400));
  }
  next();
};

/**
 * Validate uploaded files exist (for multiple files)
 */
const validateFilesExist = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded. Please select at least one file.', 400));
  }
  next();
};

module.exports = {
  uploadCSV,
  uploadExcel,
  uploadSpreadsheet,
  uploadImage,
  uploadImages,
  uploadMediaLibrary,
  uploadPDF,
  uploadReceipt,
  handleUploadError,
  validateFileExists,
  validateFilesExist,
  sanitizeFilename
};
