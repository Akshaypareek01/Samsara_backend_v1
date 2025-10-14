import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get global configuration
 * @returns {Object} Global configuration object
 */
const getGlobalConfig = catchAsync(async (req, res) => {
  const globalConfig = {
    email: "support@gmail.com",
    whatsappnumber: "9898989898",
    mobilenumber: "999999999",
    link: "https://support.com",
    emailEnabled: true,
    whatsappEnabled: true,
    linkEnabled: true,
    mobilenumberEnabled: true
  };

  res.status(httpStatus.OK).json(globalConfig);
});

export { getGlobalConfig };
