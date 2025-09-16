import { Mood } from '../models/user-mood.model.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

/**
 * Get date filter for different periods
 * @param {string} period - daily, weekly, monthly, 6months, yearly
 * @param {Date} startDate - Custom start date
 * @param {Date} endDate - Custom end date
 * @returns {Object} MongoDB date filter
 */
const getDateFilter = (period, startDate, endDate) => {
  if (startDate && endDate) {
    return {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  }

  const now = new Date();
  switch (period) {
    case 'daily':
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return { 
        createdAt: { 
          $gte: startOfDay,
          $lt: endOfDay
        } 
      };
    case 'weekly':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 1);
      return { 
        createdAt: { 
          $gte: startOfWeek,
          $lt: endOfWeek
        } 
      };
    case 'monthly':
      const startOfMonth = new Date(now);
      startOfMonth.setMonth(now.getMonth() - 1);
      const endOfMonth = new Date(now);
      endOfMonth.setMonth(now.getMonth() + 1);
      return { 
        createdAt: { 
          $gte: startOfMonth,
          $lt: endOfMonth
        } 
      };
    case '6months':
      const startOf6Months = new Date(now);
      startOf6Months.setMonth(now.getMonth() - 6);
      const endOf6Months = new Date(now);
      endOf6Months.setMonth(now.getMonth() + 1);
      return { 
        createdAt: { 
          $gte: startOf6Months,
          $lt: endOf6Months
        } 
      };
    case 'yearly':
      const startOfYear = new Date(now);
      startOfYear.setFullYear(now.getFullYear() - 1);
      const endOfYear = new Date(now);
      endOfYear.setFullYear(now.getFullYear() + 1);
      return { 
        createdAt: { 
          $gte: startOfYear,
          $lt: endOfYear
        } 
      };
    default:
      return {};
  }
};

/**
 * Create a mood entry
 * @param {Object} moodBody
 * @returns {Promise<Mood>}
 */
const createMood = async (moodBody) => {
  return Mood.create(moodBody);
};

/**
 * Query for moods
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMoods = async (filter, options) => {
  const moods = await Mood.paginate(filter, options);
  return moods;
};

/**
 * Get mood by id
 * @param {ObjectId} id
 * @returns {Promise<Mood>}
 */
const getMoodById = async (id) => {
  return Mood.findById(id);
};

/**
 * Update mood by id
 * @param {ObjectId} moodId
 * @param {Object} updateBody
 * @returns {Promise<Mood>}
 */
const updateMoodById = async (moodId, updateBody) => {
  const mood = await getMoodById(moodId);
  if (!mood) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mood not found');
  }
  Object.assign(mood, updateBody);
  await mood.save();
  return mood;
};

/**
 * Delete mood by id
 * @param {ObjectId} moodId
 * @returns {Promise<Mood>}
 */
const deleteMoodById = async (moodId) => {
  const mood = await getMoodById(moodId);
  if (!mood) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mood not found');
  }
  await Mood.deleteOne({ _id: moodId });
  return mood;
};

/**
 * Get mood analytics for different periods
 * @param {ObjectId} userId
 * @param {string} period - daily, weekly, monthly, 6months, yearly
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getMoodAnalytics = async (userId, period, startDate, endDate) => {
  const dateFilter = getDateFilter(period, startDate, endDate);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$mood',
        count: { $sum: 1 },
        moodId: { $first: '$moodId' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const analytics = await Mood.aggregate(pipeline);
  
  // Calculate total count
  const totalCount = analytics.reduce((sum, item) => sum + item.count, 0);
  
  // Add percentage for each mood
  const analyticsWithPercentage = analytics.map(item => ({
    ...item,
    percentage: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(2) : 0
  }));

  return {
    period,
    totalCount,
    analytics: analyticsWithPercentage,
    dateRange: {
      start: dateFilter.createdAt?.$gte || null,
      end: dateFilter.createdAt?.$lte || new Date()
    }
  };
};

/**
 * Get mood KPIs for different periods
 * @param {ObjectId} userId
 * @param {string} period - daily, weekly, monthly, 6months, yearly
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getMoodKPIs = async (userId, period, startDate, endDate) => {
  const dateFilter = getDateFilter(period, startDate, endDate);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ...dateFilter
      }
    },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
        moodCounts: {
          $push: {
            mood: '$mood',
            moodId: '$moodId'
          }
        }
      }
    },
    {
      $project: {
        totalEntries: 1,
        uniqueDays: { $size: '$uniqueDays' },
        moodCounts: 1
      }
    }
  ];

  const kpiData = await Mood.aggregate(pipeline);
  
  if (kpiData.length === 0) {
    return {
      period,
      totalEntries: 0,
      uniqueDays: 0,
      averageEntriesPerDay: 0,
      mostFrequentMood: null,
      moodDistribution: [],
      dateRange: {
        start: dateFilter.createdAt?.$gte || null,
        end: dateFilter.createdAt?.$lte || new Date()
      }
    };
  }

  const data = kpiData[0];
  
  // Calculate mood distribution
  const moodCounts = {};
  data.moodCounts.forEach(item => {
    moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
  });

  const moodDistribution = Object.entries(moodCounts)
    .map(([mood, count]) => ({
      mood,
      count,
      percentage: ((count / data.totalEntries) * 100).toFixed(2)
    }))
    .sort((a, b) => b.count - a.count);

  const mostFrequentMood = moodDistribution.length > 0 ? moodDistribution[0] : null;
  const averageEntriesPerDay = data.uniqueDays > 0 ? (data.totalEntries / data.uniqueDays).toFixed(2) : 0;

  return {
    period,
    totalEntries: data.totalEntries,
    uniqueDays: data.uniqueDays,
    averageEntriesPerDay: parseFloat(averageEntriesPerDay),
    mostFrequentMood,
    moodDistribution,
    dateRange: {
      start: dateFilter.createdAt?.$gte || null,
      end: dateFilter.createdAt?.$lte || new Date()
    }
  };
};

/**
 * Get mood trends over time
 * @param {ObjectId} userId
 * @param {string} period - daily, weekly, monthly, 6months, yearly
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getMoodTrends = async (userId, period, startDate, endDate) => {
  const dateFilter = getDateFilter(period, startDate, endDate);
  let groupFormat = '';
  
  // Set group format based on period
  switch (period) {
    case 'daily':
      groupFormat = '%Y-%m-%d %H';
      break;
    case 'weekly':
      groupFormat = '%Y-%m-%d';
      break;
    case 'monthly':
      groupFormat = '%Y-%m-%d';
      break;
    case '6months':
      groupFormat = '%Y-%m';
      break;
    case 'yearly':
      groupFormat = '%Y-%m';
      break;
  }

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ...dateFilter
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          mood: '$mood'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ];

  const trends = await Mood.aggregate(pipeline);
  
  return {
    period,
    trends,
    dateRange: {
      start: dateFilter.createdAt?.$gte || null,
      end: dateFilter.createdAt?.$lte || new Date()
    }
  };
};

export {
  createMood,
  queryMoods,
  getMoodById,
  updateMoodById,
  deleteMoodById,
  getMoodAnalytics,
  getMoodKPIs,
  getMoodTrends,
  getDateFilter,
};
