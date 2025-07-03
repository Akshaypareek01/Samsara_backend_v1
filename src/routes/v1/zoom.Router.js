// Import necessary modules and controllers
import express from 'express';
import { createEventZoomMeeting, createSessionZoomMeeting, createZoomMeeting, deleteMeeting, fetchZoomTokenServerOauth, getAccessToken, getMeeting, zoomuserInfo } from '../../controllers/zoom.controller.js';



const zoomRouter = express.Router();

zoomRouter.post('/fetchZoomToken', fetchZoomTokenServerOauth);
zoomRouter.get('/zoom/oauth-token', getAccessToken);
zoomRouter.post('/zoomuserInfo', zoomuserInfo);
zoomRouter.post('/createZoomMeeting', createZoomMeeting);
zoomRouter.post('/createZoomMeeting-session', createSessionZoomMeeting);

zoomRouter.post('/createZoomMeeting-event', createEventZoomMeeting);
zoomRouter.post('/getMeetingData', getMeeting);
zoomRouter.delete('/deleteMeeting', deleteMeeting);

export default zoomRouter;
