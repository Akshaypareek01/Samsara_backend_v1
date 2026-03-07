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

  // Keep only the most recent pack's worth of dates (max pillPackLength + pillFreeDays, default 35)
  const maxDates = (bc.pillPackLength || 28) + (bc.pillFreeDays || 7);
  if (bc.pillsTakenDates.length > maxDates) {
    bc.pillsTakenDates = bc.pillsTakenDates
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(-maxDates);
  }

  bc.nextPillTime = bc.nextPillTime || '21:00';

  if (bc.pillPackStartDate && bc.pillPackLength) {
    const diff = Math.floor((day - new Date(bc.pillPackStartDate)) / (24 * 60 * 60 * 1000));
    const totalDays = bc.pillPackLength;
    const dayInCycle = ((diff % totalDays) + totalDays) % totalDays;
    const activeDays = totalDays - (bc.pillFreeDays || 0);
    bc.pillPackStatus = dayInCycle >= activeDays ? 'Break' : 'Active';
  } else {
    bc.pillPackStatus = 'Unknown';
  }
  await bc.save();
  return bc;
};
