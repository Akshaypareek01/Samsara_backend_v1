import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as controller from '../../controllers/period-tracker.controller.js';
import * as v from '../../validations/periodTracker.validation.js';

const router = express.Router();

router.use(auth());

router.get('/calendar', validate(v.getCalendar), controller.getCalendar);
router.get('/current', controller.getCurrent);
router.post('/period/start', validate(v.startPeriod), controller.startPeriod);
router.post('/period/stop', validate(v.stopPeriod), controller.stopPeriod);
router.put('/logs/:date', validate(v.upsertLog), controller.upsertLog);
router.get('/history', validate(v.getHistory), controller.getHistory);
router.get('/day/:date', validate(v.getDay), controller.getDay);

router.get('/settings', controller.getSettings);
router.put('/settings', validate(v.updateSettings), controller.updateSettings);

router.get('/birth-control', controller.getBirthControl);
router.put('/birth-control', validate(v.updateBirthControl), controller.updateBirthControl);
router.post('/birth-control/pill/take', validate(v.takePill), controller.takePill);

// Bulk import historical cycles
router.post('/bulk-import', validate(v.bulkImportHistoricalCycles), controller.bulkImportHistoricalCycles);

// Enhanced endpoints
router.get('/current-enhanced', controller.getCurrentEnhanced);

// Cycle management
router.delete('/cycle/:cycleId', validate(v.deleteCycle), controller.deleteCycle);
router.put('/cycle/:cycleId', validate(v.updateCycle), controller.updateCycle);

// Log management
router.delete('/logs/:date', validate(v.deleteDailyLog), controller.deleteDailyLog);

// Analytics & Insights
router.get('/analytics', controller.getAnalytics);
router.get('/insights', controller.getInsights);
router.get('/stats', controller.getStats);

export default router;
