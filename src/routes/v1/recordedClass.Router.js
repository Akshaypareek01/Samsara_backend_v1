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

const RecordedClassRouter = express.Router();

// Get all classes
RecordedClassRouter.get('/', getAllRecordedClass);

// Get a specific class by ID
RecordedClassRouter.get('/:id', getRecordedClassById);

// Create a new class
RecordedClassRouter.post('/', createRecordedClass);

// Update a class by ID
RecordedClassRouter.put('/:id', updateRecordedClass);

// Delete a class by ID
RecordedClassRouter.delete('/:id', deleteRecordedClass);

RecordedClassRouter.patch('/:id/update-status', updateClassStatus);

export default RecordedClassRouter;
