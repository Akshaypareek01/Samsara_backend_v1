import { PeriodCycle, PeriodSettings } from '../../models/index.js';
import { calculateIrregularity, toDateOnly, diffDays } from './prediction.service.js';

/**
 * Get comprehensive cycle analytics
 */
export const getCycleAnalytics = async (userId) => {
  const cycles = await PeriodCycle.find({ userId, cycleStatus: 'Completed' })
    .sort({ cycleStartDate: -1 })
    .limit(12);

  if (cycles.length === 0) {
    return {
      message: 'Not enough data for analytics',
      totalCycles: 0,
    };
  }

  const irregularity = calculateIrregularity(cycles);
  
  // Calculate period duration stats
  const periodDurations = cycles
    .map((c) => c.periodDurationDays)
    .filter((n) => typeof n === 'number' && n > 0);
  const avgPeriodDuration = periodDurations.length > 0
    ? Math.round(periodDurations.reduce((sum, d) => sum + d, 0) / periodDurations.length)
    : null;

  // Calculate prediction accuracy
  const accuracies = cycles
    .map((c) => c.predictionAccuracy)
    .filter((n) => typeof n === 'number' && !Number.isNaN(n));
  const avgAccuracy = accuracies.length > 0
    ? Math.round(accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length)
    : null;

  // Flow analysis
  const flowData = cycles.map((c) => {
    const logs = c.dailyLogs || [];
    const flowDays = logs.filter((l) => l.flowIntensity && l.flowIntensity > 0);
    const heavyFlowDays = logs.filter((l) => l.flowIntensity >= 4).length;
    const lightFlowDays = logs.filter((l) => l.flowIntensity === 1).length;
    
    return {
      cycleId: c._id,
      totalFlowDays: flowDays.length,
      heavyFlowDays,
      lightFlowDays,
      avgFlowIntensity: flowDays.length > 0
        ? Math.round((flowDays.reduce((sum, l) => sum + l.flowIntensity, 0) / flowDays.length) * 10) / 10
        : null,
    };
  });

  // Symptoms frequency
  const allSymptoms = cycles.flatMap((c) => 
    (c.dailyLogs || []).flatMap((l) => l.symptoms || [])
  );
  const symptomFrequency = {};
  allSymptoms.forEach((symptom) => {
    symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
  });
  const topSymptoms = Object.entries(symptomFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([symptom, count]) => ({ symptom, count }));

  return {
    totalCycles: cycles.length,
    averageCycleLength: irregularity.averageCycleLength,
    averagePeriodDuration: avgPeriodDuration,
    minCycleLength: irregularity.minCycleLength,
    maxCycleLength: irregularity.maxCycleLength,
    regularity: irregularity.regularity,
    isIrregular: irregularity.isIrregular,
    standardDeviation: irregularity.standardDeviation,
    variance: irregularity.variance,
    averagePredictionAccuracy: avgAccuracy,
    flowAnalysis: {
      averageFlowDays: flowData.length > 0
        ? Math.round(flowData.reduce((sum, f) => sum + f.totalFlowDays, 0) / flowData.length)
        : null,
      averageHeavyFlowDays: flowData.length > 0
        ? Math.round(flowData.reduce((sum, f) => sum + f.heavyFlowDays, 0) / flowData.length)
        : null,
      cycles: flowData,
    },
    topSymptoms,
    cycleTrend: cycles.map((c) => ({
      cycleNumber: c.cycleNumber,
      cycleLengthDays: c.cycleLengthDays,
      periodDurationDays: c.periodDurationDays,
      startDate: c.cycleStartDate,
      varianceFromAverage: c.varianceFromAverage,
    })),
  };
};

/**
 * Get cycle insights and patterns
 */
