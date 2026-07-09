import httpStatus from 'http-status';
import R2Service from '../services/r2.service.js';
import ApiError from '../utils/ApiError.js';
import { validateUploadFile } from '../utils/uploadImageUtils.js';

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
    const result = await R2Service.uploadFile(buffer, originalname, mimetype);

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
