// controllers/eventController.js

import axios from "axios";
import { Event } from "../models/index.js";

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

// Create a new event
export const createEvent = async (req, res) => {
    console.log("body events  ==>",req.body)
    try {
        const event = new Event(req.body);
        await event.save();
        
        // Populate teacher data if teacher exists
        if (event.teacher) {
            const populatedEvent = await Event.findById(event._id)
                .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
                .exec();
            const eventData = populatedEvent.toObject();
            eventData.teacher = getTeacherData(eventData.teacher);
            return res.status(201).json(eventData);
        }
        
        res.status(201).json(event);
    } catch (error) {
        console.log("error  ==<.",error)
        res.status(500).json({ error: error.message });
    }
};

// Get event by ID
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
            .populate('students', 'name email')
            .exec();
            
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        const eventData = event.toObject();
        eventData.teacher = getTeacherData(eventData.teacher);
        
        res.status(200).json(eventData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all events
export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
            .populate('students', 'name email')
            .exec();
            
        const eventsWithTeacherData = events.map(event => {
            const eventData = event.toObject();
            eventData.teacher = getTeacherData(eventData.teacher);
            return eventData;
        });
        
        res.status(200).json(eventsWithTeacherData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllEventsUpcoming = async (req, res) => {
    try {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time to 00:00:00 to include today's events

        // Fetch only today's and future events
        const events = await Event.find({ 
            startDate: { $gte: currentDate } 
        })
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
        .populate('students', 'name email')
        .exec();

        const eventsWithTeacherData = events.map(event => {
            const eventData = event.toObject();
            eventData.teacher = getTeacherData(eventData.teacher);
            return eventData;
        });

        res.status(200).json(eventsWithTeacherData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
            .populate('students', 'name email')
            .exec();
            
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        const eventData = event.toObject();
        eventData.teacher = getTeacherData(eventData.teacher);
        
        res.status(200).json(eventData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword) => {
    try {
      // Find the class by ID
      const foundClass = await Event.findById(classId);
  
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

 export const EndEventMeeting = async (req, res) => {
    const { classId } = req.params;
    const {token,meetingId} = req.body;
    try {
      updateClassMeetingInfo(classId);
      // console.log("End meeting ====>",token,"ID ==================>",meetingId)
      deleteMeeting(token,meetingId);
      res.json({ success: true, message:"Metting End" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };



  export const registerUserToEvent = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        const event = await Event.findById(eventId)
            .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
            .populate('students', 'name email')
            .exec();
            
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.students.includes(userId)) {
            event.students.push(userId);
            await event.save();
            
            const eventData = event.toObject();
            eventData.teacher = getTeacherData(eventData.teacher);
            
            return res.status(200).json({ message: 'User registered successfully', event: eventData });
        }
        
        res.status(400).json({ message: 'User already registered' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all students registered for an event
export const getStudentsForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId).populate('students', 'name email');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ students: event.students });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all events a user is registered in
export const getUserRegisteredEvents = async (req, res) => {
    try {
        const { userId } = req.params;

        const events = await Event.find({ students: userId })
            .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
            .populate('students', 'name email')
            .exec();
            
        const eventsWithTeacherData = events.map(event => {
            const eventData = event.toObject();
            eventData.teacher = getTeacherData(eventData.teacher);
            return eventData;
        });
        
        res.status(200).json({ events: eventsWithTeacherData });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getUserRegisteredEventsUpcoming = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time to 00:00:00 to include today's events

        // Fetch only upcoming events or events happening today
        const events = await Event.find({ 
            students: userId, 
            startDate: { $gte: currentDate } // Ensures only today's and future events are included
        })
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements mobile gender dob age Address city pincode country status active')
        .populate('students', 'name email')
        .exec();

        const eventsWithTeacherData = events.map(event => {
            const eventData = event.toObject();
            eventData.teacher = getTeacherData(eventData.teacher);
            return eventData;
        });

        res.status(200).json({ events: eventsWithTeacherData });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const preDefineEvents = [
    {
      "eventName": "Sunrise Yoga & Meditation",
      "details": "Start your day with an energizing sunrise yoga session followed by peaceful meditation. Perfect for all levels.",
      "availableseats": "50",
      "eventmode": "online",
      "image": "https://yogajala.com/wp-content/uploads/3-49.jpg",
      "level": "Beginner",
      "location": "Virtual",
      "startDate": "2025-07-12",
      "startTime": "06:30",
      "type": "free",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Deep Stretch & Flexibility Yoga",
      "details": "Improve flexibility and release tension with deep stretching yoga techniques. A must-attend for those with stiff muscles.",
      "availableseats": "40",
      "eventmode": "offline",
      "image": "https://wallpaperaccess.com/full/1347345.jpg",
      "level": "Intermediate",
      "location": "Mumbai",
      "startDate": "2025-07-15",
      "startTime": "18:00",
      "type": "paid",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Power Yoga for Strength",
      "details": "Boost your stamina and build core strength with our intense power yoga session designed for fitness enthusiasts.",
      "availableseats": "60",
      "eventmode": "online",
      "image": "https://asmy.org.au/app/uploads/2019/01/DSC09296_edited.jpg",
      "level": "Advanced",
      "location": "Virtual",
      "startDate": "2025-07-20",
      "startTime": "19:00",
      "type": "free",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Yoga for Stress Relief",
      "details": "Unwind and de-stress with gentle yoga poses and breathing exercises designed to calm the mind and body.",
      "availableseats": "30",
      "eventmode": "offline",
      "image": "https://1.bp.blogspot.com/_sCVN1yQuK3A/TNfcYl4FG8I/AAAAAAAADI8/jpc-oc9UaMs/s1600/dhanurasana-posizione-dellarco.jpg",
      "level": "Beginner",
      "location": "Jaipur",
      "startDate": "2025-07-20",
      "startTime": "17:30",
      "type": "free",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Full Moon Yoga Flow",
      "details": "Experience the magic of yoga under the full moon, balancing your mind and body with gentle movements.",
      "availableseats": "45",
      "eventmode": "offline",
      "image": "https://wallpaperaccess.com/full/1347345.jpg",
      "level": "Intermediate",
      "location": "Goa",
      "startDate": "2025-07-01",
      "startTime": "20:00",
      "type": "paid",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Prenatal Yoga for Moms-to-Be",
      "details": "A soothing yoga class designed for expectant mothers to enhance flexibility and relaxation.",
      "availableseats": "20",
      "eventmode": "online",
      "image": "https://yogajala.com/wp-content/uploads/3-49.jpg",
      "level": "Beginner",
      "location": "Virtual",
      "startDate": "2025-07-15",
      "startTime": "10:00",
      "type": "free",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Sun Salutation Masterclass",
      "details": "Master the 12 steps of Surya Namaskar with expert guidance, improving strength and flexibility.",
      "availableseats": "35",
      "eventmode": "offline",
      "image": "https://asmy.org.au/app/uploads/2019/01/DSC09296_edited.jpg",
      "level": "Intermediate",
      "location": "Bangalore",
      "startDate": "2025-08-05",
      "startTime": "07:00",
      "type": "paid",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Yoga & Sound Healing",
      "details": "Combine yoga with the healing power of sound vibrations to achieve a deep sense of relaxation and balance.",
      "availableseats": "50",
      "eventmode": "offline",
      "image": "https://1.bp.blogspot.com/_sCVN1yQuK3A/TNfcYl4FG8I/AAAAAAAADI8/jpc-oc9UaMs/s1600/dhanurasana-posizione-dellarco.jpg",
      "level": "Intermediate",
      "location": "Delhi",
      "startDate": "2025-08-20",
      "startTime": "19:30",
      "type": "paid",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Morning Yoga for Beginners",
      "details": "Start your yoga journey with simple yet effective postures to improve posture and overall well-being.",
      "availableseats": "25",
      "eventmode": "online",
      "image": "https://yogajala.com/wp-content/uploads/3-49.jpg",
      "level": "Beginner",
      "location": "Virtual",
      "startDate": "2025-09-10",
      "startTime": "06:00",
      "type": "free",
      "teacher": "6868f7814d18790474561a8d"
    },
    {
      "eventName": "Yoga & Detox Retreat",
      "details": "Immerse yourself in a weekend of detoxifying yoga, mindful eating, and relaxation by the beach.",
      "availableseats": "15",
      "eventmode": "offline",
      "image": "https://wallpaperaccess.com/full/1347345.jpg",
      "level": "Advanced",
      "location": "Goa",
      "startDate": "2025-09-25",
      "startTime": "08:00",
      "type": "paid",
      "teacher": "6868f7814d18790474561a8d"
    }
  ]
  

export const addPredefinedEvents = async (req, res) => {
    try {
      const insertedClasses = await Event.insertMany(preDefineEvents);
      res.status(201).json({ message: "Predefined Events added successfully", data: insertedClasses });
    } catch (error) {
      res.status(500).json({ message: "Error adding predefined Events", error: error.message });
    }
  };