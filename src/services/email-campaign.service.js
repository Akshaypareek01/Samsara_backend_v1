import httpStatus from 'http-status';
import EmailCampaign from '../models/email-campaign.model.js';
import MarketingContact from '../models/marketing-contact.model.js';
import ApiError from '../utils/ApiError.js';
import { sendEmail } from './email.service.js';

/**
 * @param {Object} body
 * @returns {Promise<EmailCampaign>}
 */
const createCampaign = async (body) => EmailCampaign.create(body);

/**
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryCampaigns = async (filter, options) =>
  EmailCampaign.paginate(filter, {
    ...options,
    populate: 'folderId,contactId,templateId',
  });

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<EmailCampaign|null>}
 */
const getCampaignById = async (id) =>
  EmailCampaign.findById(id).populate('folderId').populate('contactId').populate('templateId');

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @param {Object} updateBody
 * @returns {Promise<EmailCampaign>}
 */
const updateCampaignById = async (id, updateBody) => {
  const campaign = await getCampaignById(id);
  if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  if (['sending', 'sent'].includes(campaign.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot edit a campaign that has already been sent');
  }
  Object.assign(campaign, updateBody);
  await campaign.save();
  return campaign;
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<void>}
 */
const deleteCampaignById = async (id) => {
  const campaign = await getCampaignById(id);
  if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  if (campaign.status === 'sending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete a campaign while sending');
  }
  await campaign.deleteOne();
};

/**
 * Resolve recipients for a campaign.
 * @param {EmailCampaign} campaign
 * @returns {Promise<MarketingContact[]>}
 */
const resolveRecipients = async (campaign) => {
  if (campaign.contactId) {
    const contact = await MarketingContact.findById(campaign.contactId);
    return contact && contact.status === 'active' ? [contact] : [];
  }
  if (campaign.folderId) {
    return MarketingContact.find({ folderId: campaign.folderId, status: 'active' });
  }
  return [];
};

/**
 * Send campaign emails via SES.
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<EmailCampaign>}
 */
const sendCampaign = async (id) => {
  const campaign = await getCampaignById(id);
  if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  if (['sending', 'sent'].includes(campaign.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Campaign has already been sent');
  }

  const recipients = await resolveRecipients(campaign);
  if (!recipients.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active recipients found for this campaign');
  }

  campaign.status = 'sending';
  campaign.stats = { total: recipients.length, sent: 0, failed: 0 };
  await campaign.save();

  let sent = 0;
  let failed = 0;

  for (const contact of recipients) {
    try {
      const html = campaign.bodyHtml || `<p>${(campaign.bodyText || '').replace(/\n/g, '<br/>')}</p>`;
      const text = campaign.bodyText || campaign.bodyHtml?.replace(/<[^>]+>/g, ' ') || '';
      await sendEmail(contact.email, campaign.subject, text, html);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`Campaign send failed for ${contact.email}:`, err.message);
    }
  }

  campaign.stats = { total: recipients.length, sent, failed };
  campaign.sentAt = new Date();
  if (failed === 0) campaign.status = 'sent';
  else if (sent === 0) campaign.status = 'failed';
  else campaign.status = 'partial';
  await campaign.save();

  return campaign;
};

export {
  createCampaign,
  queryCampaigns,
  getCampaignById,
  updateCampaignById,
  deleteCampaignById,
  sendCampaign,
};
