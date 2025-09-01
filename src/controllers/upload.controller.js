import httpStatus from 'http-status';
import R2Service from '../services/r2.service.js';
import ApiError from '../utils/ApiError.js';

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const { buffer, originalname, mimetype } = req.file;
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
