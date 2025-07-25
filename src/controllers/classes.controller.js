import axios from "axios";
import { Class, User } from "../models/index.js";
import { createZoomMeeting as createZoomMeetingBackend } from './zoom.controller.js';

// Helper function to get teacher data with first image
const getTeacherData = (teacher) => {
    if (!teacher) return null;
    
    return {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        teacherCategory: teacher.teacherCategory,
        expertise: teacher.expertise || [],
        teachingExperience: teacher.teachingExperience,
        qualification: teacher.qualification || [],
        additional_courses: teacher.additional_courses || [],
        description: teacher.description,
        AboutMe: teacher.AboutMe,
        profileImage: teacher.profileImage,
        achievements: teacher.achievements || [],
        images: teacher.images || [],
        image: teacher.images && teacher.images.length > 0 ? teacher.images[0] : null,
        mobile: teacher.mobile,
        gender: teacher.gender,
        dob: teacher.dob,
        age: teacher.age,
        Address: teacher.Address,
        city: teacher.city,
        pincode: teacher.pincode,
        country: teacher.country,
        status: teacher.status,
        active: teacher.active
    };
};

// Utility function to get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .exec();
      
    const teachersWithImages = teachers.map(teacher => {
      const teacherData = teacher.toObject();
      return {
        ...teacherData,
        image: teacherData.images && teacherData.images.length > 0 ? teacherData.images[0] : null
      };
    });
    
    res.json({ success: true, data: teachersWithImages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Utility function to validate teacher ID
const validateTeacher = async (teacherId) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    throw new Error("Teacher must be a user with role 'teacher'");
  }
  return teacher;
};

// Utility function to validate student ID
const validateStudent = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student || student.role !== 'user') {
    throw new Error("Student must be a user with role 'user'");
  }
  return student;
};

