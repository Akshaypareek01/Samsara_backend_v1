// routes/classRoutes.js
import express from 'express';

import {
  createRecordedClass,
  deleteRecordedClass,
  getAllRecordedClass,
  getRecordedClassById,
  updateClassStatus,
  updateRecordedClass,
} from '../../controllers/recordedclasses.Controller.js';
import auth from '../../middlewares/auth.js';

const RecordedClassRouter = express.Router();

// GETs stay public
RecordedClassRouter.get('/', getAllRecordedClass);
RecordedClassRouter.get('/:id', getRecordedClassById);

// Writes require JWT
RecordedClassRouter.post('/', auth(), createRecordedClass);
RecordedClassRouter.put('/:id', auth(), updateRecordedClass);
RecordedClassRouter.delete('/:id', auth(), deleteRecordedClass);
RecordedClassRouter.patch('/:id/update-status', auth(), updateClassStatus);

export default RecordedClassRouter;
