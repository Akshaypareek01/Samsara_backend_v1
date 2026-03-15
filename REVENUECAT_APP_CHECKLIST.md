# RevenueCat Integration — App Checklist & Verification

**Purpose:** Changes required in the app + verification steps so RevenueCat + backend work smoothly.

---

## Part 1: App Changes

### 1.1 Log in to RevenueCat with Backend User ID

**Where:** `App.js` (or wherever auth state is available)

**When:** Right after user logs in

```javascript
useEffect(() => {
  if (userData?.id && userData?.token) {
    Purchases.logIn(userData.id);  // or userData._id — must be backend MongoDB user ID
  }
}, [userData?.id]);
```

**Why:** RevenueCat links purchases to this ID. Backend uses the same ID to create/update membership records.

---

### 1.2 Call Sync After Successful Purchase

**Where:** `syncRevenueCatPurchaseToBackend.js` or wherever purchase completes (e.g. `MemberShip.jsx`, `MembershipRequiredPage.jsx`)

**When:** Immediately after `Purchases.purchasePackage()` succeeds

```javascript
// After purchase succeeds
const { customerInfo } = await Purchases.purchasePackage(pkg);

if (customerInfo.entitlements.active['Samsara Wellness Pro']) {
  await MembershipApiService.syncRevenueCatPurchase();
  // Then: loadMembershipData(), navigate to Tabs, etc.
}
```

**Sync endpoint:**
```
POST https://apis-samsarawellness.in/v1/memberships/sync-revenuecat
Headers: { Authorization: Bearer <user_token> }
Body: {} (optional)
```

---

### 1.3 MembershipApiService — Sync Method

**File:** `services/MembershipApiService.js`

Ensure `syncRevenueCatPurchase` (or equivalent) calls:

```javascript
syncRevenueCatPurchase: async () => {
  const token = await getAuthToken(); // your auth token getter
  const res = await fetch(`${Base_url}/memberships/sync-revenuecat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
},
```

---

### 1.4 Keep Membership Gate Backend-Driven

**Source of truth:** `GET /payments/memberships/active`

- Do **not** use RevenueCat `isPro` for the membership gate.
- Use `MembershipApiService.getActiveMembership()` response.
- Active = `status` in `['active','trial','trial_free']` AND `endDate > now` (or `daysRemaining > 0`).

---

### 1.5 Optional: Sync on App Focus

**Where:** `App.js` or auth refresh logic

**When:** App comes to foreground / user data refreshes

```javascript
useEffect(() => {
  if (userData?.id && userData?.token) {
    MembershipApiService.syncRevenueCatPurchase().catch(() => {});
  }
}, [userData?.id]);
```

**Why:** Catches renewals, purchases from another device, or missed syncs.

---

## Part 2: Things to Check (Verification)

### 2.1 Backend

| Check | How |
|-------|-----|
| `REVENUECAT_SECRET_KEY` in `.env` | From RevenueCat Dashboard → Project Settings → API Keys → Secret key (`sk_...`) |
| `REVENUECAT_WEBHOOK_SECRET` in `.env` | Same value as RevenueCat webhook "Authorization header value" |
| Webhook URL in RevenueCat | `https://apis-samsarawellness.in/v1/webhooks/revenuecat` |
| MembershipPlan `appleProductId` | Matches RevenueCat product ID (e.g. `basic_monthly_plan`) |

---

### 2.2 RevenueCat Dashboard

| Check | Where |
|-------|-------|
| Webhook added | Integrations → Webhooks → URL + auth header set |
| Entitlement ID | `Samsara Wellness Pro` (or whatever app uses) |
| Product ID | Matches `appleProductId` in backend plan (e.g. `basic_monthly_plan`) |
| App Store Connect product | Same product ID, status Ready to Submit |

---

### 2.3 App Config

| Check | File / Location |
|-------|------------------|
| `Base_url` | `https://apis-samsarawellness.in/v1` |
| `ENTITLEMENT_ID` | `Samsara Wellness Pro` (matches RevenueCat) |
| `PRODUCT_IDS.BASIC_MONTHLY` | Same as backend `appleProductId` |
| API key | Use TEST key for sandbox, production key for release |

---

### 2.4 Apple / Sandbox

| Check | How |
|-------|-----|
| Sandbox Testers | App Store Connect → Users and Access → Sandbox → Testers |
| Sign out of production Apple ID | On test device, use Sandbox Tester only for IAP |
| No dev mode in app | Apple auto-uses sandbox in dev/TestFlight builds |

---

### 2.5 End-to-End Flow

| Step | Expected |
|------|----------|
| User logs in | `Purchases.logIn(userId)` called |
| User taps Subscribe (Basic Monthly) | RevenueCat paywall shown |
| User completes purchase | `syncRevenueCatPurchase()` called |
| Backend receives sync | Membership created/updated, `paymentProvider: 'revenuecat'` |
| App checks membership | `GET /payments/memberships/active` returns membership |
| User sees main app | `showMembershipModal = false` |

---

## Part 3: Quick Reference

### API Endpoints Used by App

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/memberships/sync-revenuecat` | POST | Sync RevenueCat entitlement to backend (after purchase) |
| `/memberships/verify-receipt` | POST | Fallback: validate Apple receipt (optional) |
| `/payments/memberships/active` | GET | Membership gate — source of truth |
| `/membership-plans/active` | GET | List plans for paywall / PaymentPage |

### Files to Touch

| File | Change |
|------|--------|
| `App.js` | `logInRevenueCat(userData.id)` on login |
| `services/MembershipApiService.js` | `syncRevenueCatPurchase()` → POST sync endpoint |
| `services/syncRevenueCatPurchaseToBackend.js` | Call sync after purchase success |
| `Config/RevenueCatConfig.js` | Product ID matches backend |
| `Pages/MemberShip/MemberShip.jsx` | After RC purchase → sync → refresh |
| `Pages/MemberShip/MembershipRequiredPage.jsx` | After RC purchase → sync → navigate to Tabs |

---

## Part 4: Troubleshooting

| Issue | Check |
|-------|-------|
| "No active membership" after purchase | Sync called? Backend logs? Plan has correct `appleProductId`? |
| Webhook not firing | URL correct? Auth header matches `.env`? |
| Sync returns 404 | User logged in? `logIn(userId)` called with correct ID? |
| Sandbox purchase fails | Sandbox Tester signed in? Product approved in App Store Connect? |
