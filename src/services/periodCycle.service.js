import { PeriodCycle } from '../models/period-cycle.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { toDateOnly, diffDays, addDays } from './period/prediction.service.js';

/**
 * Period Cycle Service - Handles all period cycle logic including predictions and history
 */
class PeriodCycleService {
  /**
   * Start a new period cycle for a user
   * @param {string} userId - User ID
   * @param {Date|string} [date] - Optional start date (defaults to current date)
   */
  async startNewCycle(userId, date) {
    const start = toDateOnly(date || new Date());
    
    // Close previous open cycle if exists and new start is after it
    const lastOpen = await PeriodCycle.findOne({ 
      userId, 
      cycleEndDate: { $exists: false } 
    }).sort({ cycleStartDate: -1 });
    
    if (lastOpen && start >= lastOpen.cycleStartDate) {
      // Only auto-close if new start date is on or after the previous cycle start
      lastOpen.cycleEndDate = start; // auto-close at new start
      lastOpen.periodDurationDays = Math.max(1, diffDays(lastOpen.cycleEndDate, lastOpen.cycleStartDate) + 1);
      lastOpen.cycleStatus = 'Completed';
      await lastOpen.save();
    }
    
    // Get user's cycle history for better predictions
    const cycleHistory = await this.getUserCycleHistory(userId, 6);
    
    // Calculate next cycle number
    const nextCycleNumber = cycleHistory.length > 0 
      ? Math.max(...cycleHistory.map(c => c.cycleNumber)) + 1 
      : 1;
    
    // Calculate predictions based on history
    const predictions = this.calculateCyclePredictions(cycleHistory, start);
    
    const newCycle = new PeriodCycle({
      userId,
      cycleNumber: nextCycleNumber,
      cycleStartDate: start,
      cycleStatus: 'Active',
      currentPhase: 'Menstruation',
      ...predictions
    });
    
    return await newCycle.save();
  }

  /**
   * Complete an active cycle (when period ends)
   * @param {string} cycleId - Cycle ID
   * @param {string} userId - User ID
   * @param {Date|string} [date] - Optional end date (defaults to current date)
   */
  async completeCycle(cycleId, userId, date) {
    const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
    if (!cycle) {
      throw new ApiError(404, 'Cycle not found');
    }
    
    if (cycle.cycleStatus !== 'Active') {
      throw new ApiError(400, 'Cycle is already completed');
    }
    
    const cycleEndDate = toDateOnly(date || new Date());
    
    // Validate that end date is not before start date
    if (cycleEndDate < cycle.cycleStartDate) {
      throw new ApiError(400, 'Cycle end date cannot be before start date');
    }
    
    const actualCycleLength = Math.max(1, diffDays(cycleEndDate, cycle.cycleStartDate) + 1);
    
    // Calculate prediction accuracy
    const predictionAccuracy = this.calculatePredictionAccuracy(cycle, actualCycleLength);
    
    // Update cycle with completion data
    cycle.cycleEndDate = cycleEndDate;
    cycle.periodDurationDays = actualCycleLength;
    cycle.cycleLengthDays = actualCycleLength;
    cycle.cycleStatus = 'Completed';
    cycle.predictionAccuracy = predictionAccuracy;
    
    // Update regularity based on history
    await this.updateUserRegularity(userId);
    
    return await cycle.save();
  }

  /**
   * Add or update daily log for a cycle
   */
  async updateDailyLog(cycleId, userId, logData) {
    const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
    if (!cycle) {
      throw new ApiError(404, 'Cycle not found');
    }
    
    // Allow logs on completed cycles for historical data entry
    // if (cycle.cycleStatus !== 'Active') {
    //   throw new ApiError(400, 'Cannot update completed cycle');
    // }
    
    const { date, ...logFields } = logData;
    const logDate = new Date(date);
    
    // Check if log for this date already exists
    const existingLogIndex = cycle.dailyLogs.findIndex(
      log => log.date.toDateString() === logDate.toDateString()
    );
    
    if (existingLogIndex >= 0) {
      // Update existing log
      cycle.dailyLogs[existingLogIndex] = { ...cycle.dailyLogs[existingLogIndex], ...logFields };
    } else {
      // Add new log
      cycle.dailyLogs.push({ date: logDate, ...logFields });
    }
    
    // Sort daily logs by date
    cycle.dailyLogs.sort((a, b) => a.date - b.date);
    
    // Update current phase based on symptoms and flow (only for active cycles)
    if (cycle.cycleStatus === 'Active') {
      cycle.currentPhase = this.determineCurrentPhase(cycle.dailyLogs, cycle.cycleStartDate);
      
      // Check if cycle should be auto-completed (no flow for 3+ days)
      if (this.shouldAutoCompleteCycle(cycle.dailyLogs)) {
        await this.completeCycle(cycleId, userId);
        return await PeriodCycle.findById(cycleId);
      }
    }
    
    return await cycle.save();
  }

