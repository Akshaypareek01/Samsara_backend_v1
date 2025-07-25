

// routes/eventRoutes.js
import express from 'express';
import { EndEventMeeting, addPredefinedEvents, createEvent, deleteEvent, getAllEvents, getAllEventsUpcoming, getEventById, getStudentsForEvent, getUserRegisteredEvents, getUserRegisteredEventsUpcoming, registerUserToEvent, updateEvent } from '../../controllers/events.controller.js';
import { startEventMeeting } from '../../controllers/events.controller.js';


const eventsRouter = express.Router();

// Create a new event
eventsRouter.post('/', createEvent);

// Get event by ID
eventsRouter.get('/upcoming', getAllEventsUpcoming);
eventsRouter.get('/:id', getEventById);

// Get all events
eventsRouter.get('/', getAllEvents);

eventsRouter.post('/add-pre-data', addPredefinedEvents);
// Update event
eventsRouter.put('/:id', updateEvent);

// Delete event
eventsRouter.delete('/:id', deleteEvent);

eventsRouter.post('/end_meeting/:classId', EndEventMeeting);

eventsRouter.post('/register', registerUserToEvent);

eventsRouter.post('/start_meeting/:eventId', startEventMeeting);

// Route to get all students for a specific event
eventsRouter.get('/students/:eventId', getStudentsForEvent);

// Route to get all events a user is registered in
eventsRouter.get('/user-events/:userId', getUserRegisteredEvents);

eventsRouter.get('/user-events/:userId/upcoming', getUserRegisteredEventsUpcoming);

export default eventsRouter;
