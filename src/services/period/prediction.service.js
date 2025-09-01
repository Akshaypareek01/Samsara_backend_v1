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
