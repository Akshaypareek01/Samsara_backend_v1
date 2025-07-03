import { Assessment } from "../models/index.js";


export const createAssessment = async (req, res) => {
  try {
    const newAssessment = await Assessment.create(req.body);
    res.json({ success: true, data: newAssessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find();
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAssessmentById = async (req, res) => {
  const { assessmentId } = req.params;
  try {
    const foundAssessment = await Assessment.findById(assessmentId);
    res.json({ success: true, data: foundAssessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAssessment = async (req, res) => {
  const { assessmentId } = req.params;
  const updatedData = req.body;
  try {
    const updatedAssessment = await Assessment.findByIdAndUpdate(assessmentId, updatedData, { new: true });
    res.json({ success: true, data: updatedAssessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAssessment = async (req, res) => {
  const { assessmentId } = req.params;
  try {
    const deletedAssessment = await Assessment.findByIdAndDelete(assessmentId);
    res.json({ success: true, data: deletedAssessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Additional controllers for assessment-related functionalities can be added here
