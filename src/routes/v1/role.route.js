import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/checkPermission.js';
import * as roleValidation from '../../validations/role.validation.js';
import roleController from '../../controllers/role.controller.js';

const router = express.Router();

router
    .route('/')
    .post(auth(), checkPermission('roleManagement', 'create'), validate(roleValidation.createRole), roleController.createRole)
    .get(auth(), checkPermission('roleManagement', 'read'), validate(roleValidation.getRoles), roleController.getRoles);

router
    .route('/:roleId')
    .get(auth(), checkPermission('roleManagement', 'read'), validate(roleValidation.getRole), roleController.getRole)
    .patch(auth(), checkPermission('roleManagement', 'update'), validate(roleValidation.updateRole), roleController.updateRole)
    .delete(auth(), checkPermission('roleManagement', 'delete'), validate(roleValidation.deleteRole), roleController.deleteRole);

export default router;
