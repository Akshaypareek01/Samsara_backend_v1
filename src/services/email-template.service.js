import httpStatus from 'http-status';
import EmailTemplate from '../models/email-template.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * @param {Object} body
 * @returns {Promise<EmailTemplate>}
 */
const createTemplate = async (body) => EmailTemplate.create(body);

/**
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryTemplates = async (filter, options) => EmailTemplate.paginate(filter, options);

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<EmailTemplate|null>}
 */
const getTemplateById = async (id) => EmailTemplate.findById(id);

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @param {Object} updateBody
 * @returns {Promise<EmailTemplate>}
 */
const updateTemplateById = async (id, updateBody) => {
  const template = await getTemplateById(id);
  if (!template) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  Object.assign(template, updateBody);
  await template.save();
  return template;
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<void>}
 */
const deleteTemplateById = async (id) => {
  const template = await getTemplateById(id);
  if (!template) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  await template.deleteOne();
};

export { createTemplate, queryTemplates, getTemplateById, updateTemplateById, deleteTemplateById };
