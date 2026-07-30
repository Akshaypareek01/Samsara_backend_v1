import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import * as contactService from '../services/marketing-contact.service.js';
import * as folderService from '../services/marketing-folder.service.js';
import * as templateService from '../services/email-template.service.js';
import * as campaignService from '../services/email-campaign.service.js';

// --- Contacts ---

const createContact = catchAsync(async (req, res) => {
  const contact = await contactService.createContact(req.body);
  res.status(httpStatus.CREATED).send(contact);
});

const getContacts = catchAsync(async (req, res) => {
  const filter = await contactService.buildContactFilter(req.query);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await contactService.queryContacts(filter, options);
  res.send(result);
});

const getContact = catchAsync(async (req, res) => {
  const contact = await contactService.getContactById(req.params.id);
  if (!contact) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Contact not found' });
  }
  res.send(contact);
});

const updateContact = catchAsync(async (req, res) => {
  const contact = await contactService.updateContactById(req.params.id, req.body);
  res.send(contact);
});

const deleteContact = catchAsync(async (req, res) => {
  await contactService.deleteContactById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const exportContacts = catchAsync(async (req, res) => {
  const filter = await contactService.buildContactFilter(req.query);
  const workbook = await contactService.buildExportWorkbook(filter);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="marketing-contacts-${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

const downloadImportTemplate = catchAsync(async (req, res) => {
  const workbook = await contactService.buildImportTemplateWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="marketing-contacts-template.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

const importContacts = catchAsync(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'Excel file is required' });
  }
  const result = await contactService.importContactsFromExcel(req.file.buffer);
  res.send({ success: true, ...result });
});

// --- Folders ---

const createFolder = catchAsync(async (req, res) => {
  const folder = await folderService.createFolder(req.body);
  res.status(httpStatus.CREATED).send(folder);
});

const getFolders = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search).trim(), $options: 'i' };
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await folderService.queryFolders(filter, options);
  res.send(result);
});

const updateFolder = catchAsync(async (req, res) => {
  const folder = await folderService.updateFolderById(req.params.id, req.body);
  res.send(folder);
});

const deleteFolder = catchAsync(async (req, res) => {
  await folderService.deleteFolderById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

// --- Templates ---

const createTemplate = catchAsync(async (req, res) => {
  const template = await templateService.createTemplate(req.body);
  res.status(httpStatus.CREATED).send(template);
});

const getTemplates = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search).trim(), $options: 'i' };
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await templateService.queryTemplates(filter, options);
  res.send(result);
});

const updateTemplate = catchAsync(async (req, res) => {
  const template = await templateService.updateTemplateById(req.params.id, req.body);
  res.send(template);
});

const deleteTemplate = catchAsync(async (req, res) => {
  await templateService.deleteTemplateById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

// --- Campaigns ---

const createCampaign = catchAsync(async (req, res) => {
  const campaign = await campaignService.createCampaign({
    ...req.body,
    createdBy: req.user?.id || null,
  });
  res.status(httpStatus.CREATED).send(campaign);
});

const getCampaigns = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status']);
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search).trim(), $options: 'i' };
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await campaignService.queryCampaigns(filter, options);
  res.send(result);
});

const updateCampaign = catchAsync(async (req, res) => {
  const campaign = await campaignService.updateCampaignById(req.params.id, req.body);
  res.send(campaign);
});

const deleteCampaign = catchAsync(async (req, res) => {
  await campaignService.deleteCampaignById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendCampaign = catchAsync(async (req, res) => {
  const campaign = await campaignService.sendCampaign(req.params.id);
  res.send({ success: true, data: campaign });
});

export {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  exportContacts,
  downloadImportTemplate,
  importContacts,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  createCampaign,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
};