export const getCycleInsights = async (userId) => {
  const settings = await PeriodSettings.findOne({ userId });
  const current = await PeriodCycle.findOne({ userId, cycleStatus: 'Active' })
    .sort({ cycleStartDate: -1 });
  const cycles = await PeriodCycle.find({ userId, cycleStatus: 'Completed' })
    .sort({ cycleStartDate: -1 })
    .limit(6);

  const insights = {
    currentStatus: null,
    predictions: null,
    patterns: null,
    recommendations: [],
  };

  if (!current && cycles.length === 0) {
    insights.recommendations.push('Start tracking your period to get personalized insights');
    return insights;
  }

  // Current status
  if (current) {
    const today = toDateOnly(new Date());
    const daysSinceStart = diffDays(today, current.cycleStartDate);
    
    insights.currentStatus = {
      cycleDay: daysSinceStart + 1,
      phase: current.currentPhase,
      isPeriodActive: current.cycleEndDate === null || current.cycleEndDate === undefined,
      periodDurationDays: current.periodDurationDays,
    };
  }

  // Predictions
  if (cycles.length > 0 || current) {
    const lastCycle = current || cycles[0];
    const irregularity = calculateIrregularity(cycles);
    const avgCycle = irregularity.averageCycleLength || settings?.defaultCycleLengthDays || 28;
    
    if (lastCycle.cycleStartDate) {
      const nextPeriod = new Date(lastCycle.cycleStartDate);
      nextPeriod.setDate(nextPeriod.getDate() + avgCycle);
      
      insights.predictions = {
        nextPeriodDate: nextPeriod,
        daysUntilNextPeriod: diffDays(nextPeriod, toDateOnly(new Date())),
        averageCycleLength: avgCycle,
        regularity: irregularity.regularity,
      };
    }
  }

  // Patterns
  if (cycles.length >= 3) {
    const irregularity = calculateIrregularity(cycles);
    
    insights.patterns = {
      regularity: irregularity.regularity,
      trend: cycles.length >= 2
        ? (cycles[0].cycleLengthDays > cycles[1].cycleLengthDays ? 'Increasing' : 'Decreasing')
        : 'Stable',
      averageCycleLength: irregularity.averageCycleLength,
      consistency: irregularity.isIrregular ? 'Variable' : 'Consistent',
    };

    if (irregularity.isIrregular) {
      insights.recommendations.push('Your cycles show some variation. Consider tracking more data for better predictions.');
    }

    if (irregularity.hasExtremeCycles) {
      insights.recommendations.push('Some cycles are outside the typical range (21-35 days). Consider consulting a healthcare provider.');
    }
  }

  // PMS insights
  if (insights.predictions?.nextPeriodDate && settings?.pmsPredictionEnabled) {
    const pmsDays = settings.pmsDaysBeforePeriod || 5;
    const pmsStart = new Date(insights.predictions.nextPeriodDate);
    pmsStart.setDate(pmsStart.getDate() - pmsDays);
    const today = toDateOnly(new Date());
    
    if (today >= pmsStart && today < insights.predictions.nextPeriodDate) {
      insights.recommendations.push(`You may experience PMS symptoms. Your period is predicted in ${insights.predictions.daysUntilNextPeriod} days.`);
    }
  }

  return insights;
};

/**
 * Get cycle statistics
 */
export const getCycleStats = async (userId) => {
  const cycles = await PeriodCycle.find({ userId, cycleStatus: 'Completed' })
    .sort({ cycleStartDate: -1 });

  if (cycles.length === 0) {
    return { message: 'No completed cycles found' };
  }

  const cycleLengths = cycles.map((c) => c.cycleLengthDays).filter(Boolean);
  const periodDurations = cycles.map((c) => c.periodDurationDays).filter(Boolean);

  return {
    totalCycles: cycles.length,
    totalDaysTracked: cycles.reduce((sum, c) => sum + (c.cycleLengthDays || 0), 0),
    averageCycleLength: cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((sum, l) => sum + l, 0) / cycleLengths.length)
      : null,
    averagePeriodDuration: periodDurations.length > 0
      ? Math.round(periodDurations.reduce((sum, d) => sum + d, 0) / periodDurations.length)
      : null,
    shortestCycle: cycleLengths.length > 0 ? Math.min(...cycleLengths) : null,
    longestCycle: cycleLengths.length > 0 ? Math.max(...cycleLengths) : null,
    shortestPeriod: periodDurations.length > 0 ? Math.min(...periodDurations) : null,
    longestPeriod: periodDurations.length > 0 ? Math.max(...periodDurations) : null,
  };
};
















