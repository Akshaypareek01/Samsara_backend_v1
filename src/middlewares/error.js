import mongoose from 'mongoose';
import httpStatus from 'http-status';
import config from '../config/config.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    if (err.name === 'MulterError') {
      const isTooLarge = err.code === 'LIMIT_FILE_SIZE';
      const statusCode = isTooLarge ? httpStatus.REQUEST_ENTITY_TOO_LARGE : httpStatus.BAD_REQUEST;
      const message = isTooLarge ? 'File too large. Maximum size is 25MB.' : err.message || 'Upload failed';
      error = new ApiError(statusCode, message, true, err.stack);
    } else {
      // Precedence matters: keep the error's own status when it has one,
      // otherwise map mongoose validation/cast errors to 400 and the rest to 500.
      let statusCode = error.statusCode;
      if (!statusCode) {
        statusCode = error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
      }
      const message = error.message || httpStatus[statusCode];
      error = new ApiError(statusCode, message, false, err.stack);
    }
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  // Log in every environment — production had no error visibility at all.
  // The stack stays out of the response body (see `response` above).
  logger.error(
    `${req.method} ${req.originalUrl} ${statusCode} - ${err.message}${err.stack ? `\n${err.stack}` : ''}`
  );

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
