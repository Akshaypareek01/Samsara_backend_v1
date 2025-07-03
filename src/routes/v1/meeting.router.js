import express from 'express';
import { createMeeting, getMeetingData } from '../../controllers/meeting.controller.js';



const meetingRouter = express.Router();

// Create a new teacher
meetingRouter.post('/', createMeeting);

// Get all teachers
meetingRouter.get('/', getMeetingData);


export default meetingRouter;
