// routes/eventRoutes.js
import express from 'express';
import {
  EndEventMeeting,
  addPredefinedEvents,
  createEvent,
  deleteEvent,
  getAllEvents,
  getAllEventsUpcoming,
  getEventById,
  getEventsByTeacher,
  getStudentsForEvent,
  getUserRegisteredEvents,
  getUserRegisteredEventsUpcoming,
  registerUserToEvent,
  updateEvent,
  startEventMeeting,
  isUserEnrolledInEvent,
} from '../../controllers/events.controller.js';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { eventValidation } from '../../validations/eventClass.validation.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import { selfOrAdmin } from '../../middlewares/ownership.js';

const eventsRouter = express.Router();

// Create a new event
eventsRouter.post('/', auth(), validate(eventValidation.createEvent), createEvent);

// Get event by ID
eventsRouter.get('/upcoming', getAllEventsUpcoming);
eventsRouter.get('/:id', getEventById);

// Get all events
eventsRouter.get('/', getAllEvents);

eventsRouter.post('/add-pre-data', auth(), adminOnly(), addPredefinedEvents);
// Update event
eventsRouter.put('/:id', auth(), validate(eventValidation.updateEvent), updateEvent);

// Delete event
eventsRouter.delete('/:id', auth(), validate(eventValidation.eventIdParam), deleteEvent);

eventsRouter.post('/end_meeting/:classId', auth(), EndEventMeeting);

eventsRouter.post('/start_meeting/:eventId', auth(), startEventMeeting);

// Check if user is enrolled in an event
eventsRouter.get('/enrollment/:eventId/:userId', isUserEnrolledInEvent);

eventsRouter.post('/register', auth(), validate(eventValidation.registerUserToEvent), registerUserToEvent);

// Route to get all students for a specific event
eventsRouter.get('/students/:eventId', auth(), getStudentsForEvent);

// Route to get all events a user is registered in
eventsRouter.get('/user-events/:userId', auth(), selfOrAdmin(), getUserRegisteredEvents);

eventsRouter.get('/user-events/:userId/upcoming', auth(), selfOrAdmin(), getUserRegisteredEventsUpcoming);

// Route to get all events by teacher ID
eventsRouter.get('/teacher/:teacherId', getEventsByTeacher);

export default eventsRouter;
