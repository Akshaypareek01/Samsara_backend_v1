// Import necessary modules and controllers
import express from 'express';
import {
  createEventZoomMeeting,
  createSessionZoomMeeting,
  createZoomMeeting,
  deleteMeeting,
  fetchZoomTokenServerOauth,
  getAccessToken,
  getMeeting,
  zoomuserInfo,
  generateMeetingSDKSignature,
  serveJoinMeetingPage,
  getMeetingDetails,
} from '../../controllers/zoom.controller.js';
import {
  serveFeedbackForm,
  submitWellnessFeedback,
} from '../../controllers/wellness-feedback.controller.js';
import validate from '../../middlewares/validate.js';
import * as wellnessFeedbackValidation from '../../validations/wellness-feedback.validation.js';

const zoomRouter = express.Router();

zoomRouter.post('/fetchZoomToken', fetchZoomTokenServerOauth);
zoomRouter.get('/zoom/oauth-token', getAccessToken);
zoomRouter.post('/zoomuserInfo', zoomuserInfo);
zoomRouter.post('/createZoomMeeting', createZoomMeeting);
zoomRouter.post('/createZoomMeeting-session', createSessionZoomMeeting);

zoomRouter.post('/createZoomMeeting-event', createEventZoomMeeting);
zoomRouter.post('/getMeetingData', getMeeting);
zoomRouter.delete('/deleteMeeting', deleteMeeting);
zoomRouter.post('/generateSDKSignature', generateMeetingSDKSignature);
zoomRouter.get('/getMeetingDetails', getMeetingDetails);
zoomRouter.get('/join-meeting', serveJoinMeetingPage);
zoomRouter.get('/wellness-feedback-form', serveFeedbackForm);
zoomRouter.post(
  '/wellness-feedback',
  validate(wellnessFeedbackValidation.submitWellnessFeedback),
  submitWellnessFeedback
);

export default zoomRouter;
