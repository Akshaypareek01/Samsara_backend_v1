import { PeriodCycle } from '../models/period-cycle.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Period Cycle Service - Handles all period cycle logic including predictions and history
 */
class PeriodCycleService {
  /**
   * Start a new period cycle for a user
   */
  async startNewCycle(userId) {
    // Get user's cycle history for better predictions
    const cycleHistory = await this.getUserCycleHistory(userId, 6);
    
    // Calculate next cycle number
    const nextCycleNumber = cycleHistory.length > 0 
      ? Math.max(...cycleHistory.map(c => c.cycleNumber)) + 1 
      : 1;
    
    // Calculate predictions based on history
    const predictions = this.calculateCyclePredictions(cycleHistory);
    
    const newCycle = new PeriodCycle({
      userId,
      cycleNumber: nextCycleNumber,
      cycleStartDate: new Date(),
      cycleStatus: 'Active',
      currentPhase: 'Menstruation',
      ...predictions
    });
    
    return await newCycle.save();
  }

  /**
   * Complete an active cycle (when period ends)
   */
  async completeCycle(cycleId, userId) {
    const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
    if (!cycle) {
      throw new ApiError(404, 'Cycle not found');
    }
    
    if (cycle.cycleStatus !== 'Active') {
      throw new ApiError(400, 'Cycle is already completed');
    }
    
    const cycleEndDate = new Date();
    const actualCycleLength = Math.ceil(
      (cycleEndDate - cycle.cycleStartDate) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate prediction accuracy
    const predictionAccuracy = this.calculatePredictionAccuracy(cycle, actualCycleLength);
    
    // Update cycle with completion data
    cycle.cycleEndDate = cycleEndDate;
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
    
    if (cycle.cycleStatus !== 'Active') {
      throw new ApiError(400, 'Cannot update completed cycle');
    }
    
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
    
    // Update current phase based on symptoms and flow
    cycle.currentPhase = this.determineCurrentPhase(cycle.dailyLogs, cycle.cycleStartDate);
    
    // Check if cycle should be auto-completed (no flow for 3+ days)
    if (this.shouldAutoCompleteCycle(cycle.dailyLogs)) {
      await this.completeCycle(cycleId, userId);
      return await PeriodCycle.findById(cycleId);
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
   */
  calculateCyclePredictions(cycleHistory) {
    if (cycleHistory.length === 0) {
      // Default predictions for new users
      return this.getDefaultPredictions();
    }
    
    // Calculate average cycle length from completed cycles
    const completedCycles = cycleHistory.filter(c => c.cycleStatus === 'Completed');
    const averageCycleLength = completedCycles.length > 0
      ? Math.round(completedCycles.reduce((sum, c) => sum + c.cycleLengthDays, 0) / completedCycles.length)
      : 28;
    
    // Calculate average period duration
    const averagePeriodDuration = completedCycles.length > 0
      ? Math.round(completedCycles.reduce((sum, c) => sum + (c.periodDurationDays || 5), 0) / completedCycles.length)
      : 5;
    
    const today = new Date();
    const predictedNextPeriodDate = new Date(today.getTime() + (averageCycleLength * 24 * 60 * 60 * 1000));
    
    // Ovulation typically occurs 14 days before next period
    const predictedOvulationDate = new Date(predictedNextPeriodDate.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    // Fertile window is 5 days before ovulation + ovulation day + 1 day after
    const predictedFertileWindowStart = new Date(predictedOvulationDate.getTime() - (5 * 24 * 60 * 60 * 1000));
    const predictedFertileWindowEnd = new Date(predictedOvulationDate.getTime() + (24 * 60 * 60 * 1000));
    
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
   * Get default predictions for new users
   */
  getDefaultPredictions() {
    const today = new Date();
    const defaultCycleLength = 28;
    const defaultPeriodDuration = 5;
    
    const predictedNextPeriodDate = new Date(today.getTime() + (defaultCycleLength * 24 * 60 * 60 * 1000));
    const predictedOvulationDate = new Date(predictedNextPeriodDate.getTime() - (14 * 24 * 60 * 60 * 1000));
    const predictedFertileWindowStart = new Date(predictedOvulationDate.getTime() - (5 * 24 * 60 * 60 * 1000));
    const predictedFertileWindowEnd = new Date(predictedOvulationDate.getTime() + (24 * 60 * 60 * 1000));
    
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
