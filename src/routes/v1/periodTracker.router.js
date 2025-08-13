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

export default router;


