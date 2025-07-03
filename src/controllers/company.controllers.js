import Company from "../models/company.model.js";


const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Create a new company
export const createCompany = async (req, res) => {
  try {
    let companyId;
    let isUnique = false;

    while (!isUnique) {
      companyId = generateUniqueId();
      const existingCompany = await Company.findOne({ companyId });
      if (!existingCompany) isUnique = true;
    }

    const company = await Company.create({ ...req.body, companyId });
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const checkCompanyExists = async (req, res) => {
  try {
      const { companyId } = req.params;

      // Check if the company exists
      const companyExists = await Company.exists({ companyId });

      res.status(200).json({
          exists: companyExists ? true : false
      });

  } catch (error) {
      console.error("Error checking company existence:", error);
      res.status(500).json({
          status: 'fail',
          message: 'Internal Server Error',
          error: error.message
      });
  }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get a company by ID
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update a company by ID
export const updateCompanyById = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete a company by ID
export const deleteCompanyById = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
