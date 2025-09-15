import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import bloodReportService from '../services/bloodReport.service.js';

/**
 * Create a blood report
 */
const createBloodReport = catchAsync(async (req, res) => {
  const bloodReportBody = {
    ...req.body,
    userId: req.user.id
  };
  
  const bloodReport = await bloodReportService.createBloodReport(bloodReportBody);
  res.status(httpStatus.CREATED).send(bloodReport);
});

/**
 * Get blood reports
 */
const getBloodReports = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status', 'labName', 'bloodGroup', 'startDate', 'endDate']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  
  // If not admin, only show user's own reports
  if (!req.user.roles.includes('admin')) {
    filter.userId = req.user.id;
  }
  
  const result = await bloodReportService.queryBloodReports(filter, options);
  res.send(result);
});

/**
 * Get blood report by id
 */
const getBloodReport = catchAsync(async (req, res) => {
  const bloodReport = await bloodReportService.getBloodReportById(req.params.bloodReportId);
  
  // Check if user has permission to view this report
  if (!req.user.roles.includes('admin') && bloodReport.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to view this blood report');
  }
  
  res.send(bloodReport);
});

/**
 * Get blood reports by user id (admin only)
 */
const getBloodReportsByUserId = catchAsync(async (req, res) => {
  if (!req.user.roles.includes('admin')) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to view other users\' blood reports');
  }
  
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await bloodReportService.getBloodReportsByUserId(req.params.userId, options);
  res.send(result);
});

/**
 * Update blood report
 */
const updateBloodReport = catchAsync(async (req, res) => {
  const bloodReport = await bloodReportService.updateBloodReportById(
    req.params.bloodReportId,
    req.body
  );
  res.send(bloodReport);
});

/**
 * Delete blood report
 */
const deleteBloodReport = catchAsync(async (req, res) => {
  await bloodReportService.deleteBloodReportById(req.params.bloodReportId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get blood report statistics
 */
const getBloodReportStats = catchAsync(async (req, res) => {
  const stats = await bloodReportService.getBloodReportStats(req.user.id);
  res.send(stats);
});

/**
 * Get blood report trends
 */
const getBloodReportTrends = catchAsync(async (req, res) => {
  const { testCategory, parameter } = req.params;
  const options = pick(req.query, ['startDate', 'endDate', 'limit']);
  
  const trends = await bloodReportService.getBloodReportTrends(
    req.user.id,
    testCategory,
    parameter,
    options
  );
  res.send(trends);
});

/**
 * Search blood reports
 */
const searchBloodReports = catchAsync(async (req, res) => {
  const { q: searchTerm } = req.query;
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  
  if (!searchTerm) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Search term is required');
  }
  
  const result = await bloodReportService.searchBloodReports(searchTerm, req.user.id, options);
  res.send(result);
});

/**
 * Get abnormal test results
 */
const getAbnormalTestResults = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit']);
  const abnormalResults = await bloodReportService.getAbnormalTestResults(req.user.id, options);
  res.send(abnormalResults);
});

/**
 * Get blood report by test category
 */
const getBloodReportByTestCategory = catchAsync(async (req, res) => {
  const { testCategory } = req.params;
  const filter = {
    userId: req.user.id,
    [`testCategories.${testCategory}`]: { $exists: true }
  };
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  
  const result = await bloodReportService.queryBloodReports(filter, options);
  res.send(result);
});

/**
 * Get blood report by blood group
 */
const getBloodReportByBloodGroup = catchAsync(async (req, res) => {
  const { bloodGroup } = req.params;
  const filter = {
    userId: req.user.id,
    bloodGroup
  };
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  
  const result = await bloodReportService.queryBloodReports(filter, options);
  res.send(result);
});

/**
 * Get blood report by lab name
 */
const getBloodReportByLabName = catchAsync(async (req, res) => {
  const { labName } = req.params;
  const filter = {
    userId: req.user.id,
    labName: { $regex: labName, $options: 'i' }
  };
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  
  const result = await bloodReportService.queryBloodReports(filter, options);
  res.send(result);
});

/**
 * Get blood report by date range
 */
const getBloodReportByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {
    userId: req.user.id
  };
  
  if (startDate || endDate) {
    filter.reportDate = {};
    if (startDate) {
      filter.reportDate.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.reportDate.$lte = new Date(endDate);
    }
  }
  
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await bloodReportService.queryBloodReports(filter, options);
  res.send(result);
});

/**
 * Export blood report data
 */
const exportBloodReportData = catchAsync(async (req, res) => {
  const { format = 'json' } = req.query;
  const filter = { userId: req.user.id };
  const options = { limit: 1000 }; // Limit for export
  
  const result = await bloodReportService.queryBloodReports(filter, options);
  
  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertToCSV(result.results);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=blood-reports.csv');
    res.send(csvData);
  } else {
    res.json(result);
  }
});

/**
 * Helper function to convert blood report data to CSV
 */
const convertToCSV = (bloodReports) => {
  const headers = [
    'Report ID',
    'Lab Name',
    'Report Date',
    'Blood Group',
    'Doctor Name',
    'Status',
    'Clinical Notes'
  ];
  
  const rows = bloodReports.map(report => [
    report._id,
    report.labName,
    report.reportDate.toISOString().split('T')[0],
    report.bloodGroup,
    report.referringDoctor.name,
    report.status,
    report.clinicalNotes || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

export default {
  createBloodReport,
  getBloodReports,
  getBloodReport,
  getBloodReportsByUserId,
  updateBloodReport,
  deleteBloodReport,
  getBloodReportStats,
  getBloodReportTrends,
  searchBloodReports,
  getAbnormalTestResults,
  getBloodReportByTestCategory,
  getBloodReportByBloodGroup,
  getBloodReportByLabName,
  getBloodReportByDateRange,
  exportBloodReportData
};
