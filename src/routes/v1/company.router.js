import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as companyValidation from '../../validations/company.validation.js';
import * as companyController from '../../controllers/company.controllers.js';

const router = express.Router();

// Company login routes (no auth required)
router.post(
  '/login/send-otp',
  validate(companyValidation.sendLoginOTP),
  companyController.sendLoginOTP
);

router.post(
  '/login/verify-otp',
  validate(companyValidation.verifyLoginOTP),
  companyController.verifyLoginOTP
);

// Check if company exists by companyId (no auth required)
router.get(
  '/check/:companyId',
  validate(companyValidation.checkCompanyExists),
  companyController.checkCompanyExists
);

// Create a new company
router.post(
  '/',
  auth(),
  validate(companyValidation.createCompany),
  companyController.createCompany
);

// Get all companies with pagination and filtering
router.get(
  '/',
  auth(),
  validate(companyValidation.getCompanies),
  companyController.getAllCompanies
);

// Get company by companyId
router.get(
  '/company-id/:companyId',
  auth(),
  validate(companyValidation.getCompanyByCompanyId),
  companyController.getCompanyByCompanyId
);

// Get company by MongoDB ID
router.get(
  '/:id',
  auth(),
  validate(companyValidation.getCompany),
  companyController.getCompanyById
);

// Update company by MongoDB ID
router.patch(
  '/:id',
  auth(),
  validate(companyValidation.updateCompany),
  companyController.updateCompanyById
);

// Delete company by MongoDB ID
router.delete(
  '/:id',
  auth(),
  validate(companyValidation.deleteCompany),
  companyController.deleteCompanyById
);

export default router;
