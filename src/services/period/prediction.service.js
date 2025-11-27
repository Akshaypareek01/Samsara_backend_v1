// Pure utility functions for cycle predictions and phase calculations

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const toDateOnly = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const addDays = (date, days) => new Date(toDateOnly(date).getTime() + days * MS_IN_DAY);

export const diffDays = (a, b) => Math.round((toDateOnly(a) - toDateOnly(b)) / MS_IN_DAY);

export const averageCycleLength = (cycles, fallback = 28) => {
  if (!Array.isArray(cycles) || cycles.length === 0) return fallback;
  const lens = cycles.map((c) => c.cycleLengthDays).filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (lens.length === 0) return fallback;
  // Trim simple outliers (top/bottom 10%) for stability
  const sorted = lens.sort((a, b) => a - b);
  const start = Math.floor(sorted.length * 0.1);
  const end = Math.ceil(sorted.length * 0.9);
  const trimmed = sorted.slice(start, end);
  const avg = trimmed.reduce((s, n) => s + n, 0) / trimmed.length;
  return Math.round(avg);
};

export const predictFromLast = (lastStartDate, avgCycleDays = 28, lutealDays = 14) => {
  if (!lastStartDate) return {};
  const nextPeriod = addDays(lastStartDate, avgCycleDays);
  const ovulation = addDays(nextPeriod, -lutealDays);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 4); // inclusive window length ~10 days
  return {
    predictedNextPeriodDate: nextPeriod,
    predictedOvulationDate: ovulation,
    predictedFertileWindowStart: fertileStart,
    predictedFertileWindowEnd: fertileEnd,
  };
};

export const determinePhase = (today, cycleStartDate, periodDurationDays = 5, ovulationDate) => {
  if (!today || !cycleStartDate) return undefined;
  const day = diffDays(today, cycleStartDate) + 1;
  if (day <= periodDurationDays) return 'Menstruation';
  if (ovulationDate && toDateOnly(today) < toDateOnly(ovulationDate)) return 'Follicular';
  if (ovulationDate && diffDays(today, ovulationDate) === 0) return 'Ovulation';
  return 'Luteal';
};

export const buildMonthMap = (year, monthIndex, periodRanges = [], fertileRange = {}, ovulationDate) => {
  // monthIndex: 0-11
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const days = [];
  for (let d = first; d <= last; d = addDays(d, 1)) {
    const isPeriod = periodRanges.some(
      ({ start, end }) => toDateOnly(d) >= toDateOnly(start) && toDateOnly(d) <= toDateOnly(end)
    );
    const isFertile =
      fertileRange.start &&
      fertileRange.end &&
      toDateOnly(d) >= toDateOnly(fertileRange.start) &&
      toDateOnly(d) <= toDateOnly(fertileRange.end);
    const isOvulation = ovulationDate && diffDays(d, ovulationDate) === 0;
    days.push({ date: d, isPeriod, isFertile, isOvulation });
  }
  return days;
};

/**
 * Calculate cycle irregularity (variance and standard deviation)
 * @param {Array} cycles - Array of completed cycles
 * @returns {Object} Irregularity metrics
 */
export const calculateIrregularity = (cycles) => {
  if (!Array.isArray(cycles) || cycles.length < 3) {
    return {
      regularity: 'Unknown',
      averageCycleLength: null,
      standardDeviation: null,
      variance: null,
      isIrregular: false,
      minCycleLength: null,
      maxCycleLength: null,
    };
  }

  const cycleLengths = cycles
    .map((c) => c.cycleLengthDays)
    .filter((n) => typeof n === 'number' && !Number.isNaN(n) && n > 0);

  if (cycleLengths.length < 3) {
    return {
      regularity: 'Unknown',
      averageCycleLength: null,
      standardDeviation: null,
      variance: null,
      isIrregular: false,
      minCycleLength: null,
      maxCycleLength: null,
    };
  }

  const average = cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length;
  const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - average, 2), 0) / cycleLengths.length;
  const standardDeviation = Math.sqrt(variance);

  // Irregular if standard deviation > 3 days or range > 7 days
  const minCycle = Math.min(...cycleLengths);
  const maxCycle = Math.max(...cycleLengths);
  const range = maxCycle - minCycle;
  const isIrregular = standardDeviation > 3 || range > 7;

  // Check for extremely short (<21) or long (>45) cycles
  const hasExtremeCycles = cycleLengths.some((len) => len < 21 || len > 45);

  return {
    regularity: isIrregular || hasExtremeCycles ? 'Irregular' : 'Regular',
    averageCycleLength: Math.round(average),
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    isIrregular: isIrregular || hasExtremeCycles,
    minCycleLength: minCycle,
    maxCycleLength: maxCycle,
    range,
    hasExtremeCycles,
  };
};

/**
 * Predict PMS window (typically 5 days before period)
 * @param {Date} predictedPeriodDate - Predicted next period date
 * @param {Number} pmsDaysBefore - Days before period (default 5)
 * @returns {Object} PMS window dates
 */
export const predictPMSWindow = (predictedPeriodDate, pmsDaysBefore = 5) => {
  if (!predictedPeriodDate) return null;

  const pmsStart = addDays(predictedPeriodDate, -pmsDaysBefore);
  const pmsEnd = addDays(predictedPeriodDate, -1); // Day before period

  return {
    pmsStartDate: pmsStart,
    pmsEndDate: pmsEnd,
    daysUntilPeriod: pmsDaysBefore,
  };
};

/**
 * Enhanced prediction with edge case handling
 * @param {Date} lastStartDate - Last period start date
 * @param {Number} avgCycleDays - Average cycle length
 * @param {Number} lutealDays - Luteal phase days
 * @param {Object} options - Additional options
 * @returns {Object} Enhanced predictions
 */
export const predictFromLastEnhanced = (lastStartDate, avgCycleDays = 28, lutealDays = 14, options = {}) => {
  if (!lastStartDate) return {};

  const { pmsDaysBefore = 5, pregnancyMode = false } = options;

  // Handle extreme cycles
  let adjustedCycleDays = avgCycleDays;
  if (avgCycleDays < 21) {
    adjustedCycleDays = 21; // Minimum safe cycle length
  } else if (avgCycleDays > 45) {
    adjustedCycleDays = 45; // Maximum safe cycle length
  }

  const nextPeriod = addDays(lastStartDate, adjustedCycleDays);
  const ovulation = addDays(nextPeriod, -lutealDays);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 4);

  const predictions = {
    predictedNextPeriodDate: nextPeriod,
    predictedOvulationDate: ovulation,
    predictedFertileWindowStart: fertileStart,
    predictedFertileWindowEnd: fertileEnd,
  };

  // Add PMS prediction if not in pregnancy mode
  if (!pregnancyMode) {
    const pmsWindow = predictPMSWindow(nextPeriod, pmsDaysBefore);
    if (pmsWindow) {
      predictions.pmsWindow = pmsWindow;
    }
  }

  return predictions;
};
