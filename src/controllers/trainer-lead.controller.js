import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import trainerLeadService from '../services/trainer-lead.service.js';

/**
 * Create a trainer lead (public quick/partial registration submission).
 */
const createTrainerLead = catchAsync(async (req, res) => {
  const lead = await trainerLeadService.createTrainerLead(req.body);
  res.status(httpStatus.CREATED).send(lead);
});

/**
 * Get all trainer leads with pagination and filtering (admin only).
 */
const getAllTrainerLeads = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'city', 'specialization', 'experience', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (!options.sortBy) {
    options.sortBy = 'createdAt:desc';
  }
  const mongoFilter = trainerLeadService.buildTrainerLeadQueryFilter(filter);
  const result = await trainerLeadService.queryTrainerLeads(mongoFilter, options);
  res.send(result);
});

/**
 * Update a trainer lead's triage status (admin only).
 */
const updateTrainerLead = catchAsync(async (req, res) => {
  const lead = await trainerLeadService.updateTrainerLeadById(req.params.id, req.body);
  res.send(lead);
});

/**
 * Delete a trainer lead (admin only).
 */
const deleteTrainerLead = catchAsync(async (req, res) => {
  await trainerLeadService.deleteTrainerLeadById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Export trainer leads matching the given filter as an .xlsx file (admin only).
 */
const exportTrainerLeads = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'city', 'specialization', 'experience', 'status']);
  const mongoFilter = trainerLeadService.buildTrainerLeadQueryFilter(filter);
  const workbook = await trainerLeadService.buildTrainerLeadsWorkbook(mongoFilter);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="trainer-leads-${Date.now()}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

export { createTrainerLead, getAllTrainerLeads, updateTrainerLead, deleteTrainerLead, exportTrainerLeads };
