import httpStatus from 'http-status';
import { MedicationTracker, DailySchedule } from '../models/medication.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create medication tracker for user
 */
const createMedicationTracker = async (userId, trackerData) => {
  const existingTracker = await MedicationTracker.findOne({ userId });
  if (existingTracker) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Medication tracker already exists for this user');
  }

  const tracker = new MedicationTracker({
    userId,
    ...trackerData
  });

  await tracker.save();
  return tracker;
};

/**
 * Get medication tracker for user
 */
const getMedicationTracker = async (userId) => {
  const tracker = await MedicationTracker.findOne({ userId })
    .populate('userId', 'name email');
  
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  return tracker;
};

/**
 * Add health condition to tracker
 */
const addHealthCondition = async (userId, conditionData) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  tracker.healthConditions.push(conditionData);
  await tracker.save();
  
  return tracker.healthConditions[tracker.healthConditions.length - 1];
};

/**
 * Update health condition
 */
const updateHealthCondition = async (userId, conditionId, updateData) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const condition = tracker.healthConditions.id(conditionId);
  if (!condition) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Health condition not found');
  }

  Object.assign(condition, updateData);
  await tracker.save();
  
  return condition;
};

/**
 * Delete health condition
 */
const deleteHealthCondition = async (userId, conditionId) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const condition = tracker.healthConditions.id(conditionId);
  if (!condition) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Health condition not found');
  }

  condition.remove();
  await tracker.save();
  
  return { message: 'Health condition deleted successfully' };
};

/**
 * Add medication to tracker
 */
const addMedication = async (userId, medicationData) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  tracker.medications.push(medicationData);
  await tracker.save();
  
  return tracker.medications[tracker.medications.length - 1];
};

/**
 * Update medication
 */
const updateMedication = async (userId, medicationId, updateData) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const medication = tracker.medications.id(medicationId);
  if (!medication) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication not found');
  }

  Object.assign(medication, updateData);
  await tracker.save();
  
  return medication;
};

/**
 * Delete medication
 */
const deleteMedication = async (userId, medicationId) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const medication = tracker.medications.id(medicationId);
  if (!medication) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication not found');
  }

  medication.remove();
  await tracker.save();
  
  return { message: 'Medication deleted successfully' };
};

/**
 * Refill medication
 */
const refillMedication = async (userId, medicationId, refillData) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const medication = tracker.medications.id(medicationId);
  if (!medication) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication not found');
  }

  medication.quantityLeft += refillData.quantityAdded;
  await tracker.save();
  
  return medication;
};

/**
 * Create daily schedule
 */
const createDailySchedule = async (userId, scheduleData) => {
  const existingSchedule = await DailySchedule.findOne({
    userId,
    date: scheduleData.date
  });

  if (existingSchedule) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Schedule already exists for this date');
  }

  const schedule = new DailySchedule({
    userId,
    ...scheduleData
  });

  await schedule.save();
  return schedule;
};

/**
 * Update daily schedule
 */
const updateDailySchedule = async (userId, scheduleId, updateData) => {
  const schedule = await DailySchedule.findOne({ _id: scheduleId, userId });
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Schedule not found');
  }

  Object.assign(schedule, updateData);
  await schedule.save();
  
  return schedule;
};

/**
 * Mark medication as taken
 */
const markMedicationTaken = async (userId, scheduleId, timeSlot) => {
  const schedule = await DailySchedule.findOne({ _id: scheduleId, userId });
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Schedule not found');
  }

  const timeSlotEntry = schedule.schedule.find(slot => slot.time === timeSlot);
  if (!timeSlotEntry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Time slot not found');
  }

  timeSlotEntry.isCompleted = true;
  timeSlotEntry.completedAt = new Date();
  await schedule.save();
  
  return timeSlotEntry;
};

/**
 * Get medication history
 */
