import mongoose from 'mongoose';
import { Booking, CompanyUser } from '../models/index.js';

/**
 * Escape CSV field
 *
 * @param {string|number|undefined|null} v
 */
const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const activeOnly = () => ({
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
});

/**
 * Build CSV export for company-scoped data.
 *
 * @param {string} companyMongoId
 * @param {'bookings'|'employees'} type
 * @returns {Promise<string>}
 */
export const buildCompanyCsvExport = async (companyMongoId, type) => {
  const cid = mongoose.Types.ObjectId.isValid(companyMongoId)
    ? new mongoose.Types.ObjectId(companyMongoId)
    : companyMongoId;

  if (type === 'bookings') {
    const rows = await Booking.find({ company: cid })
      .populate('trainer', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    const header = [
      'id',
      'bookingDate',
      'startTime',
      'status',
      'duration',
      'employeeCount',
      'typeOfTraining',
      'trainerName',
      'notes',
      'createdAt',
    ].join(',');
    const lines = rows.map((b) =>
      [
        csvCell(b._id?.toString()),
        csvCell(b.bookingDate),
        csvCell(b.startTime),
        csvCell(b.status),
        csvCell(b.duration),
        csvCell(b.employeeCount),
        csvCell(Array.isArray(b.typeOfTraining) ? b.typeOfTraining.join('|') : b.typeOfTraining),
        csvCell(typeof b.trainer === 'object' && b.trainer ? b.trainer.name : ''),
        csvCell(b.notes),
        csvCell(b.createdAt ? new Date(b.createdAt).toISOString() : ''),
      ].join(',')
    );
    return [header, ...lines].join('\n');
  }

  const rows = await CompanyUser.find({ companyId: cid, ...activeOnly() })
    .sort({ createdAt: -1 })
    .lean();
  const header = ['id', 'fullName', 'email', 'level', 'department', 'status', 'createdAt'].join(',');
  const lines = rows.map((u) =>
    [
      csvCell(u._id?.toString()),
      csvCell(u.fullName),
      csvCell(u.email),
      csvCell(u.level),
      csvCell(u.department),
      csvCell(u.status),
      csvCell(u.createdAt ? new Date(u.createdAt).toISOString() : ''),
    ].join(',')
  );
  return [header, ...lines].join('\n');
};
