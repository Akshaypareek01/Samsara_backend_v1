import { Meeting } from "../models/index.js";

export const createMeeting = async (req, res) => {
  try {
    const {
      meetingName,
      title,
      duration,
      meetingId,
      meetingPassword,
      hostName,
      teacherName,
    } = req.body;

    // Validate required fields
    if (!meetingName || !title || !duration || !meetingId || !hostName || !teacherName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Meeting name, title, duration, meeting ID, host name, and teacher name are required'
      });
    }

    // Save meeting details to the database
    const newMeeting = new Meeting({
      meetingName,
      title,
      duration,
      meetingId,
      meetingPassword,
      hostName,
      teacherName,
    });
    
    await newMeeting.save();

    res.status(201).json({
      status: 'success',
      data: {
        meeting: newMeeting
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
}

export const getMeetingData = async (req, res) => {
    try {
      const { meetingId } = req.params;
  
      // Retrieve meeting details from the database
      const meeting = meetingId 
        ? await Meeting.findOne({ meetingId })
        : await Meeting.find();
  
      if (!meeting) {
        return res.status(404).json({ 
          status: 'fail',
          message: 'Meeting not found' 
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: {
          meeting
        }
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        message: error.message 
      });
    }
  }


  
