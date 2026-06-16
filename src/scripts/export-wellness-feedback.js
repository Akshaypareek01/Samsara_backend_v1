/**
 * Export corporate wellness feedback form submissions to Excel-compatible CSV.
 *
 * Usage:
 *   node src/scripts/export-wellness-feedback.js
 */

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import config from '../config/config.js';
import WellnessFeedback from '../models/wellness-feedback.model.js';

const SESSION_LABELS = {
  yoga: 'Yoga & Mindfulness',
  mental: 'Mental Wellbeing Session',
  sound: 'Sound Healing',
  ayurveda: 'Ayurveda & Lifestyle Wellness',
  other: 'Other',
};

const HEADERS = [
  'Submitted At',
  'Employee Name',
  'Email',
  'Company Name',
  'Session Date',
  'Sessions Attended',
  'Session Other',
  'Trainer Mode',
  'Trainer 1 Name',
  'T1 Knowledge',
  'T1 Communication',
  'T1 Engagement',
  'T1 Energy',
  'T1 Usefulness',
  'T1 Liked Most',
  'T1 Suggestions',
  'Trainer 2 Name',
  'T2 Knowledge',
  'T2 Communication',
  'T2 Engagement',
  'T2 Energy',
  'T2 Usefulness',
  'T2 Liked Most',
  'T2 Suggestions',
  'Overall Satisfaction',
  'Enjoyed Activities',
  'Stress Relief',
  'Want More Sessions',
  'Preferred Topics',
  'Additional Comments',
  'Profile Complete',
];

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
 * Map session codes to readable labels.
 * @param {string[]} sessions - Stored session values.
 * @returns {string} Joined readable labels.
 */
function formatSessions(sessions = []) {
  return sessions.map((session) => SESSION_LABELS[session] || session).join('; ');
}

/**
 * Find trainer feedback block by trainer number.
 * @param {Array<Object>} trainers - Trainer feedback array.
 * @param {number} trainerNumber - Trainer block number.
 * @returns {Object|null} Trainer feedback object.
 */
function getTrainer(trainers, trainerNumber) {
  return trainers.find((trainer) => trainer.trainerNumber === trainerNumber) || null;
}

/**
 * Format ISO date for spreadsheet display.
 * @param {Date|string|null|undefined} value - Date value.
 * @returns {string} Formatted date or empty string.
 */
function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * Format timestamp for spreadsheet display.
 * @param {Date|string|null|undefined} value - Timestamp value.
 * @returns {string} Formatted datetime or empty string.
 */
function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Determine whether the respondent filled core profile fields.
 * @param {Object} doc - Feedback document.
 * @returns {'Yes'|'Partial'|'No'} Completeness label.
 */
function profileComplete(doc) {
  const filled = [
    Boolean(doc.employeeName?.trim()),
    Boolean(doc.email?.trim()),
    Boolean(doc.companyName?.trim()),
  ].filter(Boolean).length;

  if (filled === 3) return 'Yes';
  if (filled > 0) return 'Partial';
  return 'No';
}

/**
 * Flatten one feedback document into a CSV row.
 * @param {Object} doc - Feedback document.
 * @returns {Record<string, string>} CSV row.
 */
function toRow(doc) {
  const trainer1 = getTrainer(doc.trainers, 1);
  const trainer2 = getTrainer(doc.trainers, 2);

  return {
    'Submitted At': formatDateTime(doc.createdAt),
    'Employee Name': doc.employeeName || '',
    Email: doc.email || '',
    'Company Name': doc.companyName || '',
    'Session Date': formatDate(doc.sessionDate),
    'Sessions Attended': formatSessions(doc.sessionsAttended),
    'Session Other': doc.sessionOther || '',
    'Trainer Mode': doc.trainerMode || '',
    'Trainer 1 Name': trainer1?.name || '',
    'T1 Knowledge': trainer1?.ratings?.knowledge ?? '',
    'T1 Communication': trainer1?.ratings?.communication ?? '',
    'T1 Engagement': trainer1?.ratings?.engagement ?? '',
    'T1 Energy': trainer1?.ratings?.energy ?? '',
    'T1 Usefulness': trainer1?.ratings?.usefulness ?? '',
    'T1 Liked Most': trainer1?.likedMost || '',
    'T1 Suggestions': trainer1?.suggestions || '',
    'Trainer 2 Name': trainer2?.name || '',
    'T2 Knowledge': trainer2?.ratings?.knowledge ?? '',
    'T2 Communication': trainer2?.ratings?.communication ?? '',
    'T2 Engagement': trainer2?.ratings?.engagement ?? '',
    'T2 Energy': trainer2?.ratings?.energy ?? '',
    'T2 Usefulness': trainer2?.ratings?.usefulness ?? '',
    'T2 Liked Most': trainer2?.likedMost || '',
    'T2 Suggestions': trainer2?.suggestions || '',
    'Overall Satisfaction': doc.overallSatisfaction || '',
    'Enjoyed Activities': (doc.enjoyedActivities || []).join('; '),
    'Stress Relief': doc.stressRelief || '',
    'Want More Sessions': doc.wantMoreSessions || '',
    'Preferred Topics': (doc.preferredTopics || []).join('; '),
    'Additional Comments': doc.additionalComments || '',
    'Profile Complete': profileComplete(doc),
  };
}

/**
 * Export all wellness feedback submissions.
 * @returns {Promise<void>}
 */
async function main() {
  const outDir = path.join(process.cwd(), 'exports');
  await fs.mkdir(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(outDir, `wellness_feedback_${stamp}.csv`);

  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected to MongoDB');

  const submissions = await WellnessFeedback.find({}).sort({ createdAt: -1 }).lean();
  const rows = submissions.map(toRow);

  await fs.writeFile(filePath, toExcelCsv(HEADERS, rows), 'utf8');

  const completeProfiles = rows.filter((row) => row['Profile Complete'] === 'Yes').length;
  const partialProfiles = rows.filter((row) => row['Profile Complete'] === 'Partial').length;
  const emptyProfiles = rows.filter((row) => row['Profile Complete'] === 'No').length;

  const satisfactionCounts = submissions.reduce((acc, item) => {
    const key = item.overallSatisfaction || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(`Exported ${rows.length} feedback submissions -> ${filePath}`);
  console.log(`Profile complete: ${completeProfiles}`);
  console.log(`Profile partial: ${partialProfiles}`);
  console.log(`Profile empty: ${emptyProfiles}`);
  console.log('Overall satisfaction breakdown:', satisfactionCounts);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