const getMedicationHistory = async (userId, options = {}) => {
  const { days = 30, medicationId, type } = options;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = {
    userId,
    createdAt: { $gte: startDate }
  };

  if (medicationId) {
    query['medications._id'] = medicationId;
  }

  if (type) {
    query['medications.type'] = type;
  }

  const history = await DailySchedule.find(query)
    .sort({ date: -1 })
    .populate('userId', 'name email');

  return history;
};

/**
 * Get schedule by date
 */
const getScheduleByDate = async (userId, date) => {
  const schedule = await DailySchedule.findOne({ userId, date })
    .populate('userId', 'name email');
  
  return schedule;
};

/**
 * Get schedule by date range
 */
const getScheduleByDateRange = async (userId, startDate, endDate) => {
  const schedules = await DailySchedule.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  })
    .sort({ date: 1 })
    .populate('userId', 'name email');

  return schedules;
};

/**
 * Get medication reminders for a specific date
 */
const getMedicationReminders = async (userId, date, includeCompleted = false) => {
  const schedule = await DailySchedule.findOne({ userId, date });
  
  if (!schedule) {
    return { date, schedule: [] };
  }

  let reminders = schedule.schedule;
  
  if (!includeCompleted) {
    reminders = reminders.filter(slot => !slot.isCompleted);
  }

  return {
    date,
    schedule: reminders
  };
};

/**
 * Generate daily schedule from medications
 */
const generateDailySchedule = async (userId, date) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const activeMedications = tracker.medications.filter(med => med.isActive);
  const schedule = [];

  activeMedications.forEach(medication => {
    if (medication.times && medication.times.length > 0) {
      medication.times.forEach(time => {
        schedule.push({
          time,
          period: getPeriodFromTime(time),
          medications: [medication.name],
          isCompleted: false
        });
      });
    }
  });

  // Remove duplicates and merge medications for same time
  const mergedSchedule = schedule.reduce((acc, slot) => {
    const existingSlot = acc.find(s => s.time === slot.time);
    if (existingSlot) {
      existingSlot.medications.push(...slot.medications);
    } else {
      acc.push(slot);
    }
    return acc;
  }, []);

  // Sort by time
  mergedSchedule.sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`);
    const timeB = new Date(`2000-01-01 ${b.time}`);
    return timeA - timeB;
  });

  return mergedSchedule;
};

/**
 * Helper function to get period from time
 */
const getPeriodFromTime = (time) => {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};

/**
 * Get low stock medications
 */
const getLowStockMedications = async (userId, threshold = 7) => {
  const tracker = await MedicationTracker.findOne({ userId });
  if (!tracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medication tracker not found');
  }

  const lowStockMedications = tracker.medications.filter(
    med => med.isActive && med.quantityLeft <= threshold
  );

  return lowStockMedications;
};

/**
 * Get medication adherence statistics
 */
const getAdherenceStats = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const schedules = await DailySchedule.find({
    userId,
    date: { $gte: startDate }
  });

  let totalSlots = 0;
  let completedSlots = 0;

  schedules.forEach(schedule => {
    schedule.schedule.forEach(slot => {
      totalSlots++;
      if (slot.isCompleted) {
        completedSlots++;
      }
    });
  });

  const adherenceRate = totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0;

  return {
    totalSlots,
    completedSlots,
    missedSlots: totalSlots - completedSlots,
    adherenceRate: Math.round(adherenceRate * 100) / 100
  };
};

export {
  createMedicationTracker,
  getMedicationTracker,
  addHealthCondition,
  updateHealthCondition,
  deleteHealthCondition,
  addMedication,
  updateMedication,
  deleteMedication,
  refillMedication,
  createDailySchedule,
  updateDailySchedule,
  markMedicationTaken,
  getMedicationHistory,
  getScheduleByDate,
  getScheduleByDateRange,
  getMedicationReminders,
  generateDailySchedule,
  getLowStockMedications,
  getAdherenceStats
}; 