import httpStatus from 'http-status';
import BloodReport from '../models/bloodReport.model.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';

/**
 * Create a blood report
 * @param {Object} bloodReportBody
 * @returns {Promise<BloodReport>}
 */
const createBloodReport = async (bloodReportBody) => {
  const bloodReport = await BloodReport.create(bloodReportBody);
  return bloodReport;
};

/**
 * Query for blood reports
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBloodReports = async (filter, options) => {
  const filterOptions = pick(options, ['sortBy', 'limit', 'page']);
  const sortBy = filterOptions.sortBy || 'reportDate';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;

  // Build date range filter
  if (options.startDate || options.endDate) {
    filter.reportDate = {};
    if (options.startDate) {
      filter.reportDate.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      filter.reportDate.$lte = new Date(options.endDate);
    }
  }

  const sort = { [sortBy]: sortOrder };
  
  const bloodReports = await BloodReport.find(filter)
    .populate('userId', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();

  const totalResults = await BloodReport.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: bloodReports,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Get blood report by id
 * @param {ObjectId} id
 * @returns {Promise<BloodReport>}
 */
const getBloodReportById = async (id) => {
  const bloodReport = await BloodReport.findById(id).populate('userId', 'name email');
  if (!bloodReport) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blood report not found');
  }
  return bloodReport;
};

/**
 * Get blood reports by user id
 * @param {ObjectId} userId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getBloodReportsByUserId = async (userId, options = {}) => {
  const filter = { userId };
  return queryBloodReports(filter, options);
};

/**
 * Update blood report by id
 * @param {ObjectId} bloodReportId
 * @param {Object} updateBody
 * @returns {Promise<BloodReport>}
 */
const updateBloodReportById = async (bloodReportId, updateBody) => {
  const bloodReport = await getBloodReportById(bloodReportId);
  
  // Check if user has permission to update this report
  if (updateBody.userId && updateBody.userId.toString() !== bloodReport.userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this blood report');
  }

  Object.assign(bloodReport, updateBody);
  await bloodReport.save();
  return bloodReport;
};

/**
 * Delete blood report by id
 * @param {ObjectId} bloodReportId
 * @param {ObjectId} userId - User making the request
 * @returns {Promise<BloodReport>}
 */
const deleteBloodReportById = async (bloodReportId, userId) => {
  const bloodReport = await getBloodReportById(bloodReportId);
  
  // Check if user has permission to delete this report
  if (bloodReport.userId.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this blood report');
  }

  await bloodReport.deleteOne();
  return bloodReport;
};

/**
 * Get blood report statistics for a user
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getBloodReportStats = async (userId) => {
  const stats = await BloodReport.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        completedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingReports: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        reviewedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
        },
        latestReportDate: { $max: '$reportDate' },
        earliestReportDate: { $min: '$reportDate' }
      }
    }
  ]);

  const bloodGroupStats = await BloodReport.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$bloodGroup',
        count: { $sum: 1 }
      }
    }
  ]);

  const labStats = await BloodReport.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$labName',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return {
    ...stats[0],
    bloodGroupDistribution: bloodGroupStats,
    topLabs: labStats
  };
};

/**
 * Get blood report trends for a specific test category
 * @param {ObjectId} userId
 * @param {string} testCategory
 * @param {string} parameter
 * @param {Object} options
 * @returns {Promise<Array>}
 */
const getBloodReportTrends = async (userId, testCategory, parameter, options = {}) => {
  const matchStage = {
    userId: userId,
    [`testCategories.${testCategory}`]: { $exists: true }
  };

  if (options.startDate || options.endDate) {
    matchStage.reportDate = {};
    if (options.startDate) {
      matchStage.reportDate.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      matchStage.reportDate.$lte = new Date(options.endDate);
    }
  }

  const trends = await BloodReport.aggregate([
    { $match: matchStage },
    {
      $project: {
        reportDate: 1,
        value: `$testCategories.${testCategory}.${parameter}.value`,
        unit: `$testCategories.${testCategory}.${parameter}.unit`,
        normalRange: `$testCategories.${testCategory}.${parameter}.normalRange`
      }
    },
    { $sort: { reportDate: 1 } },
    { $limit: options.limit || 50 }
  ]);

  return trends;
};

/**
 * Search blood reports by lab name or doctor name
 * @param {string} searchTerm
 * @param {ObjectId} userId
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const searchBloodReports = async (searchTerm, userId, options = {}) => {
  const filter = {
    userId,
    $or: [
      { labName: { $regex: searchTerm, $options: 'i' } },
      { 'referringDoctor.name': { $regex: searchTerm, $options: 'i' } },
      { 'referringDoctor.specialization': { $regex: searchTerm, $options: 'i' } }
    ]
  };

  return queryBloodReports(filter, options);
};

/**
 * Get abnormal test results for a user
 * @param {ObjectId} userId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
const getAbnormalTestResults = async (userId, options = {}) => {
  const bloodReports = await BloodReport.find({ userId })
    .populate('userId', 'name email')
    .sort({ reportDate: -1 })
    .limit(options.limit || 20);

  const abnormalResults = [];

  bloodReports.forEach(report => {
    const testCategories = report.testCategories;
    const abnormalTests = [];

    // Check each test category for abnormal values
    Object.keys(testCategories).forEach(category => {
      const categoryData = testCategories[category];
      if (categoryData) {
        Object.keys(categoryData).forEach(parameter => {
          const paramData = categoryData[parameter];
          if (paramData && typeof paramData === 'object' && paramData.value !== undefined) {
            // This is a simplified check - in a real implementation, you'd parse the normal range
            // and check if the value falls outside it
            abnormalTests.push({
              category,
              parameter,
              value: paramData.value,
              unit: paramData.unit,
              normalRange: paramData.normalRange
            });
          }
        });
      }
    });

    if (abnormalTests.length > 0) {
      abnormalResults.push({
        reportId: report._id,
        reportDate: report.reportDate,
        labName: report.labName,
        abnormalTests
      });
    }
  });

  return abnormalResults;
};

export default {
  createBloodReport,
  queryBloodReports,
  getBloodReportById,
  getBloodReportsByUserId,
  updateBloodReportById,
  deleteBloodReportById,
  getBloodReportStats,
  getBloodReportTrends,
  searchBloodReports,
  getAbnormalTestResults
};
