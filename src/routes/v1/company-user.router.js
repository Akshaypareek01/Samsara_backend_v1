import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as companyUserValidation from '../../validations/company-user.validation.js';
import * as companyUserController from '../../controllers/company-user.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(companyUserValidation.createCompanyUser), companyUserController.createCompanyUser)
  .get(auth(), validate(companyUserValidation.getCompanyUsers), companyUserController.getCompanyUsers);

router
  .route('/by-company/:companyId')
  .get(
    auth(),
    validate(companyUserValidation.getCompanyUsersByCompany),
    companyUserController.getCompanyUsersByCompany
  );

router
  .route('/:id')
  .get(auth(), validate(companyUserValidation.getCompanyUser), companyUserController.getCompanyUserById)
  .patch(auth(), validate(companyUserValidation.updateCompanyUser), companyUserController.updateCompanyUserById)
  .delete(auth(), validate(companyUserValidation.deleteCompanyUser), companyUserController.deleteCompanyUserById);

export default router;
