import express from 'express';
import { periodCycleController } from '../../controllers/periodCycle.controller.js';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { periodCycleValidation } from '../../validations/periodCycle.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth());

router.post('/start', validate(periodCycleValidation.startNewCycle), periodCycleController.startNewCycle);

router.get('/current', periodCycleController.getCurrentCycle);

router.get('/history', periodCycleController.getCycleHistory);

router.get('/predictions', periodCycleController.getPredictions);

router.get('/analytics', periodCycleController.getAnalytics);

router.get('/:cycleId', periodCycleController.getCycleById);

router.post('/:cycleId/daily-log', validate(periodCycleValidation.updateDailyLog), periodCycleController.updateDailyLog);

router.put('/:cycleId/complete', validate(periodCycleValidation.completeCycle), periodCycleController.completeCycle);

router.put('/:cycleId/notes', validate(periodCycleValidation.updateNotes), periodCycleController.updateCycleNotes);

router.delete('/:cycleId', periodCycleController.deleteCycle);

export default router;
