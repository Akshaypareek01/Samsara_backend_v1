import express from 'express';
import {
  EndMeeting,
  EndAllMeetings,
  addPredefinedClasses,
  addStudentToClass,
  assignTeacherToClass,
  createClass,
  deleteClass,
  getAllClasses,
  getAllUpcomingClasses,
  getUpcomingClassesByCategory,
  getClassById,
  getClassesByTeacher,
  getStudentClasses,
  getStudentUpcomingClasses,
  isStudentEnrolled,
  removeStudentFromClass,
  updateClass,
  getAllTeachers,
  startClassMeeting,
} from '../../controllers/classes.controller.js';
import { getAccountUsageStats } from '../../services/zoomService.js';

const classRouter = express.Router();

// Route for creating a new class
classRouter.post('/', createClass);

// Route for getting all classes
classRouter.get('/', getAllClasses);
classRouter.get('/upcoming', getAllUpcomingClasses);
classRouter.get('/upcoming/category/:classCategory', getUpcomingClassesByCategory);

// Route for getting all teachers
classRouter.get('/teachers', getAllTeachers);

// Check Zoom account usage stats (must be before /:classId route)
classRouter.get('/zoom_accounts', (req, res) => {
  try {
    const stats = getAccountUsageStats();
    res.json({ success: true, accounts: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route for getting a class by ID
classRouter.get('/:classId', getClassById);

// Route for updating a class
classRouter.put('/:classId', updateClass);

// Route for deleting a class
classRouter.delete('/:classId', deleteClass);
classRouter.post('/add-pre-data', addPredefinedClasses);
// Route for assigning a teacher to a class
classRouter.put('/:classId/assign-teacher/:teacherId', assignTeacherToClass);

// Route for adding a student to a class
classRouter.put('/:classId/add-student/:studentId', addStudentToClass);

classRouter.get('/student/:studentId/classes', getStudentClasses);
classRouter.get('/student/:studentId/classes/upcoming', getStudentUpcomingClasses);
classRouter.get('/class/:classId/student/:studentId/enrolled', isStudentEnrolled);

// Route for removing a student from a class
classRouter.put('/:classId/remove-student/:studentId', removeStudentFromClass);

// Route for getting classes by teacher
classRouter.get('/teacher/:teacherId', getClassesByTeacher);

classRouter.post('/end_meeting/:classId', EndMeeting);
// End all active meetings
classRouter.post('/end_all_meetings', EndAllMeetings);
// Start a Zoom meeting for a class (single API call)
classRouter.post('/start-meeting/:classId', startClassMeeting);

export default classRouter;
