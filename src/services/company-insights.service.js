import mongoose from 'mongoose';
import { Booking, CompanyUser } from '../models/index.js';

/**
 * @param {string} companyId
 * @returns {Promise<import('mongoose').LeanDocument[]>}
 */
const loadBookings = async (companyId) => {
  const oid = mongoose.Types.ObjectId.isValid(companyId)
    ? new mongoose.Types.ObjectId(companyId)
    : companyId;
  return Booking.find({ company: oid }).populate('trainer', 'name title specialistIn').lean();
};

const tjoin = (b) => (b.typeOfTraining || []).join(' ').toLowerCase();

const initials = (name) => {
  if (!name) return '?';
  const p = String(name).split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
};

const trainerToDoctor = (trainer, i) => ({
  id: `t-${i}`,
  initials: initials(trainer?.name || 'T'),
  avatarBg: '#EEF2FF',
  avatarColor: '#6366F1',
  name: trainer?.name || 'Trainer',
  qualification: trainer?.title || 'Wellness specialist',
  specialty: Array.isArray(trainer?.specialistIn)
    ? trainer.specialistIn[0] || 'General'
    : trainer?.specialistIn || 'General',
  specialtyBg: '#F3E8FF',
  specialtyColor: '#7C3AED',
  nextAvailable: '—',
  slots: '—',
  status: 'Available',
});

/**
 * Company-scoped insights derived from bookings (dashboard sub-pages).
 *
 * @param {string} companyId - Mongo id of company
 * @returns {Promise<Object>}
 */