  /**
   * Get user's cycle history for predictions
   */
  async getUserCycleHistory(userId, limit = 6) {
    return await PeriodCycle.find({ userId })
      .sort({ cycleStartDate: -1 })
      .limit(limit);
  }

  /**
   * Get current active cycle for user
   */
  async getCurrentActiveCycle(userId) {
    return await PeriodCycle.findOne({ 
      userId, 
      cycleStatus: 'Active' 
    }).sort({ cycleStartDate: -1 });
  }

  /**
   * Get upcoming cycle predictions
   */
  async getUpcomingCyclePredictions(userId) {
    const cycleHistory = await this.getUserCycleHistory(userId, 6);
    const activeCycle = await this.getCurrentActiveCycle(userId);
    
    if (!activeCycle) {
      // No active cycle, predict next one based on history
      return this.calculateCyclePredictions(cycleHistory);
    }
    
    // Return predictions for current active cycle
    return {
      predictedNextPeriodDate: activeCycle.predictedNextPeriodDate,
      predictedOvulationDate: activeCycle.predictedOvulationDate,
      predictedFertileWindowStart: activeCycle.predictedFertileWindowStart,
      predictedFertileWindowEnd: activeCycle.predictedFertileWindowEnd,
      currentPhase: activeCycle.currentPhase
    };
  }

  /**
   * Calculate cycle predictions based on history
   * @param {Array} cycleHistory - Array of previous cycles
   * @param {Date} [cycleStartDate] - Optional cycle start date for predictions (defaults to today)
   */
  calculateCyclePredictions(cycleHistory, cycleStartDate = null) {
    if (cycleHistory.length === 0) {
      // Default predictions for new users
      return this.getDefaultPredictions(cycleStartDate);
    }
    
    // Calculate average cycle length from completed cycles
    const completedCycles = cycleHistory.filter(c => c.cycleStatus === 'Completed');
    const averageCycleLength = completedCycles.length > 0
      ? Math.round(completedCycles.reduce((sum, c) => sum + (c.cycleLengthDays || 0), 0) / completedCycles.length)
      : 28;
    
    // Calculate average period duration
    const averagePeriodDuration = completedCycles.length > 0
      ? Math.round(completedCycles.reduce((sum, c) => sum + (c.periodDurationDays || 5), 0) / completedCycles.length)
      : 5;
    
    const startDate = cycleStartDate || new Date();
    const { predictedNextPeriodDate, predictedOvulationDate, predictedFertileWindowStart, predictedFertileWindowEnd } = 
      this.predictFromDate(startDate, averageCycleLength, 14);
    
    return {
      predictedNextPeriodDate,
      predictedOvulationDate,
      predictedFertileWindowStart,
      predictedFertileWindowEnd,
      periodDurationDays: averagePeriodDuration,
      cycleLengthDays: averageCycleLength
    };
  }
  
