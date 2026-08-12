import httpStatus from 'http-status';
import R2Service from '../services/r2.service.js';
import ApiError from '../utils/ApiError.js';
import { validateUploadFile, resolveSafeContentType } from '../utils/uploadImageUtils.js';

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const { buffer, originalname, mimetype } = req.file;
    const imageValidationError = validateUploadFile(mimetype, originalname);
    if (imageValidationError) {
      throw new ApiError(httpStatus.BAD_REQUEST, imageValidationError);
    }

    // Never trust the client-supplied MIME type for the stored Content-Type —
    // the bucket is public, so a mismatched type becomes hosted content.
    const safeContentType = resolveSafeContentType(originalname);
    if (!safeContentType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported file extension.');
    }

    const result = await R2Service.uploadFile(buffer, originalname, safeContentType);

    res.status(httpStatus.OK).json({
      success: true,
      url: result.url,
      fileName: result.fileName,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadFile,
};