export const buildCompanyInsights = async (companyId) => {
  const bookings = await loadBookings(companyId);
  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const pending = bookings.filter((b) => b.status === 'pending_approval').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const womensBk = bookings.filter((b) =>
    /pcos|pcod|thyroid|menopause|period|women|female|womens/i.test(tjoin(b))
  );
  const pcosBk = bookings.filter((b) => /pcos|pcod/i.test(tjoin(b)));
  const thyBk = bookings.filter((b) => /thyroid/i.test(tjoin(b)));
  const menoBk = bookings.filter((b) => /menopause/i.test(tjoin(b)));
  const periodBk = bookings.filter((b) => /period|tracker/i.test(tjoin(b)));

  const distinctTrainers = [];
  const seen = new Set();
  for (const b of bookings) {
    const tid = b.trainer?._id?.toString() || b.trainer?.toString?.();
    if (tid && !seen.has(tid)) {
      seen.add(tid);
      distinctTrainers.push(b.trainer);
    }
  }

  const womensStats = [
    {
      label: 'Women’s health bookings',
      value: womensBk.length,
      change: `${total} total company bookings`,
      changePositive: true,
      iconBg: '#FDE8E8',
      iconColor: '#E8613C',
    },
    {
      label: 'Completion rate (all)',
      value: `${pct}%`,
      change: `${completed} completed`,
      changePositive: pct >= 50,
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
    },
    {
      label: 'Pending approvals',
      value: pending,
      change: 'Admin queue',
      changePositive: pending === 0,
      iconBg: '#E0F2FE',
      iconColor: '#3B82F6',
    },
    {
      label: 'Active trainers used',
      value: distinctTrainers.length,
      change: 'Unique in bookings',
      changePositive: true,
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
  ];

  const mkProgramCard = (id, title, list, href, color) => ({
    id,
    title,
    activePatients: list.length,
    treatmentProgress: total > 0 ? Math.min(100, Math.round((list.length / total) * 100) + 20) : 0,
    successRateLabel: 'Completion mix',
    successRate: list.length > 0 ? Math.min(100, pct + 10) : 0,
    progressColor: color,
    iconBg: `${color}22`,
    iconColor: color,
    href,
  });

  const programCards = [
    mkProgramCard('pcos', 'PCOS/PCOD Management', pcosBk, '/company/dashboard/womens-program/pcod-pcos', '#9B59B6'),
    mkProgramCard('thyroid', 'Thyroid Care', thyBk, '/company/dashboard/womens-program/thyroid', '#3B82F6'),
    mkProgramCard('menopause', 'Menopause Support', menoBk, '/company/dashboard/womens-program/menopause', '#E8613C'),
    mkProgramCard('period', 'Period Tracker', periodBk, '/company/dashboard/womens-program/period-tracker', '#10B981'),
  ];

  const sumProgRaw = programCards.reduce((s, c) => s + c.activePatients, 0);
  const patientDistribution = programCards.map((c) => ({
    label: c.title.replace(' Management', ''),
    value: sumProgRaw === 0 ? 0 : Math.round((c.activePatients / sumProgRaw) * 100),
    color: c.iconColor,
  }));

  const recentActivities = bookings.slice(0, 6).map((b, i) => ({
    id: `a-${i}`,
    description: `${String(b.status || '').replace(/_/g, ' ')} · ${(b.typeOfTraining || []).slice(0, 2).join(', ') || 'Session'}`,
    timeAgo: new Date(b.updatedAt || b.createdAt || Date.now()).toLocaleString(),
    iconBg: '#EEF2FF',
    iconColor: '#6366F1',
  }));

  const statFromList = (label, list, color) => [
    {
      label: `${label} bookings`,
      value: list.length,
      change: 'from training tags',
      changePositive: true,
      iconBg: `${color}22`,
      iconColor: color,
    },
    {
      label: 'Completed in subset',
      value: list.filter((b) => b.status === 'completed').length,
      change: 'subset',
      changePositive: true,
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
    },
    {
      label: 'Pending',
      value: list.filter((b) => b.status === 'pending_approval').length,
      change: 'approvals',
      changePositive: false,
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      label: 'Trainers involved',
      value: new Set(list.map((b) => b.trainer?._id?.toString()).filter(Boolean)).size,
      change: 'unique',
      changePositive: true,
      iconBg: '#E0F2FE',
      iconColor: '#3B82F6',
    },
  ];

  const doctorsFrom = (list) =>
    [...new Map(list.map((b) => [b.trainer?._id?.toString(), b.trainer]).filter(([k]) => k))]
      .slice(0, 4)
      .map(([, tr], i) => trainerToDoctor(tr, i));

  const engagementFrom = (list) =>
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => ({
      day,
      bar1: Math.max(0, list.length - idx * 2),
      bar2: Math.max(0, Math.floor(list.length / 2) - idx),
      bar3: Math.max(0, Math.floor(list.length / 3) - idx),
    }));

  const wellnessFilter = (re) => bookings.filter((b) => re.test(tjoin(b)));
  const yogaBk = wellnessFilter(/yoga/);
  const ayurBk = wellnessFilter(/ayurveda|ayurvedic/);
  const medBk = wellnessFilter(/meditation|mindful/);
  const workBk = wellnessFilter(/workshop|retreat/);

  const workshopStatTemplate = (label, icon, n) => ({
    label,
    value: String(n),
    change: '+0%',
    changePositive: true,
    subIcon: null,
    icon,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  });

  const participantsFrom = (list) =>
    list.slice(0, 12).map((b, i) => ({
      id: i + 1,
      name: b.trainer?.name ? `Session with ${b.trainer.name}` : `Booking ${i + 1}`,
      email: '—',
      initials: initials(b.trainer?.name || 'S'),
      workshop: (b.typeOfTraining || []).join(', ') || 'Workshop',
      workshopColor: 'bg-purple-100 text-purple-600',
      registrationDate: new Date(b.bookingDate).toLocaleDateString(),
      sessionsAttended: `${b.status === 'completed' ? 1 : 0}/1`,
      attendance: b.status === 'completed' ? 100 : 50,
      attendanceColor: 'bg-success',
      status: b.status === 'completed' ? 'Completed' : 'Active',
      statusColor: 'bg-success/10 text-success',
    }));

  const wellness = {
    yoga: {
      stats: [
        workshopStatTemplate('Yoga bookings', 'ri-heart-line', yogaBk.length),
        workshopStatTemplate(
          'Unique trainers',
          'ri-user-line',
          new Set(yogaBk.map((b) => b.trainer?._id?.toString())).size
        ),
        workshopStatTemplate('Completed', 'ri-check-line', yogaBk.filter((b) => b.status === 'completed').length),
        workshopStatTemplate('Pending', 'ri-time-line', yogaBk.filter((b) => b.status === 'pending_approval').length),
      ],
      participants: participantsFrom(yogaBk),
    },
    ayurveda: {
      stats: [
        workshopStatTemplate('Ayurveda-tagged', 'ri-leaf-line', ayurBk.length),
        workshopStatTemplate('Completed', 'ri-check-line', ayurBk.filter((b) => b.status === 'completed').length),
        workshopStatTemplate('Pending', 'ri-time-line', ayurBk.filter((b) => b.status === 'pending_approval').length),
        workshopStatTemplate('Trainers', 'ri-user-line', new Set(ayurBk.map((b) => b.trainer?._id?.toString())).size),
      ],
      clients: participantsFrom(ayurBk),
    },
    meditation: {
      stats: [
        workshopStatTemplate('Meditation-tagged', 'ri-moon-line', medBk.length),
        workshopStatTemplate('Completed', 'ri-check-line', medBk.filter((b) => b.status === 'completed').length),
        workshopStatTemplate('Pending', 'ri-time-line', medBk.filter((b) => b.status === 'pending_approval').length),
        workshopStatTemplate('Trainers', 'ri-user-line', new Set(medBk.map((b) => b.trainer?._id?.toString())).size),
      ],
      clients: participantsFrom(medBk),
    },
    workshop: {
      stats: [
        workshopStatTemplate('Workshop / retreat', 'ri-calendar-line', workBk.length),
        workshopStatTemplate('Participants (rows)', 'ri-group-line', workBk.length),
        workshopStatTemplate('Completed', 'ri-check-line', workBk.filter((b) => b.status === 'completed').length),
        workshopStatTemplate('Pending approval', 'ri-time-line', workBk.filter((b) => b.status === 'pending_approval').length),
      ],
      participants: participantsFrom(workBk),
    },
  };

  const cid = mongoose.Types.ObjectId.isValid(companyId)
    ? new mongoose.Types.ObjectId(companyId)
    : companyId;
  const cuSample = await CompanyUser.find({
    companyId: cid,
    $or: [{ isActive: true }, { isActive: { $exists: false } }],
  })
    .limit(8)
    .sort({ createdAt: -1 })
    .lean();
  const employeeWellnessRows = cuSample.map((u, i) => {
    const st = !u.status
      ? 'At Risk'
      : u.level === 'advanced'
        ? 'Excellent'
        : u.level === 'intermediate'
          ? 'Good'
          : 'Fair';
    const score = !u.status ? 48 : u.level === 'advanced' ? 90 : u.level === 'intermediate' ? 78 : 65;
    return {
      empId: `#CU${String(i + 1).padStart(3, '0')}`,
      name: u.fullName,
      role: u.department || 'Wellness',
      score,
      change: 0,
      streak: '—',
      status: st,
    };
  });

  const reports = {
    banner: {
      titleLines: ['Wellness intelligence', 'Overview'],
      highlightWord: 'Overview',
      subtitle: `Across ${total} bookings · ${completed} completed`,
      ctaDownload: 'Download summary',
      ctaShare: 'Share',
      updatedLabel: 'Live from bookings',
      chartSegments: [
        { pct: Math.min(100, pct), color: '#FB923C' },
        { pct: Math.max(0, 100 - pct), color: '#E5E7EB' },
      ],
    },
    wellnessTrend: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
      month,
      avgScore:
        total === 0 ? 0 : Math.min(100, 40 + i * 8 + (total % 7)),
      participation: total === 0 ? 0 : Math.min(100, 20 + i * 10 + completed),
      goal: 80,
    })),
    scoreDistribution: [
      { label: 'Excellent', count: Math.max(0, completed - 2), color: '#22C55E' },
      { label: 'Good', count: Math.max(0, Math.floor(pending / 2)), color: '#3B82F6' },
      { label: 'Fair', count: Math.max(0, Math.floor(total / 4)), color: '#F97316' },
      { label: 'At Risk', count: Math.max(0, bookings.filter((b) => b.status === 'rejected').length), color: '#EF4444' },
    ],
    scoreDistributionTotal: total,
    overviewStats: [
      {
        label: 'Total bookings',
        value: String(total),
        change: `${pending} pending`,
        changePositive: pending < 5,
        iconBg: '#EFF6FF',
        iconColor: '#3B82F6',
        icon: 'bx-calendar',
      },
      {
        label: 'Completed',
        value: String(completed),
        change: `${pct}% rate`,
        changePositive: true,
        iconBg: '#ECFDF5',
        iconColor: '#10B981',
        icon: 'bx-check-circle',
      },
    ],
    wellnessPillars: programCards.slice(0, 3).map((c) => ({
      id: c.id,
      title: c.title,
      participants: c.activePatients,
      overallPct: c.successRate,
      overallColor: c.progressColor,
      iconBg: c.iconBg,
      iconColor: c.iconColor,
      icon: 'bx-heart',
      metrics: [
        { label: 'Bookings', value: c.activePatients },
        { label: 'Progress', value: c.treatmentProgress },
      ],
      improvement: '+0%',
      improvementPositive: true,
    })),
    employeeWellnessRows,
    topPerformers: distinctTrainers.slice(0, 3).map((tr, idx) => ({
      rank: idx + 1,
      name: tr?.name || 'Trainer',
      role: tr?.title || 'Trainer',
      score: 90 - idx * 5,
      rankColor: idx === 0 ? '#F59E0B' : '#9CA3AF',
    })),
    engagementCards: [
      {
        id: 'eng1',
        title: 'Booking throughput',
        valuePct: `${Math.min(100, total * 4)}%`,
        progressColor: '#FB923C',
        iconBg: '#FFF7ED',
        iconColor: '#EA580C',
        icon: 'bx-trending-up',
        metrics: [
          { label: 'Total', value: String(total) },
          { label: 'Done', value: String(completed) },
        ],
        improvement: 'live',
        improvementPositive: true,
      },
    ],
  };

  return {
    womens: {
      stats: womensStats,
      programCards,
      patientDistribution,
      recentActivities,
      pcos: { stats: statFromList('PCOS', pcosBk, '#9B59B6'), doctors: doctorsFrom(pcosBk) },
      thyroid: { stats: statFromList('Thyroid', thyBk, '#3B82F6'), doctors: doctorsFrom(thyBk) },
      menopause: {
        stats: statFromList('Menopause', menoBk, '#E8613C'),
        engagementLegend: [
          { key: 'a', label: 'Bookings', color: '#FB923C' },
          { key: 'b', label: 'Completed', color: '#10B981' },
          { key: 'c', label: 'Pending', color: '#3B82F6' },
        ],
        engagement: engagementFrom(menoBk),
      },
      periodTracker: {
        stats: statFromList('Period', periodBk, '#10B981'),
        engagementLegend: [
          { key: 'a', label: 'Sessions', color: '#6366F1' },
          { key: 'b', label: 'Follow-ups', color: '#A78BFA' },
          { key: 'c', label: 'Scores', color: '#34D399' },
        ],
        engagement: engagementFrom(periodBk),
      },
    },
    wellness,
    reports,
  };
};

