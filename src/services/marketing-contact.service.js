import httpStatus from 'http-status';
import ExcelJS from 'exceljs';
import MarketingContact from '../models/marketing-contact.model.js';
import MarketingFolder from '../models/marketing-folder.model.js';
import ApiError from '../utils/ApiError.js';

const TEMPLATE_HEADERS = ['Name', 'Email', 'Phone', 'Company', 'Tags', 'Folder'];

/**
 * Build Mongo filter for marketing contact list queries.
 * @param {Record<string, unknown>} query
 * @returns {Promise<Object>}
 */
const buildContactFilter = async (query) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.folderId) filter.folderId = query.folderId;

  if (query.search && String(query.search).trim()) {
    const term = String(query.search).trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { company: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
    ];
  }

  if (query.tag && String(query.tag).trim()) {
    filter.tags = { $regex: String(query.tag).trim(), $options: 'i' };
  }

  return filter;
};

/**
 * @param {Object} body
 * @returns {Promise<MarketingContact>}
 */
const createContact = async (body) => {
  const existing = await MarketingContact.findOne({ email: body.email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A contact with this email already exists');
  }
  return MarketingContact.create(body);
};

/**
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryContacts = async (filter, options) => {
  return MarketingContact.paginate(filter, {
    ...options,
    populate: 'folderId',
  });
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<MarketingContact|null>}
 */
const getContactById = async (id) => MarketingContact.findById(id).populate('folderId');

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @param {Object} updateBody
 * @returns {Promise<MarketingContact>}
 */
const updateContactById = async (id, updateBody) => {
  const contact = await getContactById(id);
  if (!contact) throw new ApiError(httpStatus.NOT_FOUND, 'Contact not found');

  if (updateBody.email && updateBody.email.toLowerCase() !== contact.email) {
    const dup = await MarketingContact.findOne({ email: updateBody.email.toLowerCase().trim(), _id: { $ne: id } });
    if (dup) throw new ApiError(httpStatus.BAD_REQUEST, 'A contact with this email already exists');
  }

  Object.assign(contact, updateBody);
  await contact.save();
  return contact;
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<void>}
 */
const deleteContactById = async (id) => {
  const contact = await getContactById(id);
  if (!contact) throw new ApiError(httpStatus.NOT_FOUND, 'Contact not found');
  await contact.deleteOne();
};

/**
 * @returns {Promise<ExcelJS.Workbook>}
 */
const buildImportTemplateWorkbook = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Contacts');
  sheet.addRow(TEMPLATE_HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(['Jane Doe', 'jane@example.com', '9876543210', 'Acme Corp', 'vip,client', 'Mumbai Clients']);
  return workbook;
};

/**
 * @param {Object} filter
 * @returns {Promise<ExcelJS.Workbook>}
 */
const buildExportWorkbook = async (filter) => {
  const contacts = await MarketingContact.find(filter).populate('folderId').sort({ createdAt: -1 }).limit(10000);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Contacts');
  sheet.addRow(TEMPLATE_HEADERS);
  sheet.getRow(1).font = { bold: true };

  contacts.forEach((c) => {
    sheet.addRow([
      c.name,
      c.email,
      c.phone || '',
      c.company || '',
      (c.tags || []).join(','),
      c.folderId?.name || '',
    ]);
  });

  return workbook;
};

/**
 * Resolve folder by name for import rows.
 * @param {string} folderName
 * @param {Map<string, import('mongoose').Types.ObjectId>} cache
 * @returns {Promise<import('mongoose').Types.ObjectId|null>}
 */
const resolveFolderIdByName = async (folderName, cache) => {
  const trimmed = String(folderName || '').trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  let folder = await MarketingFolder.findOne({
    name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (!folder) {
    folder = await MarketingFolder.create({ name: trimmed });
  }
  cache.set(key, folder._id);
  return folder._id;
};

/**
 * @param {Buffer} fileBuffer
 * @returns {Promise<{ imported: number, failed: number, errors: Array<{ row: number, message: string }> }>}
 */
const importContactsFromExcel = async (fileBuffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file has no worksheets');

  const headerRow = sheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value || '').trim().toLowerCase();
    if (key) headerMap[key] = colNumber;
  });

  const col = (names) => {
    for (const n of names) {
      if (headerMap[n] != null) return headerMap[n];
    }
    return null;
  };

  const nameCol = col(['name']);
  const emailCol = col(['email']);
  if (!nameCol || !emailCol) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Excel must include Name and Email columns');
  }

  const folderCache = new Map();
  let imported = 0;
  let failed = 0;
  const errors = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const name = String(row.getCell(nameCol).value || '').trim();
    const email = String(row.getCell(emailCol).value || '').trim().toLowerCase();
    if (!name && !email) continue;

    try {
      if (!name || !email) throw new Error('Name and Email are required');
      const phoneCol = col(['phone', 'mobile']);
      const companyCol = col(['company']);
      const tagsCol = col(['tags']);
      const folderCol = col(['folder']);

      const phone = phoneCol ? String(row.getCell(phoneCol).value || '').trim() : '';
      const company = companyCol ? String(row.getCell(companyCol).value || '').trim() : '';
      const tagsRaw = tagsCol ? String(row.getCell(tagsCol).value || '').trim() : '';
      const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const folderName = folderCol ? String(row.getCell(folderCol).value || '').trim() : '';
      const folderId = await resolveFolderIdByName(folderName, folderCache);

      const existing = await MarketingContact.findOne({ email });
      if (existing) {
        existing.name = name;
        existing.phone = phone;
        existing.company = company;
        existing.tags = tags;
        if (folderId) existing.folderId = folderId;
        existing.source = 'import';
        await existing.save();
      } else {
        await MarketingContact.create({ name, email, phone, company, tags, folderId, source: 'import' });
      }
      imported += 1;
    } catch (err) {
      failed += 1;
      errors.push({ row: rowNumber, message: err.message || 'Import failed' });
    }
  }

  return { imported, failed, errors };
};

export {
  TEMPLATE_HEADERS,
  buildContactFilter,
  createContact,
  queryContacts,
  getContactById,
  updateContactById,
  deleteContactById,
  buildImportTemplateWorkbook,
  buildExportWorkbook,
  importContactsFromExcel,
};