export const createClass = async (req, res) => {
  try {
    // Validate that the teacher exists and has role 'teacher'
    if (req.body.teacher) {
      await validateTeacher(req.body.teacher);
    }
    
    const newClass = await Class.create(req.body);
    const populatedClass = await Class.findById(newClass._id)
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();
      
    const classData = populatedClass.toObject();
    classData.teacher = getTeacherData(classData.teacher);
    
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();
      
    const classesWithTeacherData = classes.map(classItem => {
      const classData = classItem.toObject();
      classData.teacher = getTeacherData(classData.teacher);
      return classData;
    });
    
    res.json({ success: true, data: classesWithTeacherData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllUpcomingClasses = async (req, res) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to 00:00:00 for the current day

    const classes = await Class.find({ schedule: { $gte: currentDate } }) // Includes today & future dates
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();

    const classesWithTeacherData = classes.map(classItem => {
      const classData = classItem.toObject();
      classData.teacher = getTeacherData(classData.teacher);
      return classData;
    });

    res.json({ success: true, data: classesWithTeacherData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassById = async (req, res) => {
  const { classId } = req.params;
  try {
    const foundClass = await Class.findById(classId)
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();
    
    if (!foundClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }
    
    const classData = foundClass.toObject();
    classData.teacher = getTeacherData(classData.teacher);
    
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateClass = async (req, res) => {
  const { classId } = req.params;
  const updatedData = req.body;
  
  try {
    // Validate teacher if being updated
    if (updatedData.teacher) {
      await validateTeacher(updatedData.teacher);
    }
    
    const updatedClass = await Class.findByIdAndUpdate(classId, updatedData, { new: true })
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();
      
    if (!updatedClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }
    
    const classData = updatedClass.toObject();
    classData.teacher = getTeacherData(classData.teacher);
    
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  const { classId } = req.params;
  try {
    const deletedClass = await Class.findByIdAndDelete(classId);
    if (!deletedClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }
    res.json({ success: true, data: deletedClass });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassesByTeacher = async (req, res) => {
  const { teacherId } = req.params;
  try {
    // Validate that the teacher exists and has role 'teacher'
    await validateTeacher(teacherId);
    
    const classes = await Class.find({ teacher: teacherId })
      .populate('students', 'name email')
      .exec();
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addStudentToClass = async (req, res) => {
  const { classId, studentId } = req.params;

  try {
    // Find the class by ID
    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Validate that the student exists and has role 'user'
    await validateStudent(studentId);

    // Check if student is already in the class
    if (foundClass.students.includes(studentId)) {
      return res.json({ success: false, message: "Student already enrolled" });
    }

    // Add student to class
    foundClass.students.push(studentId);
    await foundClass.save();

    console.log('Student added to class:', {
      classId,
      studentId,
      totalStudentsAfter: foundClass.students.length,
      studentIds: foundClass.students.map(s => s.toString())
    });

    const updatedClass = await Class.findById(classId)
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();

    const classData = updatedClass.toObject();
    classData.teacher = getTeacherData(classData.teacher);

    res.json({ 
      success: true, 
      data: classData,
      debug: {
        classId,
        studentId,
        totalStudents: foundClass.students.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentClasses = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Validate that the student exists and has role 'user'
    await validateStudent(studentId);

    // Find all classes where studentId exists in the students array
    const classes = await Class.find({ students: studentId })
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .exec();

    const classesWithTeacherData = classes.map(classItem => {
      const classData = classItem.toObject();
      classData.teacher = getTeacherData(classData.teacher);
      return classData;
    });

    res.json({ success: true, data: classesWithTeacherData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentUpcomingClasses = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Validate that the student exists and has role 'user'
    await validateStudent(studentId);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to midnight (00:00:00) to include today's classes

    // Find all upcoming classes where the student is enrolled
    const classes = await Class.find({ 
      students: studentId, 
      schedule: { $gte: currentDate } // Only fetch today's and future classes
    })
    .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
    .exec();

    const classesWithTeacherData = classes.map(classItem => {
      const classData = classItem.toObject();
      classData.teacher = getTeacherData(classData.teacher);
      return classData;
    });

    res.json({ success: true, data: classesWithTeacherData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const isStudentEnrolled = async (req, res) => {
  const { classId, studentId } = req.params;

  try {
    // Find the class by ID
    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Convert studentId to string for comparison (handles ObjectId vs string mismatch)
    const studentIdStr = studentId.toString();
    
    // Check if student is in the class - convert all student IDs to strings for comparison
    const isEnrolled = foundClass.students.some(student => student.toString() === studentIdStr);

    // Add debug information
    console.log('Checking enrollment for:', {
      classId,
      studentId: studentIdStr,
      totalStudents: foundClass.students.length,
      studentIds: foundClass.students.map(s => s.toString()),
      isEnrolled
    });

    res.json({ 
      success: true, 
      enrolled: isEnrolled,
      debug: {
        classId,
        studentId: studentIdStr,
        totalStudents: foundClass.students.length
      }
    });
  } catch (error) {
    console.error('Error in isStudentEnrolled:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const assignTeacherToClass = async (req, res) => {
  const { classId, teacherId } = req.params;
  try {
    // Validate that the teacher exists and has role 'teacher'
    await validateTeacher(teacherId);
    
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $set: { teacher: teacherId } },
      { new: true }
    )
    .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
    .populate('students', 'name email')
    .exec();
    
    if (!updatedClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }
    
    const classData = updatedClass.toObject();
    classData.teacher = getTeacherData(classData.teacher);
    
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeStudentFromClass = async (req, res) => {
    const { classId, studentId } = req.params;
    try {
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $pull: { students: studentId } },
        { new: true }
      )
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();
      
      if (!updatedClass) {
        return res.status(404).json({ success: false, error: "Class not found" });
      }
      
      const classData = updatedClass.toObject();
      classData.teacher = getTeacherData(classData.teacher);
      
      res.json({ success: true, data: classData });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  export const uploadClassRecording = async (req, res) => {
    try {
      const { classId } = req.body; // Assuming you're sending the classId along with the recording
      const recordingPath = req.file.path;
  
      // Update the class model to store the recording path
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $set: { recordingPath: recordingPath } },
        { new: true }
      )
      .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
      .populate('students', 'name email')
      .exec();
      
      if (!updatedClass) {
        return res.status(404).json({ success: false, error: "Class not found" });
      }
  
      const classData = updatedClass.toObject();
      classData.teacher = getTeacherData(classData.teacher);
  
      res.status(200).json({
        status: 'success',
        data: {
          class: classData,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'fail',
        message: error.message,
      });
    }
  };

  const updateClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword) => {
    try {
      // Find the class by ID
      const foundClass = await Class.findById(classId);
  
      if (!foundClass) {
        throw new Error("Class not found");
      }
  
      // Update meeting number and password
      foundClass.meeting_number = "";
      foundClass.status = false;
      // Save the updated class
      await foundClass.save();
  
      // console.log("Class meeting information updated successfully",foundClass);
    } catch (error) {
      console.error("Error updating class meeting information:", error.message);
      throw error; // You can choose to handle or propagate the error as needed
    }
  };

   const deleteMeeting =async(token,meetingId)=> {
    // console.log("Token ====>",token);
    // console.log("MeetingId ====>",meetingId);
    try {
      const result = await axios.delete("https://api.zoom.us/v2/meetings/" + meetingId, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'User-Agent': 'Zoom-api-Jwt-Request',
          'content-type': 'application/json'
        }
      });
      // console.log("Meeting delete Successfully =======>",result)
      // sendResponse.setSuccess(200, 'Success', result.data);
      return result;
    } catch (error) {
      console.log(error);
     
    }
  }

  export const EndMeeting = async (req, res) => {
    const { classId } = req.params;
    const {token,meetingId} = req.body;
    try {
      updateClassMeetingInfo(classId);
      // console.log("End meeting ====>",token,"ID ==================>",meetingId)
      deleteMeeting(token,meetingId);
      res.json({ success: true, message:"Meeting End" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

// Start a Zoom meeting for a class (single API call)
export const startClassMeeting = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ success: false, error: "Class not found" });

    // 1. Get Zoom OAuth token (account credentials grant)
    // You may want to move these to config/env
    const clientId = "_nLks8WMQDO1I34y6RQNXA";
    const clientSecret = "hw06ETTGZMJ8s4LnphEi9A5SVtQUQNZJ";
    const accountId = "C76CruAJSpitbs_UIRb4eQ";
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    const tokenRes = await axios.post(
      'https://zoom.us/oauth/token',
      null,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
          grant_type: 'account_credentials',
          account_id: accountId,
        },
      }
    );
    const zoomToken = tokenRes.data.access_token;

    // 2. Build Zoom meeting request
    const userId = 'developer@theodin.in';
    const requestBody = {
      topic: classDoc.title || "Class Meeting",
      type: 2,
      start_time: new Date(classDoc.schedule).toISOString(),
      duration: classDoc.duration || 60,
      timezone: 'Asia/Kolkata',
      password: classDoc.password || "",
      agenda: classDoc.description || "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        approval_type: 1,
        audio: 'both',
        auto_recording: 'local',
        waiting_room: false,
      },
    };

    // 3. Create Zoom meeting
    const response = await axios.post(
      `https://api.zoom.us/v2/users/${userId}/meetings`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${zoomToken}`,
        },
      }
    );

    // 4. Save meeting info to class
    classDoc.meeting_number = response.data.id;
    classDoc.password = response.data.password;
    classDoc.status = true;
    await classDoc.save();

    res.json({
      success: true,
      meetingNumber: response.data.id,
      password: response.data.password,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
const img="https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn"
const predefinedClasses=[
  {
    "title": "Core Strength Yoga",
    "description": "A session designed to build core stability and strength through controlled movements and mindful engagement. It includes deep abdominal work and balancing postures.",
    "startTime": "07:30",
    "endTime": "08:45",
    "schedule": "2025-07-16",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Those wanting to improve core strength and stability", "Individuals with weak abdominal muscles", "People with lower back issues"],
    "skipIf": ["Looking for relaxing or meditative yoga", "Have severe spinal injuries", "Want full-body muscle building"],
    "whatYoullGain": ["Enhanced core strength", "Improved posture", "Reduced back pain", "Better body control and stability"]
  },
  {
    "title": "Evening Unwind Yoga",
    "description": "A gentle evening session focused on releasing tension and calming the nervous system. It incorporates slow stretches and deep relaxation techniques.",
    "startTime": "18:30",
    "endTime": "19:45",
    "schedule": "2025-07-18",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Individuals who want to relax and destress", "Those struggling with sleep issues", "People dealing with anxiety"],
    "skipIf": ["Looking for high-energy workout", "Want cardio session", "Prefer fast-paced yoga flows"],
    "whatYoullGain": ["Better sleep quality", "Reduced stress", "Relaxation", "Soothed nervous system"]
  },
  {
    "title": "Detox & Cleanse Yoga",
    "description": "A revitalizing practice focusing on detoxifying the body through deep twists, breathwork, and fluid movements. Helps in boosting digestion and energy levels.",
    "startTime": "07:00",
    "endTime": "08:15",
    "schedule": "2025-07-20",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Those wanting to improve digestion", "Individuals looking to feel rejuvenated", "People wanting to reset body and mind"],
    "skipIf": ["Looking for intense strength-building workout", "Have severe digestive disorders", "Want extreme weight loss"],
    "whatYoullGain": ["Better digestion", "Improved circulation", "Enhanced vitality", "Natural detoxification"]
  },
  {
    "title": "Balance & Stability Yoga",
    "description": "A practice focusing on improving balance, coordination, and stability through controlled poses. Strengthens key muscle groups while enhancing body awareness.",
    "startTime": "08:00",
    "endTime": "09:20",
    "schedule": "2025-07-22",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 80,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Those looking to improve balance", "Athletes", "Individuals working on body coordination"],
    "skipIf": ["Seeking relaxing or meditative session", "Have severe balance disorders", "Want intense muscle building"],
    "whatYoullGain": ["Better balance", "Stronger core muscles", "Enhanced coordination", "Injury prevention"]
  },
  {
    "title": "Heart-Opening Yoga Flow",
    "description": "A gentle yet energizing practice designed to open the chest and shoulders. It includes backbends and stretches that release emotional tension and enhance posture.",
    "startTime": "07:15",
    "endTime": "08:30",
    "schedule": "2025-07-25",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Those wanting to improve posture", "Individuals looking to reduce stiffness", "People wanting to open up emotionally"],
    "skipIf": ["Have severe back injuries", "Limited spinal flexibility", "Want fast movements"],
    "whatYoullGain": ["Better spinal flexibility", "Enhanced posture", "Released tension", "Emotional well-being"]
  },
  {
    "title": "Yoga for Stress & Anxiety",
    "description": "A slow-paced session designed to calm the mind and body through deep breathing and grounding poses. Helps in reducing stress and promoting emotional balance.",
    "startTime": "18:00",
    "endTime": "19:30",
    "schedule": "2025-07-27",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 90,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Anyone dealing with stress", "People with anxiety", "Those seeking emotional balance"],
    "skipIf": ["Looking for intense workout", "Want fast-paced session", "Prefer high-energy yoga"],
    "whatYoullGain": ["Stress relief", "Reduced anxiety", "Relaxation", "Mindfulness", "Emotional resilience"]
  },
  {
    "title": "Sun Salutation Flow",
    "description": "A dynamic session focusing on repeated sun salutations to build heat and flexibility. It includes seamless transitions to energize and strengthen the body.",
    "startTime": "07:00",
    "endTime": "08:15",
    "schedule": "2025-07-30",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Those looking to boost energy", "Individuals who enjoy dynamic movements", "People wanting flexibility"],
    "skipIf": ["Looking for stillness", "Want deep relaxation", "Beginners unfamiliar with sun salutations"],
    "whatYoullGain": ["Improved endurance", "Increased strength", "Enhanced flexibility", "Better circulation", "Boosted metabolism"]
  },
  {
    "title": "Yin Yoga for Deep Stretching",
    "description": "A slow and meditative session focusing on deep holds and passive stretching. It targets connective tissues, promoting flexibility and relaxation.",
    "startTime": "19:00",
    "endTime": "20:15",
    "schedule": "2025-08-02",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Individuals looking for deep relaxation", "Those needing flexibility", "People wanting meditative practice"],
    "skipIf": ["Seeking fast-paced workout", "Want intense workout", "Have limited patience for long holds"],
    "whatYoullGain": ["Deep tissue flexibility", "Reduced tension", "Improved circulation", "Relaxation", "Emotional grounding"]
  },
  {
    "title": "Morning Power Yoga",
    "description": "An energizing morning session that combines strength, flexibility, and cardio elements. Perfect for starting your day with energy and focus.",
    "startTime": "06:30",
    "endTime": "07:45",
    "schedule": "2025-08-05",
    "level": "Advanced",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Early risers", "Those wanting high-energy workout", "Advanced practitioners"],
    "skipIf": ["Prefer gentle sessions", "Have limited mobility", "Are beginners"],
    "whatYoullGain": ["Increased energy", "Better focus", "Enhanced strength", "Improved flexibility"]
  },
  {
    "title": "Restorative Yoga",
    "description": "A deeply relaxing practice using props to support the body in gentle poses. Perfect for recovery and deep relaxation.",
    "startTime": "20:00",
    "endTime": "21:15",
    "schedule": "2025-08-08",
    "level": "Beginner",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Beginners", "Those needing recovery", "People with injuries"],
    "skipIf": ["Want intense workout", "Prefer dynamic movements", "Looking for cardio"],
    "whatYoullGain": ["Deep relaxation", "Better recovery", "Reduced stress", "Improved sleep"]
  },
  {
    "title": "Vinyasa Flow",
    "description": "A dynamic and flowing practice that synchronizes breath with movement. Builds strength, flexibility, and mindfulness.",
    "startTime": "17:30",
    "endTime": "18:45",
    "schedule": "2025-08-12",
    "level": "Intermediate",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Those wanting flowing movements", "Intermediate practitioners", "People seeking mindfulness"],
    "skipIf": ["Prefer static poses", "Have limited mobility", "Want gentle practice"],
    "whatYoullGain": ["Better flow", "Enhanced mindfulness", "Improved strength", "Increased flexibility"]
  },
  {
    "title": "Meditation & Breathwork",
    "description": "A calming session focused on meditation techniques and breathwork exercises. Helps in mental clarity and emotional balance.",
    "startTime": "19:30",
    "endTime": "20:45",
    "schedule": "2025-08-15",
    "level": "Beginner",
    "password": "12345678",
    "teacher": "6868f7814d18790474561a8d",
    "image": "https://imgs.search.brave.com/uShtPcpJNZFfj7nxgowt49QtZf7xJuqJyoqOp-qIuQU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9oYXBw/eS13b21hbi1zbWls/aW5nLXlvZ2EtY2xh/c3MtMjc3NDM4MjEu/anBn",
    "classType": "Yoga",
    "duration": 75,
    "maxCapacity": 20,
    "status": false,
    "meeting_number": "",
    "students": [],
    "recordingPath": "",
    "schedules": [],
    "perfectFor": ["Beginners", "Those seeking mental clarity", "People with anxiety"],
    "skipIf": ["Want physical workout", "Prefer dynamic movements", "Looking for strength training"],
    "whatYoullGain": ["Mental clarity", "Emotional balance", "Better breathing", "Reduced anxiety"]
  }
]

  export const addPredefinedClasses = async (req, res) => {
    try {
      // Validate that all teachers in predefined classes exist and have role 'teacher'
      for (const classData of predefinedClasses) {
        if (classData.teacher) {
          const teacher = await User.findById(classData.teacher);
          if (!teacher || teacher.role !== 'teacher') {
            return res.status(400).json({ 
              success: false, 
              error: `Teacher with ID ${classData.teacher} must be a user with role 'teacher'` 
            });
          }
        }
      }
      
      const insertedClasses = await Class.insertMany(predefinedClasses);
      res.status(201).json({ message: "Predefined classes added successfully", data: insertedClasses });
    } catch (error) {
      res.status(500).json({ message: "Error adding predefined classes", error: error.message });
    }
  };