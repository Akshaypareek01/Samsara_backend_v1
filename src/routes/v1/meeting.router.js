import express from 'express';
import { createMeeting, getMeetingData } from '../../controllers/meeting.controller.js';
import auth from '../../middlewares/auth.js';

const meetingRouter = express.Router();

// JWT required — GET was leaking meeting passwords.
meetingRouter.post('/', auth(), createMeeting);
meetingRouter.get('/', auth(), getMeetingData);

export default meetingRouter;
