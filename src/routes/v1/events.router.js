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

// Static 1-segment GET paths MUST be registered before /:id
eventsRouter.get('/', getAllEvents);
eventsRouter.get('/upcoming', getAllEventsUpcoming);
eventsRouter.get('/enrollment/:eventId/student/:userId', isUserEnrolledInEvent);
eventsRouter.get('/enrollment/:eventId/:userId', isUserEnrolledInEvent);
eventsRouter.get('/students/:eventId', auth(), getStudentsForEvent);
eventsRouter.get('/user-events/:userId/upcoming', auth(), selfOrAdmin(), getUserRegisteredEventsUpcoming);
eventsRouter.get('/user-events/:userId', auth(), selfOrAdmin(), getUserRegisteredEvents);
eventsRouter.get('/teacher/:teacherId', getEventsByTeacher);
eventsRouter.get('/:id', getEventById);

eventsRouter.post('/add-pre-data', auth(), adminOnly(), addPredefinedEvents);
// Update event
eventsRouter.put('/:id', auth(), validate(eventValidation.updateEvent), updateEvent);

// Delete event
eventsRouter.delete('/:id', auth(), validate(eventValidation.eventIdParam), deleteEvent);

eventsRouter.post('/end_meeting/:classId', auth(), EndEventMeeting);

eventsRouter.post('/start_meeting/:eventId', auth(), startEventMeeting);

eventsRouter.post('/register', auth(), validate(eventValidation.registerUserToEvent), registerUserToEvent);

export default eventsRouter;
