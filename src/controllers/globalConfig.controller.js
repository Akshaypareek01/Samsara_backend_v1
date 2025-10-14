import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get global configuration
 * @returns {Object} Global configuration object
 */
const getGlobalConfig = catchAsync(async (req, res) => {
  const globalConfig = {
    email: "support@samsarawellness.in",
    whatsappnumber: "8660686699",
    mobilenumber: "8660686699",
    link: "https://samsarawellness.in/contact-us/",
    emailEnabled: true,
    whatsappEnabled: true,
    linkEnabled: false,
    mobilenumberEnabled: false
  };

  res.status(httpStatus.OK).json(globalConfig);
});

export { getGlobalConfig };
