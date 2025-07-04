import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as masterCategoryValidation from '../../validations/masterCategory.validation.js';
import * as masterCategoryController from '../../controllers/masterCategory.controller.js';

const router = express.Router();

// Master category management routes
router
  .route('/')
  .post( validate(masterCategoryValidation.createMasterCategory), masterCategoryController.createMasterCategory)
  .get(validate(masterCategoryValidation.getMasterCategories), masterCategoryController.getMasterCategories);

// Special routes (must come before parameterized routes)
router
  .route('/active')
  .get( validate(masterCategoryValidation.getActiveMasterCategories), masterCategoryController.getActiveMasterCategories);

router
  .route('/search')
  .get( validate(masterCategoryValidation.searchMasterCategories), masterCategoryController.searchMasterCategories);

router
  .route('/order')
  .patch( validate(masterCategoryValidation.updateCategoryOrder), masterCategoryController.updateCategoryOrder);

router
  .route('/:categoryId')
  .get( validate(masterCategoryValidation.getMasterCategory), masterCategoryController.getMasterCategory)
  .patch(validate(masterCategoryValidation.updateMasterCategory), masterCategoryController.updateMasterCategory)
  .delete( validate(masterCategoryValidation.deleteMasterCategory), masterCategoryController.deleteMasterCategory);

export default router;

/**
 * @swagger
 * tags:
 *   name: MasterCategories
 *   description: Master category management and retrieval
 */

/**
 * @swagger
 * /master-categories:
 *   post:
 *     summary: Create a master category
 *     description: Only admins can create master categories.
 *     tags: [MasterCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               soundUrl:
 *                 type: string
 *                 format: uri
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               order:
 *                 type: integer
 *                 minimum: 0
 *               isActive:
 *                 type: boolean
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/MasterCategory'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all master categories
 *     description: Retrieve all master categories with optional filtering.
 *     tags: [MasterCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Category name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by query in the form of field:desc/asc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of categories
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MasterCategory'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */ 