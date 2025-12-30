import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import * as companyService from '../services/company.service.js';
import { generateCompanyAuthTokens } from '../services/token.service.js';

/**
 * Create a new company
 */
const createCompany = catchAsync(async (req, res) => {
  const company = await companyService.createCompany(req.body);
  res.status(httpStatus.CREATED).send(company);
});

/**
 * Get all companies with pagination and filtering
 */
const getAllCompanies = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['companyName', 'email', 'domain', 'status', 'companyId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await companyService.queryCompanies(filter, options);
  res.send(result);
});

/**
 * Get a company by ID
 */
const getCompanyById = catchAsync(async (req, res) => {
  const company = await companyService.getCompanyById(req.params.id);
  if (!company) {
    return res.status(httpStatus.NOT_FOUND).json({ 
      status: 'fail',
      message: 'Company not found' 
    });
  }
  res.send(company);
});

/**
 * Get a company by companyId
 */
const getCompanyByCompanyId = catchAsync(async (req, res) => {
  const company = await companyService.getCompanyByCompanyId(req.params.companyId);
  if (!company) {
    return res.status(httpStatus.NOT_FOUND).json({ 
      status: 'fail',
      message: 'Company not found' 
    });
  }
  res.send(company);
});

/**
 * Check if company exists by companyId
 */
const checkCompanyExists = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const exists = await companyService.checkCompanyExists(companyId);
  res.status(httpStatus.OK).json({
    exists,
  });
});

/**
 * Update a company by ID
 */
const updateCompanyById = catchAsync(async (req, res) => {
  const company = await companyService.updateCompanyById(req.params.id, req.body);
  res.send(company);
});

/**
 * Delete a company by ID
 */
const deleteCompanyById = catchAsync(async (req, res) => {
  await companyService.deleteCompanyById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Send login OTP to company email
 */
const sendLoginOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await companyService.sendLoginOTPForCompany(email);
  res.status(httpStatus.OK).send(result);
});

/**
 * Verify login OTP and login company
 */
const verifyLoginOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const company = await companyService.loginCompanyWithOTP(email, otp);
  const tokens = await generateCompanyAuthTokens(company);
  res.send({ company, tokens });
});

export {
  createCompany,
  getAllCompanies,
  getCompanyById,
  getCompanyByCompanyId,
  checkCompanyExists,
  updateCompanyById,
  deleteCompanyById,
  sendLoginOTP,
  verifyLoginOTP,
};
