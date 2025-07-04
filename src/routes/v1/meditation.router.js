import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as meditationValidation from '../../validations/meditation.validation.js';
import * as meditationController from '../../controllers/meditation.controller.js';

const router = express.Router();

// Meditation management routes
router
  .route('/')
  .post( validate(meditationValidation.createMeditation), meditationController.createMeditation)
  .get( validate(meditationValidation.getMeditations), meditationController.getMeditations);

// Search route (must come before parameterized routes)
router
  .route('/search')
  .get( validate(meditationValidation.searchMeditations), meditationController.searchMeditations);

// Filtered meditation routes
router
  .route('/category/:categoryId')
  .get( validate(meditationValidation.getMeditationsByCategory), meditationController.getMeditationsByCategory);

router
  .route('/level/:level')
  .get( validate(meditationValidation.getMeditationsByLevel), meditationController.getMeditationsByLevel);

router
  .route('/mood/:mood')
  .get( validate(meditationValidation.getMeditationsByMood), meditationController.getMeditationsByMood);

router
  .route('/:meditationId')
  .get( validate(meditationValidation.getMeditation), meditationController.getMeditation)
  .patch( validate(meditationValidation.updateMeditation), meditationController.updateMeditation)
  .delete( validate(meditationValidation.deleteMeditation), meditationController.deleteMeditation);

router
  .route('/:meditationId/recommended')
  .get( validate(meditationValidation.getRecommendedMeditations), meditationController.getRecommendedMeditations);

export default router;

/**
 * @swagger
 * tags:
 *   name: Meditations
 *   description: Meditation management and retrieval
 */

/**
 * @swagger
 * /meditations:
 *   post:
 *     summary: Create a meditation
 *     description: Only admins can create meditations.
 *     tags: [Meditations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 480
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced, All Levels]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *               category:
 *                 type: string
 *                 format: objectId
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: string
 *               howToPractice:
 *                 type: array
 *                 items:
 *                   type: string
 *               focus:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               mood:
 *                 type: string
 *               recommended:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               isActive:
 *                 type: boolean
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Meditation'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all meditations
 *     description: Retrieve all meditations with optional filtering.
 *     tags: [Meditations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Meditation title
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced, All Levels]
 *         description: Meditation level
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *         description: Meditation mood
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Category ID
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
 *         description: Maximum number of meditations
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
 *                     $ref: '#/components/schemas/Meditation'
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