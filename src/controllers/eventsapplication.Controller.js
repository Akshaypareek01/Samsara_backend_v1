import { EventApplication } from '../models/index.js';

// Create a new event application
export const createEventApplication = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    const newApplication = new EventApplication({ eventId, userId });
    await newApplication.save();
    res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all event applications
export const getAllEventApplications = async (req, res) => {
  try {
    const applications = await EventApplication.find().populate('eventId userId');
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a single event application by ID
export const getEventApplicationById = async (req, res) => {
  try {
    const application = await EventApplication.findById(req.params.id).populate('eventId userId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update an event application by ID
export const updateEventApplication = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    const application = await EventApplication.findByIdAndUpdate(req.params.id, { eventId, userId }, { new: true });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json({ message: 'Application updated successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete an event application by ID
export const deleteEventApplication = async (req, res) => {
  try {
    const application = await EventApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getEventsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const eventApplications = await EventApplication.find({ userId }).populate('eventId').exec();

    res.status(200).json(eventApplications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
};
