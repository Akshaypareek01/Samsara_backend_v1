import httpStatus from 'http-status';
import PlatformAccountDetails from '../models/platform-account-details.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Return platform account details (bank + documents) for company portal / admin.
 *
 * @returns {Promise<object>}
 */
const getPlatformAccountDetails = async () => {
  const record = await PlatformAccountDetails.getSingleton();
  return record;
};

/**
 * Replace bank details and document list (admin only).
 *
 * @param {object} body - bankDetails and documents arrays.
 * @param {string} [adminId] - Admin user id for audit.
 * @returns {Promise<object>}
 */
const upsertPlatformAccountDetails = async (body, adminId) => {
  const record = await PlatformAccountDetails.getSingleton();

  if (body.bankDetails !== undefined) {
    record.bankDetails = {
      accountHolderName: body.bankDetails.accountHolderName ?? '',
      accountNumber: body.bankDetails.accountNumber ?? '',
      ifscCode: (body.bankDetails.ifscCode ?? '').toUpperCase(),
      bankName: body.bankDetails.bankName ?? '',
    };
  }

  if (body.documents !== undefined) {
    if (!Array.isArray(body.documents)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'documents must be an array');
    }
    record.documents = body.documents.map((doc) => ({
      title: doc.title ?? '',
      documentNumber: doc.documentNumber ?? '',
      fileUrl: doc.fileUrl,
      fileName: doc.fileName ?? '',
    }));
  }

  if (adminId) {
    record.updatedBy = adminId;
  }

  await record.save();
  return record;
};

export { getPlatformAccountDetails, upsertPlatformAccountDetails };
