/** Browser-safe image MIME types accepted by the upload API. */
export const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Browser-safe image file extensions accepted by the upload API. */
export const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

/** Explicitly blocked formats that may upload but fail to render in browsers. */
const BLOCKED_IMAGE_MIME_TYPES = new Set(['image/heic', 'image/heif']);
const BLOCKED_IMAGE_EXTENSIONS = new Set(['heic', 'heif']);

/**
 * Extract lowercase file extension from a filename.
 *
 * @param {string} fileName - Original upload filename.
 * @returns {string} Extension without dot, or empty string.
 */
export const getImageFileExtension = (fileName) => {
  const match = String(fileName || '')
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
};

/**
 * Whether an uploaded image uses a browser-safe format.
 *
 * @param {string} mimeType - Multer-provided MIME type.
 * @param {string} originalFilename - Original upload filename.
 * @returns {boolean}
 */
export const isAllowedImageUpload = (mimeType, originalFilename) => {
  const mime = String(mimeType || '').toLowerCase();
  const extension = getImageFileExtension(originalFilename);

  if (BLOCKED_IMAGE_MIME_TYPES.has(mime) || BLOCKED_IMAGE_EXTENSIONS.has(extension)) {
    return false;
  }

  if (mime && ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    return true;
  }

  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
};

/** User-facing list of supported image formats. */
export const ALLOWED_IMAGE_FORMATS_LABEL = 'JPG, PNG, or WebP';

/** MIME types allowed for non-image document uploads on the shared upload endpoint. */
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set(['application/pdf']);

/** File extensions allowed for non-image document uploads. */
export const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['pdf']);

/**
 * Whether the upload looks like an image rather than a document.
 *
 * @param {string} mimeType - Multer-provided MIME type.
 * @param {string} originalFilename - Original upload filename.
 * @returns {boolean}
 */
export const isImageUploadCandidate = (mimeType, originalFilename) => {
  const mime = String(mimeType || '').toLowerCase();
  const extension = getImageFileExtension(originalFilename);

  if (mime.startsWith('image/')) {
    return true;
  }

  return (
    ALLOWED_IMAGE_EXTENSIONS.has(extension) ||
    BLOCKED_IMAGE_EXTENSIONS.has(extension) ||
    extension === 'gif' ||
    extension === 'bmp' ||
    extension === 'svg'
  );
};

/**
 * Whether an uploaded document uses an allowed non-image format.
 *
 * @param {string} mimeType - Multer-provided MIME type.
 * @param {string} originalFilename - Original upload filename.
 * @returns {boolean}
 */
export const isAllowedDocumentUpload = (mimeType, originalFilename) => {
  const mime = String(mimeType || '').toLowerCase();
  const extension = getImageFileExtension(originalFilename);
  return ALLOWED_DOCUMENT_MIME_TYPES.has(mime) || ALLOWED_DOCUMENT_EXTENSIONS.has(extension);
};

/**
 * Validate an uploaded image before storing in R2.
 *
 * @param {string} mimeType - Multer-provided MIME type.
 * @param {string} originalFilename - Original upload filename.
 * @returns {string|null} Error message or null when valid.
 */
export const validateImageUpload = (mimeType, originalFilename) => {
  if (!isAllowedImageUpload(mimeType, originalFilename)) {
    return `Only ${ALLOWED_IMAGE_FORMATS_LABEL} images are supported. HEIC and other formats cannot be displayed.`;
  }
  return null;
};

/**
 * Validate an uploaded file before storing in R2.
 *
 * @param {string} mimeType - Multer-provided MIME type.
 * @param {string} originalFilename - Original upload filename.
 * @returns {string|null} Error message or null when valid.
 */
export const validateUploadFile = (mimeType, originalFilename) => {
  if (isAllowedDocumentUpload(mimeType, originalFilename)) {
    return null;
  }

  if (isImageUploadCandidate(mimeType, originalFilename)) {
    return validateImageUpload(mimeType, originalFilename);
  }

  return `Unsupported file type. Upload ${ALLOWED_IMAGE_FORMATS_LABEL} images or PDF documents only.`;
};
