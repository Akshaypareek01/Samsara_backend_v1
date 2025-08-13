import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError.js';
import { BirthControl } from '../../models/index.js';

export const getBirthControl = async (userId) => {
  let bc = await BirthControl.findOne({ userId });
  if (!bc) {
    bc = await BirthControl.create({ userId });
  }
  return bc;
};

export const updateBirthControl = async (userId, changes) => {
  const bc = await BirthControl.findOneAndUpdate({ userId }, changes, { upsert: true, new: true });
  return bc;
};

export const markPillTaken = async (userId, date = new Date()) => {
  const bc = await getBirthControl(userId);
  if (bc.method !== 'pill') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Birth control method is not pill');
  }
  const day = new Date(date);
  bc.pillsTakenDates = bc.pillsTakenDates || [];
  const exists = bc.pillsTakenDates.find((d) => new Date(d).toDateString() === day.toDateString());
  if (!exists) bc.pillsTakenDates.push(day);
  // naive next-pill time logic: keep same time
  const nextTime = bc.nextPillTime || '21:00';
  bc.nextPillTime = nextTime;
  // pack status approximation
  if (bc.pillPackStartDate && bc.pillPackLength) {
    const diff = Math.floor((day - new Date(bc.pillPackStartDate)) / (24 * 60 * 60 * 1000));
    const inBreak = diff >= (bc.pillPackLength - bc.pillFreeDays);
    bc.pillPackStatus = inBreak ? 'Break' : 'Active';
  } else {
    bc.pillPackStatus = 'Unknown';
  }
  await bc.save();
  return bc;
};


