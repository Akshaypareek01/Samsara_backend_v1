import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import bloodReportValidation from '../../validations/bloodReport.validation.js';
import bloodReportController from '../../controllers/bloodReport.controller.js';

const router = express.Router();

// All routes require authentication
router.use(auth());

/**
 * @swagger
 * /api/v1/blood-reports:
 *   post:
 *     summary: Create a new blood report
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referringDoctor
 *               - labName
 *               - bloodGroup
 *               - testCategories
 *             properties:
 *               referringDoctor:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 100
 *                   specialization:
 *                     type: string
 *                     maxLength: 100
 *                   contactNumber:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *               labName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               reportDate:
 *                 type: string
 *                 format: date
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               clinicalNotes:
 *                 type: string
 *                 maxLength: 2000
 *               testCategories:
 *                 type: object
 *                 properties:
 *                   cbc:
 *                     $ref: '#/components/schemas/CBC'
 *                   bloodSugar:
 *                     $ref: '#/components/schemas/BloodSugar'
 *                   thyroidProfile:
 *                     $ref: '#/components/schemas/ThyroidProfile'
 *                   lipidProfile:
 *                     $ref: '#/components/schemas/LipidProfile'
 *                   liverFunction:
 *                     $ref: '#/components/schemas/LiverFunction'
 *                   kidneyFunction:
 *                     $ref: '#/components/schemas/KidneyFunction'
 *                   hormonalAnalysis:
 *                     $ref: '#/components/schemas/HormonalAnalysis'
 *                   pcosPcodPanel:
 *                     $ref: '#/components/schemas/PCOSPCODPanel'
 *                   menopauseProfile:
 *                     $ref: '#/components/schemas/MenopauseProfile'
 *                   urineRoutine:
 *                     $ref: '#/components/schemas/UrineRoutine'
 *                   semenAnalysis:
 *                     $ref: '#/components/schemas/SemenAnalysis'
 *                   weightGainLoss:
 *                     $ref: '#/components/schemas/WeightGainLoss'
 *               status:
 *                 type: string
 *                 enum: [pending, completed, reviewed]
 *     responses:
 *       201:
 *         description: Blood report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BloodReport'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  validate(bloodReportValidation.createBloodReportValidation),
  bloodReportController.createBloodReport
);

/**
 * @swagger
 * /api/v1/blood-reports:
 *   get:
 *     summary: Get all blood reports
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [reportDate, createdAt, labName]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, reviewed]
 *         description: Filter by status
 *       - in: query
 *         name: labName
 *         schema:
 *           type: string
 *         description: Filter by lab name
 *       - in: query
 *         name: bloodGroup
 *         schema:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         description: Filter by blood group
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of blood reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  validate(bloodReportValidation.getBloodReportsValidation),
  bloodReportController.getBloodReports
);

/**
 * @swagger
 * /api/v1/blood-reports/search:
 *   get:
 *     summary: Search blood reports
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/search',
  bloodReportController.searchBloodReports
);

/**
 * @swagger
 * /api/v1/blood-reports/stats:
 *   get:
 *     summary: Get blood report statistics
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blood report statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReports:
 *                   type: integer
 *                 completedReports:
 *                   type: integer
 *                 pendingReports:
 *                   type: integer
 *                 reviewedReports:
 *                   type: integer
 *                 latestReportDate:
 *                   type: string
 *                   format: date
 *                 earliestReportDate:
 *                   type: string
 *                   format: date
 *                 bloodGroupDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 topLabs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/stats',
  bloodReportController.getBloodReportStats
);

/**
 * @swagger
 * /api/v1/blood-reports/abnormal:
 *   get:
 *     summary: Get abnormal test results
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of abnormal test results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   reportId:
 *                     type: string
 *                   reportDate:
 *                     type: string
 *                     format: date
 *                   labName:
 *                     type: string
 *                   abnormalTests:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         category:
 *                           type: string
 *                         parameter:
 *                           type: string
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         normalRange:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/abnormal',
  bloodReportController.getAbnormalTestResults
);

/**
 * @swagger
 * /api/v1/blood-reports/export:
 *   get:
 *     summary: Export blood report data
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Exported blood report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           application/csv:
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/export',
  bloodReportController.exportBloodReportData
);

/**
 * @swagger
 * /api/v1/blood-reports/category/{testCategory}:
 *   get:
 *     summary: Get blood reports by test category
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testCategory
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cbc, bloodSugar, thyroidProfile, lipidProfile, liverFunction, kidneyFunction, hormonalAnalysis, pcosPcodPanel, menopauseProfile, urineRoutine, semenAnalysis, weightGainLoss]
 *         description: Test category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of blood reports for the specified test category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/category/:testCategory',
  bloodReportController.getBloodReportByTestCategory
);

/**
 * @swagger
 * /api/v1/blood-reports/blood-group/{bloodGroup}:
 *   get:
 *     summary: Get blood reports by blood group
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bloodGroup
 *         required: true
 *         schema:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         description: Blood group
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of blood reports for the specified blood group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/blood-group/:bloodGroup',
  bloodReportController.getBloodReportByBloodGroup
);

/**
 * @swagger
 * /api/v1/blood-reports/lab/{labName}:
 *   get:
 *     summary: Get blood reports by lab name
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labName
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of blood reports for the specified lab
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/lab/:labName',
  bloodReportController.getBloodReportByLabName
);

/**
 * @swagger
 * /api/v1/blood-reports/date-range:
 *   get:
 *     summary: Get blood reports by date range
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of blood reports within the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/date-range',
  bloodReportController.getBloodReportByDateRange
);

/**
 * @swagger
 * /api/v1/blood-reports/trends/{testCategory}/{parameter}:
 *   get:
 *     summary: Get blood report trends for a specific test parameter
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testCategory
 *         required: true
 *         schema:
 *           type: string
 *         description: Test category
 *       - in: path
 *         name: parameter
 *         required: true
 *         schema:
 *           type: string
 *         description: Test parameter
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of trend data for the specified test parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   reportDate:
 *                     type: string
 *                     format: date
 *                   value:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   normalRange:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/trends/:testCategory/:parameter',
  bloodReportController.getBloodReportTrends
);

/**
 * @swagger
 * /api/v1/blood-reports/{bloodReportId}:
 *   get:
 *     summary: Get blood report by id
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bloodReportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blood report ID
 *     responses:
 *       200:
 *         description: Blood report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BloodReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:bloodReportId',
  bloodReportController.getBloodReport
);

/**
 * @swagger
 * /api/v1/blood-reports/{bloodReportId}:
 *   patch:
 *     summary: Update blood report
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bloodReportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blood report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referringDoctor:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 100
 *                   specialization:
 *                     type: string
 *                     maxLength: 100
 *                   contactNumber:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *               labName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               reportDate:
 *                 type: string
 *                 format: date
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               clinicalNotes:
 *                 type: string
 *                 maxLength: 2000
 *               testCategories:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [pending, completed, reviewed]
 *     responses:
 *       200:
 *         description: Blood report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BloodReport'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:bloodReportId',
  validate(bloodReportValidation.updateBloodReportValidation),
  bloodReportController.updateBloodReport
);

/**
 * @swagger
 * /api/v1/blood-reports/{bloodReportId}:
 *   delete:
 *     summary: Delete blood report
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bloodReportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blood report ID
 *     responses:
 *       204:
 *         description: Blood report deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:bloodReportId',
  bloodReportController.deleteBloodReport
);

// Admin only routes
/**
 * @swagger
 * /api/v1/blood-reports/user/{userId}:
 *   get:
 *     summary: Get blood reports by user ID (Admin only)
 *     tags: [Blood Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of blood reports for the specified user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BloodReport'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/user/:userId',
  bloodReportController.getBloodReportsByUserId
);

export default router;
