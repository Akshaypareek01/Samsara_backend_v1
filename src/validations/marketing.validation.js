import Joi from 'joi';
import { objectId } from './custom.validation.js';

const paginationQuery = {
  sortBy: Joi.string(),
  limit: Joi.number().integer().min(1).max(100),
  page: Joi.number().integer().min(1),
};

const createContact = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email(),
    phone: Joi.string().allow('', null).optional(),
    company: Joi.string().allow('', null).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    folderId: Joi.string().custom(objectId).allow(null).optional(),
    status: Joi.string().valid('active', 'unsubscribed').optional(),
  }),
};

const getContacts = {
  query: Joi.object().keys({
    ...paginationQuery,
    search: Joi.string().allow(''),
    folderId: Joi.string().custom(objectId),
    tag: Joi.string().allow(''),
    status: Joi.string().valid('active', 'unsubscribed'),
  }),
};

const exportContacts = {
  query: Joi.object().keys({
    search: Joi.string().allow(''),
    folderId: Joi.string().custom(objectId),
    tag: Joi.string().allow(''),
    status: Joi.string().valid('active', 'unsubscribed'),
  }),
};

const contactIdParam = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateContact = {
  ...contactIdParam,
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      email: Joi.string().email(),
      phone: Joi.string().allow('', null),
      company: Joi.string().allow('', null),
      tags: Joi.array().items(Joi.string()),
      folderId: Joi.string().custom(objectId).allow(null),
      status: Joi.string().valid('active', 'unsubscribed'),
    })
    .min(1),
};

const createFolder = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    description: Joi.string().allow('', null).optional(),
    status: Joi.boolean().optional(),
  }),
};

const getFolders = {
  query: Joi.object().keys({
    ...paginationQuery,
    search: Joi.string().allow(''),
  }),
};

const folderIdParam = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateFolder = {
  ...folderIdParam,
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      description: Joi.string().allow('', null),
      status: Joi.boolean(),
    })
    .min(1),
};

const createTemplate = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    subject: Joi.string().required().trim(),
    bodyHtml: Joi.string().allow('', null).optional(),
    bodyText: Joi.string().allow('', null).optional(),
    status: Joi.boolean().optional(),
  }),
};

const getTemplates = {
  query: Joi.object().keys({
    ...paginationQuery,
    search: Joi.string().allow(''),
  }),
};

const templateIdParam = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateTemplate = {
  ...templateIdParam,
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      subject: Joi.string().trim(),
      bodyHtml: Joi.string().allow('', null),
      bodyText: Joi.string().allow('', null),
      status: Joi.boolean(),
    })
    .min(1),
};

const createCampaign = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    subject: Joi.string().required().trim(),
    bodyHtml: Joi.string().allow('', null).optional(),
    bodyText: Joi.string().allow('', null).optional(),
    templateId: Joi.string().custom(objectId).allow(null).optional(),
    folderId: Joi.string().custom(objectId).allow(null).optional(),
    contactId: Joi.string().custom(objectId).allow(null).optional(),
  }),
};

const getCampaigns = {
  query: Joi.object().keys({
    ...paginationQuery,
    status: Joi.string().valid('draft', 'sending', 'sent', 'partial', 'failed'),
    search: Joi.string().allow(''),
  }),
};

const campaignIdParam = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateCampaign = {
  ...campaignIdParam,
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      subject: Joi.string().trim(),
      bodyHtml: Joi.string().allow('', null),
      bodyText: Joi.string().allow('', null),
      templateId: Joi.string().custom(objectId).allow(null),
      folderId: Joi.string().custom(objectId).allow(null),
      contactId: Joi.string().custom(objectId).allow(null),
    })
    .min(1),
};

export {
  createContact,
  getContacts,
  exportContacts,
  updateContact,
  contactIdParam,
  createFolder,
  getFolders,
  updateFolder,
  folderIdParam,
  createTemplate,
  getTemplates,
  updateTemplate,
  templateIdParam,
  createCampaign,
  getCampaigns,
  updateCampaign,
  campaignIdParam,
};
