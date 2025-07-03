import { RecordedClass } from "../models/index.js";


// Get all classes
export const getAllRecordedClass = async (req, res) => {
  try {
    const classes = await RecordedClass.find().populate('teacher').exec();
    res.status(200).json({
      status: 'success',
      results: classes.length,
      data: {
        classes
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

// Get a specific class by ID
export const getRecordedClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    
    if (!classId) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Class ID is required' 
      });
    }

    const singleClass = await RecordedClass.findById(classId).populate('teacher');
    if (!singleClass) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Class not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        class: singleClass
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

// Create a new class
export const createRecordedClass = async (req, res) => {
  try {
    const { title, description, classRecordingLink, teacher } = req.body;

    // Validate required fields
    if (!title || !description || !classRecordingLink || !teacher) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title, description, class recording link, and teacher are required'
      });
    }

    const newClass = await RecordedClass.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        class: newClass
      }
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'fail',
      message: error.message 
    });
  }
};

// Update a class by ID
export const updateRecordedClass = async (req, res) => {
  try {
    const classId = req.params.id;
    
    if (!classId) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Class ID is required' 
      });
    }

    const updatedClass = await RecordedClass.findByIdAndUpdate(
      classId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Class not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        class: updatedClass
      }
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'fail',
      message: error.message 
    });
  }
};

// Delete a class by ID
export const deleteRecordedClass = async (req, res) => {
  try {
    const classId = req.params.id;
    
    if (!classId) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Class ID is required' 
      });
    }

    const deletedClass = await RecordedClass.findByIdAndDelete(classId);
    if (!deletedClass) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Class not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const updateClassStatus = async (req, res) => {
    try {
      const classId = req.params.id;
      const { status } = req.body;
  
      if (!classId) {
        return res.status(400).json({ 
          status: 'fail',
          message: 'Class ID is required' 
        });
      }

      // Validate status
      if (typeof status !== 'boolean') {
        return res.status(400).json({ 
          status: 'fail',
          message: 'Invalid status value' 
        });
      }
  
      const updatedClass = await RecordedClass.findByIdAndUpdate(
        classId,
        { status },
        { new: true }
      );
  
      if (!updatedClass) {
        return res.status(404).json({ 
          status: 'fail',
          message: 'Class not found' 
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: {
          class: updatedClass
        }
      });
    } catch (error) {
      res.status(400).json({ 
        status: 'fail',
        message: error.message 
      });
    }
  };
