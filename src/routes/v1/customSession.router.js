import express from 'express';

import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSessionById,
  deleteSessionById,
  approveSession,
  createTimeSlot,
  getAllTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
  EndSessionMeeting,
  getAllSessionsByUserId,
  getSessionDetails,
  getAllSessionsByUserIdUpcoming,
  getAllSessionsByTeacherId,
  startSessionMeeting,
} from '../../controllers/customSession.controller.js';

const CustomSessionRouter = express.Router();

// Routes
CustomSessionRouter.get('/time-slots', getAllTimeSlots);
CustomSessionRouter.post('/', createSession);
CustomSessionRouter.get('/', getAllSessions);
CustomSessionRouter.get('/:id', getSessionById);
CustomSessionRouter.put('/:id', updateSessionById);
CustomSessionRouter.delete('/:id', deleteSessionById);
CustomSessionRouter.put('/approve/:sessionId', approveSession);

CustomSessionRouter.get('/sessions/:userId', getAllSessionsByUserId);
CustomSessionRouter.get('/sessions/:userId/upcoming', getAllSessionsByUserIdUpcoming);
CustomSessionRouter.get('/session/:userId/:sessionId', getSessionDetails);
CustomSessionRouter.get('/teacher/:teacherId/sessions', getAllSessionsByTeacherId);

CustomSessionRouter.post('/time-slots', createTimeSlot);
CustomSessionRouter.post('/start_meeting/:sessionId', startSessionMeeting);

// Route for getting all time slots

// Route for getting a specific time slot by ID
CustomSessionRouter.get('/time-slots/:id', getTimeSlotById);

// Route for updating a time slot by ID
CustomSessionRouter.put('/time-slots/:id', updateTimeSlot);

// Route for deleting a time slot by ID
CustomSessionRouter.delete('/time-slots/:id', deleteTimeSlot);

CustomSessionRouter.post('/end_meeting/:classId', EndSessionMeeting);

export default CustomSessionRouter;
