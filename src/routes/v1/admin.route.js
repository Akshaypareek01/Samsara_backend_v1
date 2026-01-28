import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import checkPermission from '../../middlewares/checkPermission.js';
import * as adminValidation from '../../validations/admin.validation.js';
import * as adminController from '../../controllers/admin.controller.js';

const router = express.Router();

// Admin login (NO auth)
router.post('/login', validate(adminValidation.login), adminController.login);

// ✅ Admin profile (JWT + ADMIN CHECK)
router.get(
  '/profile',
  auth(),
  adminController.getProfile
);

// Team management routes
router
  .route('/team')
  .post(auth(), checkPermission('teamManagement', 'create'), validate(adminValidation.createTeamMember), adminController.createTeamMember)
  .get(auth(), checkPermission('teamManagement', 'read'), validate(adminValidation.getTeamMembers), adminController.getTeamMembers);

router
  .route('/team/:adminId')
  .get(auth(), checkPermission('teamManagement', 'read'), validate(adminValidation.getTeamMember), adminController.getTeamMember)
  .patch(auth(), checkPermission('teamManagement', 'update'), validate(adminValidation.updateTeamMember), adminController.updateTeamMember)
  .delete(auth(), checkPermission('teamManagement', 'delete'), validate(adminValidation.deleteTeamMember), adminController.deleteTeamMember);

export default router;