  /**
   * Predict cycle dates from a given start date
   */
  predictFromDate(startDate, avgCycleDays = 28, lutealDays = 14) {
    const nextPeriod = addDays(startDate, avgCycleDays);
    const ovulation = addDays(nextPeriod, -lutealDays);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 4);
    return {
      predictedNextPeriodDate: nextPeriod,
      predictedOvulationDate: ovulation,
      predictedFertileWindowStart: fertileStart,
      predictedFertileWindowEnd: fertileEnd,
    };
  }

  /**
   * Get default predictions for new users
   * @param {Date} [cycleStartDate] - Optional cycle start date (defaults to today)
   */
  getDefaultPredictions(cycleStartDate = null) {
    const startDate = cycleStartDate || new Date();
    const defaultCycleLength = 28;
    const defaultPeriodDuration = 5;
    
    const predictedNextPeriodDate = addDays(startDate, defaultCycleLength);
    const predictedOvulationDate = addDays(predictedNextPeriodDate, -14);
    const predictedFertileWindowStart = addDays(predictedOvulationDate, -5);
    const predictedFertileWindowEnd = addDays(predictedOvulationDate, 1);
    
    return {
      predictedNextPeriodDate,
      predictedOvulationDate,
      predictedFertileWindowStart,
      predictedFertileWindowEnd,
      periodDurationDays: defaultPeriodDuration,
      cycleLengthDays: defaultCycleLength
    };
  }

  /**
   * Determine current phase based on daily logs and cycle start
   */
  determineCurrentPhase(dailyLogs, cycleStartDate) {
    if (dailyLogs.length === 0) return 'Menstruation';
    
    const today = new Date();
    const daysSinceStart = Math.ceil((today - cycleStartDate) / (1000 * 60 * 60 * 24));
    
    // Check for active menstruation (flow intensity > 0)
    const recentLogs = dailyLogs.slice(-3); // Last 3 days
    const hasActiveFlow = recentLogs.some(log => log.flowIntensity > 0);
    
    if (hasActiveFlow) return 'Menstruation';
    
    if (daysSinceStart <= 14) return 'Follicular';
    if (daysSinceStart <= 16) return 'Ovulation';
    return 'Luteal';
  }

  /**
   * Check if cycle should be auto-completed
   */
  shouldAutoCompleteCycle(dailyLogs) {
    if (dailyLogs.length < 3) return false;
    
    // Check last 3 days for no flow
    const lastThreeLogs = dailyLogs.slice(-3);
    const noFlowForThreeDays = lastThreeLogs.every(log => 
      !log.flowIntensity || log.flowIntensity === 0
    );
    
    return noFlowForThreeDays;
  }

  /**
   * Calculate prediction accuracy
   */
  calculatePredictionAccuracy(cycle, actualCycleLength) {
    if (!cycle.cycleLengthDays) return 0;
    
    const predictedLength = cycle.cycleLengthDays;
    const difference = Math.abs(actualCycleLength - predictedLength);
    const accuracy = Math.max(0, 100 - (difference * 10)); // 10% penalty per day difference
    
    return Math.round(accuracy);
  }

  /**
   * Update user's regularity status
   */
  async updateUserRegularity(userId) {
    const completedCycles = await PeriodCycle.find({ 
      userId, 
      cycleStatus: 'Completed' 
    }).sort({ cycleStartDate: -1 }).limit(6);
    
    if (completedCycles.length < 3) return;
    
    const cycleLengths = completedCycles.map(c => c.cycleLengthDays);
    const averageLength = cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length;
    
    // Calculate standard deviation
    const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - averageLength, 2), 0) / cycleLengths.length;
    const standardDeviation = Math.sqrt(variance);
    
    // If standard deviation is more than 3 days, consider irregular
    const regularity = standardDeviation <= 3 ? 'Regular' : 'Irregular';
    
    // Update all cycles for this user with new regularity
    await PeriodCycle.updateMany(
      { userId },
      { regularity }
    );
  }

  /**
   * Get cycle analytics and insights
   */
  async getCycleAnalytics(userId) {
    const cycleHistory = await this.getUserCycleHistory(userId, 12);
    const completedCycles = cycleHistory.filter(c => c.cycleStatus === 'Completed');
    
    if (completedCycles.length === 0) {
      return { message: 'Not enough data for analytics' };
    }
    
    const cycleLengths = completedCycles.map(c => c.cycleLengthDays);
    const periodDurations = completedCycles.map(c => c.periodDurationDays).filter(Boolean);
    
    const averageCycleLength = Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length);
    const averagePeriodDuration = periodDurations.length > 0 
      ? Math.round(periodDurations.reduce((sum, dur) => sum + dur, 0) / periodDurations.length)
      : null;
    
    const shortestCycle = Math.min(...cycleLengths);
    const longestCycle = Math.max(...cycleLengths);
    
    const regularity = cycleHistory[0]?.regularity || 'Unknown';
    
    return {
      totalCycles: completedCycles.length,
      averageCycleLength,
      averagePeriodDuration,
      shortestCycle,
      longestCycle,
      regularity,
      predictionAccuracy: Math.round(
        completedCycles.reduce((sum, c) => sum + (c.predictionAccuracy || 0), 0) / completedCycles.length
      )
    };
  }

  /**
   * Get cycle by ID
   */
  async getCycleById(cycleId, userId) {
    return await PeriodCycle.findOne({ _id: cycleId, userId });
  }

  /**
   * Update cycle notes
   */
  async updateCycleNotes(cycleId, userId, cycleNotes) {
    const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
    if (!cycle) {
      throw new ApiError(404, 'Cycle not found');
    }
    
    cycle.cycleNotes = cycleNotes;
    return await cycle.save();
  }

  /**
   * Delete a cycle
   */
  async deleteCycle(cycleId, userId) {
    const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
    if (!cycle) {
      throw new ApiError(404, 'Cycle not found');
    }
    
    await PeriodCycle.findByIdAndDelete(cycleId);
    return true;
  }
}

export const periodCycleService = new PeriodCycleService();
