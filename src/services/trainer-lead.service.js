import httpStatus from 'http-status';
import ExcelJS from 'exceljs';
import { TrainerLead } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create a trainer lead (quick/partial registration submission).
 * @param {Object} leadBody
 * @returns {Promise<TrainerLead>}
 */
const createTrainerLead = async (leadBody) => {
  return TrainerLead.create(leadBody);
};

/**
 * Builds a Mongoose filter from API query params.
 * @param {Object} filter - Raw query fields from the client.
 * @returns {Object}
 */
const buildTrainerLeadQueryFilter = (filter = {}) => {
  const mongo = {};

  if (filter.name) {
    const term = String(filter.name).trim();
    if (term) {
      const regex = { $regex: term, $options: 'i' };
      mongo.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
    }
  }
  if (filter.city) {
    mongo.city = filter.city;
  }
  if (filter.specialization) {
    mongo.specialization = filter.specialization;
  }
  if (filter.experience) {
    mongo.experience = filter.experience;
  }
  if (filter.status) {
    mongo.status = filter.status;
  }

  return mongo;
};

/**
 * Query for trainer leads with pagination.
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options (sortBy, limit, page)
 * @returns {Promise<QueryResult>}
 */
const queryTrainerLeads = async (filter, options) => {
  return TrainerLead.paginate(filter, options);
};

/**
 * Get a trainer lead by id.
 * @param {ObjectId} id
 * @returns {Promise<TrainerLead>}
 */
const getTrainerLeadById = async (id) => {
  return TrainerLead.findById(id);
};

/**
 * Update a trainer lead (admin triage status only).
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<TrainerLead>}
 */
const updateTrainerLeadById = async (id, updateBody) => {
  const lead = await TrainerLead.findByIdAndUpdate(id, { $set: updateBody }, { new: true, runValidators: true });
  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer lead not found');
  }
  return lead;
};

/**
 * Delete a trainer lead by id.
 * @param {ObjectId} id
 * @returns {Promise<TrainerLead>}
 */
const deleteTrainerLeadById = async (id) => {
  const lead = await getTrainerLeadById(id);
  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer lead not found');
  }
  await lead.deleteOne();
  return lead;
};

/**
 * Build an in-memory Excel workbook of trainer leads matching the given filter
 * (no pagination — exports the full filtered set).
 * @param {Object} filter - Mongo filter
 * @returns {Promise<ExcelJS.Workbook>}
 */
const buildTrainerLeadsWorkbook = async (filter) => {
  const leads = await TrainerLead.find(filter).sort({ createdAt: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Trainer Leads');

  sheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Specialization', key: 'specialization', width: 20 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'PIN Code', key: 'pinCode', width: 12 },
    { header: 'Experience', key: 'experience', width: 16 },
    { header: 'LinkedIn', key: 'linkedin', width: 35 },
    { header: 'Instagram', key: 'instagram', width: 35 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Submitted On', key: 'createdAt', width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  leads.forEach((lead) => {
    sheet.addRow({
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      specialization: lead.specialization,
      city: lead.city,
      pinCode: lead.pinCode,
      experience: lead.experience,
      linkedin: lead.linkedin || '',
      instagram: lead.instagram || '',
      status: lead.status,
      createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN') : '',
    });
  });

  return workbook;
};

export default {
  createTrainerLead,
  buildTrainerLeadQueryFilter,
  queryTrainerLeads,
  getTrainerLeadById,
  updateTrainerLeadById,
  deleteTrainerLeadById,
  buildTrainerLeadsWorkbook,
};