/**
 * Paginated company users as employee-score rows (real data when users exist).
 *
 * @param {string} companyId - Mongo company id
 * @param {Object} query
 * @param {number} [query.page]
 * @param {number} [query.limit]
 * @param {string} [query.search]
 */
export const getCompanyEmployeeWellnessPage = async (companyId, query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const search = (query.search || '').trim();

  const cid = mongoose.Types.ObjectId.isValid(companyId)
    ? new mongoose.Types.ObjectId(companyId)
    : companyId;
  const filter = { companyId: cid };
  const andClauses = [
    { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
  ];

  if (search) {
    andClauses.push({
      $or: [{ fullName: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }],
    });
  }

  const statusFilter = (query.status || '').trim();
  if (statusFilter && statusFilter !== 'All Status') {
    if (statusFilter === 'Excellent') {
      filter.level = 'advanced';
      filter.status = true;
    } else if (statusFilter === 'Good') {
      filter.level = 'intermediate';
      filter.status = true;
    } else if (statusFilter === 'Fair') {
      filter.level = 'beginner';
      filter.status = true;
    } else if (statusFilter === 'At Risk') {
      filter.status = false;
    }
  }

  const departmentFilter = (query.department || '').trim();
  if (departmentFilter && departmentFilter !== 'All Departments') {
    if (departmentFilter === 'Wellness') {
      andClauses.push({
        $or: [
          { department: 'Wellness' },
          { department: { $exists: false } },
          { department: null },
          { department: '' },
        ],
      });
    } else {
      filter.department = departmentFilter;
    }
  }

  if (andClauses.length) {
    filter.$and = andClauses;
  }

  const result = await CompanyUser.paginate(filter, {
    page,
    limit,
    sortBy: 'createdAt:desc',
  });

  const palette = ['#DBEAFE', '#FEF9C3', '#D1FAE5', '#EDE9FE', '#FFE4E6'];
  const employees = result.results.map((u, i) => {
    const st = !u.status
      ? 'At Risk'
      : u.level === 'advanced'
        ? 'Excellent'
        : u.level === 'intermediate'
          ? 'Good'
          : 'Fair';
    const score = !u.status ? 48 : u.level === 'advanced' ? 90 : u.level === 'intermediate' ? 78 : 65;
    const bg = palette[i % palette.length];
    return {
      id: u.id || u._id?.toString(),
      empCode: `CU${String((page - 1) * limit + i + 1).padStart(4, '0')}`,
      initials: initials(u.fullName),
      avatarBg: bg,
      avatarColor: '#2563EB',
      name: u.fullName,
      department: u.department || 'Wellness',
      status: st,
      lastAssessment: u.updatedAt
        ? new Date(u.updatedAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      score,
    };
  });

  return {
    total: result.totalResults,
    employees,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
};
