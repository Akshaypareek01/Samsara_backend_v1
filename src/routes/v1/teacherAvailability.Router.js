import express from 'express';
import auth from '../../middlewares/auth.js';
import {
  createAvailability,
  getTeacherAvailabilities,
  updateAvailability,
  deleteAvailability,
  getAvailableSlots,
} from '../../controllers/teacheravailability.Controller.js';

const TeacherAvailabilityrouter = express.Router();

// Create new availability
TeacherAvailabilityrouter.post('/', auth(), createAvailability);

// Get all availabilities for a teacher
TeacherAvailabilityrouter.get('/teacher/:teacherId', getTeacherAvailabilities);

// Get available slots for a specific date
TeacherAvailabilityrouter.get('/available-slots/:teacherId/:date', getAvailableSlots);

// Update availability
TeacherAvailabilityrouter.patch('/:id', auth(), updateAvailability);

// Delete availability
TeacherAvailabilityrouter.delete('/:id', auth(), deleteAvailability);

export default TeacherAvailabilityrouter;
