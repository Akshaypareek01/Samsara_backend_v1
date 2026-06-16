/**
 * Export app users (students + teachers) to an Excel-compatible CSV file.
 *
 * Usage:
 *   node src/scripts/export-app-users.js
 */

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import config from '../config/config.js';
import { User } from '../models/index.js';

const HEADERS = ['Name', 'Email', 'Mobile Number', 'City', 'Category'];

/**
 * Escape a value for CSV output.
 * @param {unknown} value - Cell value.
 * @returns {string} Escaped CSV cell.
 */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * Build CSV content with UTF-8 BOM for Excel.
 * @param {string[]} headers - Column headers.
 * @param {Record<string, string>[]} rows - Data rows.
 * @returns {string} CSV file content.
 */
function toExcelCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(','));
  }
  return `\uFEFF${lines.join('\n')}\n`;
}

/**
 * Map user role to export category label.
 * @param {string} role - User role from database.
 * @returns {'Teacher'|'Student'} Export category.
 */
function mapCategory(role) {
  return role === 'teacher' ? 'Teacher' : 'Student';
}

/**
 * Export all Users collection records to CSV.
 * @returns {Promise<void>}
 */
async function main() {
  const outDir = path.join(process.cwd(), 'exports');
  await fs.mkdir(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(outDir, `app_users_${stamp}.csv`);

  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected to MongoDB');

  const users = await User.find({ role: { $in: ['user', 'teacher'] } })
    .select('name email mobile city role userCategory')
    .sort({ role: 1, name: 1 })
    .lean();

  const rows = users.map((user) => ({
    Name: user.name ?? '',
    Email: user.email ?? '',
    'Mobile Number': user.mobile ?? '',
    City: user.city ?? '',
    Category: mapCategory(user.role),
  }));

  await fs.writeFile(filePath, toExcelCsv(HEADERS, rows), 'utf8');

  const students = rows.filter((row) => row.Category === 'Student').length;
  const teachers = rows.filter((row) => row.Category === 'Teacher').length;

  console.log(`Exported ${rows.length} users -> ${filePath}`);
  console.log(`  Students: ${students}`);
  console.log(`  Teachers: ${teachers}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
