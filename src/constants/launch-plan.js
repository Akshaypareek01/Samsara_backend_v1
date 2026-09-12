/**
 * Launch Plan catalog constants.
 * Display cap of 300 members is marketing-only — purchases are not hard-capped.
 * Offer window ends 31 Oct 2026 IST. Membership lasts 365 days from purchase.
 */

export const LAUNCH_PLAN_NAME = 'Launch Plan';

/** App Store Connect + RevenueCat product identifier (must match exactly). */
export const LAUNCH_PLAN_APPLE_PRODUCT_ID = 'launch_yearly_plan';

/** End of 31 Oct 2026 in IST (purchase window). */
export const LAUNCH_PLAN_AVAILABLE_UNTIL = new Date('2026-10-31T23:59:59+05:30');

export const LAUNCH_PLAN_BASE_PRICE_INR = 5999;

export const LAUNCH_PLAN_GST_RATE = 18;

export const LAUNCH_PLAN_VALIDITY_DAYS = 365;

/** View-only scarcity copy. Not enforced at purchase time. */
export const LAUNCH_PLAN_DISPLAY_MEMBER_CAP = 300;

export const LAUNCH_PLAN_DISPLAY_FEATURES = [
  'Limited launch — 300 members (display only, more can join)',
  '1 year membership',
  'Offer available until 31 Oct 2026',
];

/**
 * Build the MembershipPlan document for Launch Plan.
 * @param {string[]} [accessFeatures=[]] - Shared Basic Access feature list
 * @returns {object} Fields to insert or $set on MembershipPlan
 */
export function buildLaunchPlanDocument(accessFeatures = []) {
  const uniqueAccess = accessFeatures.filter(
    (feature) => !LAUNCH_PLAN_DISPLAY_FEATURES.includes(feature)
  );

  return {
    name: LAUNCH_PLAN_NAME,
    description:
      'Launch Plan — 1 year membership at ₹5999 + 18% GST. Shown as a 300-member launch offer (not a hard cap). Available to purchase until 31 Oct 2026.',
    basePrice: LAUNCH_PLAN_BASE_PRICE_INR,
    currency: 'INR',
    validityDays: LAUNCH_PLAN_VALIDITY_DAYS,
    features: [...LAUNCH_PLAN_DISPLAY_FEATURES, ...uniqueAccess],
    planType: 'limited-time',
    maxUsers: 1,
    isActive: true,
    isPublic: true,
    availableFrom: new Date(),
    availableUntil: LAUNCH_PLAN_AVAILABLE_UNTIL,
    appleProductId: LAUNCH_PLAN_APPLE_PRODUCT_ID,
    taxConfig: {
      gst: { rate: LAUNCH_PLAN_GST_RATE, type: 'percentage', amount: 0 },
      otherTaxes: [],
    },
    discountConfig: {
      maxDiscountPercentage: 100,
      maxDiscountAmount: null,
    },
    metadata: {
      isLaunchPlan: true,
      billingCycle: 'yearly',
      accessTier: 'Basic Access',
      displayMemberCap: LAUNCH_PLAN_DISPLAY_MEMBER_CAP,
      enforceMemberCap: false,
      offerEndsAt: '2026-10-31',
      revenuecatProductId: LAUNCH_PLAN_APPLE_PRODUCT_ID,
      effectiveMonthlyInr: Math.round(LAUNCH_PLAN_BASE_PRICE_INR / 12),
    },
  };
}
