import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';
import { User } from '../models/user.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Escape a value for CSV (RFC-style: quote if needed).
 * @param {unknown} val
 * @returns {string}
 */
function csvCell(val) {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return csvCell(val.join('; '));
  if (typeof val === 'object') return csvCell(JSON.stringify(val));
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {string[]} headers
 * @param {Record<string, unknown>[]} rows
 * @returns {string}
 */
function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const outDir = path.join(process.cwd(), 'exports');
  await fs.mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected to MongoDB');

  const trainers = await Trainer.find({})
    .select(
      'name email mobile title bio specialistIn typeOfTraining status profilePhoto createdAt updatedAt'
    )
    .lean();

  const teachers = await User.find({ role: 'teacher' })
    .select(
      '-password -passwordResetToken -passwordResetExpires -notificationToken -attendance -classFeedback -assessments -favoriteClasses -favoriteEvents -favoriteTeachers'
    )
    .lean();

  const trainerHeaders = [
    'name',
    'email',
    'phone',
    'age',
    'gender',
    'title',
    'bio',
    'specialistIn',
    'typeOfTraining',
    'status',
    'profilePhotoPath',
    'createdAt',
    'updatedAt',
  ];

  const trainerRows = trainers.map((t) => ({
    name: t.name,
    email: t.email,
    phone: t.mobile,
    age: '',
    gender: '',
    title: t.title,
    bio: t.bio,
    specialistIn: t.specialistIn,
    typeOfTraining: t.typeOfTraining,
    status: t.status,
    profilePhotoPath: t.profilePhoto?.path ?? '',
    createdAt: t.createdAt?.toISOString?.() ?? '',
    updatedAt: t.updatedAt?.toISOString?.() ?? '',
  }));

  const teacherHeaders = [
    'name',
    'email',
    'phone',
    'emergencyMobile',
    'age',
    'gender',
    'dob',
    'teacherCategory',
    'teachingExperience',
    'expertise',
    'qualification',
    'city',
    'country',
    'AboutMe',
    'description',
    'status',
    'active',
    'createdAt',
    'updatedAt',
  ];

  const teacherRows = teachers.map((u) => ({
    name: u.name,
    email: u.email,
    phone: u.mobile ?? '',
    emergencyMobile: u.emergencyMobile ?? '',
    age: u.age ?? '',
    gender: u.gender ?? '',
    dob: u.dob ?? '',
    teacherCategory: u.teacherCategory ?? '',
    teachingExperience: u.teachingExperience ?? '',
    expertise: u.expertise,
    qualification: u.qualification,
    city: u.city ?? '',
    country: u.country ?? '',
    AboutMe: u.AboutMe ?? '',
    description: u.description ?? '',
    status: u.status,
    active: u.active,
    createdAt: u.createdAt?.toISOString?.() ?? '',
    updatedAt: u.updatedAt?.toISOString?.() ?? '',
  }));

  const trainerPath = path.join(outDir, `trainers_${stamp}.csv`);
  const teacherPath = path.join(outDir, `teachers_${stamp}.csv`);
  const combinedPath = path.join(outDir, `trainers_and_teachers_combined_${stamp}.csv`);

  await fs.writeFile(trainerPath, toCsv(trainerHeaders, trainerRows), 'utf8');
  await fs.writeFile(teacherPath, toCsv(teacherHeaders, teacherRows), 'utf8');

  const combinedHeaders = [
    'recordType',
    'name',
    'email',
    'phone',
    'age',
    'gender',
    'dob',
    'title',
    'bio',
    'specialistIn',
    'typeOfTraining',
    'teacherCategory',
    'teachingExperience',
    'expertise',
    'city',
    'country',
    'status',
    'notes',
  ];

  const combinedRows = [
    ...trainers.map((t) => ({
      recordType: 'Trainer',
      name: t.name,
      email: t.email,
      phone: t.mobile,
      age: '',
      gender: '',
      dob: '',
      title: t.title,
      bio: t.bio,
      specialistIn: t.specialistIn,
      typeOfTraining: t.typeOfTraining,
      teacherCategory: '',
      teachingExperience: '',
      expertise: '',
      city: '',
      country: '',
      status: t.status,
      notes: 'Trainer collection — no age/gender on schema',
    })),
    ...teachers.map((u) => ({
      recordType: 'Teacher',
      name: u.name,
      email: u.email,
      phone: u.mobile ?? '',
      age: u.age ?? '',
      gender: u.gender ?? '',
      dob: u.dob ?? '',
      title: '',
      bio: '',
      specialistIn: '',
      typeOfTraining: '',
      teacherCategory: u.teacherCategory ?? '',
      teachingExperience: u.teachingExperience ?? '',
      expertise: u.expertise,
      city: u.city ?? '',
      country: u.country ?? '',
      status: u.status,
      notes: 'Users collection, role=teacher',
    })),
  ];

  await fs.writeFile(combinedPath, toCsv(combinedHeaders, combinedRows), 'utf8');

  console.log(`Wrote ${trainers.length} trainers -> ${trainerPath}`);
  console.log(`Wrote ${teachers.length} teachers -> ${teacherPath}`);
  console.log(`Wrote combined (${combinedRows.length} rows) -> ${combinedPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
