# RevenueCat iOS Membership Flow – App & Backend Integration

**Purpose:** Document the full in-app membership flow for iOS (RevenueCat) so backend and frontend teams understand current behavior and required changes.

---

## 1. Platform Split

| Platform | Subscription Flow |
|----------|--------------------|
| **iOS** | RevenueCat (App Store IAP) for Basic Monthly plan; backend/Razorpay for other plans |
| **Android** | Backend only (Razorpay, etc.) – no RevenueCat |

---

## 2. App Startup Flow (iOS)

```
App Launch
    │
    ├─► configureRevenueCat(null, __DEV__)  [App.js useEffect]
    │       • Uses API key from RevenueCatConfig (TEST or APPLE)
    │       • No-op on Android
    │
    ├─► IAPService.initialize()  [legacy; RevenueCat handles IAP when using paywall]
    │
    └─► SubscriptionProvider wraps app
            • useRevenueCat() → isPro, customerInfo, presentPaywall, etc.
```

**After user logs in:**
```
userData available
    │
    └─► logInRevenueCat(appUserId)  [App.js useEffect]
            • appUserId = user._id or user.id (backend user ID)
            • Links RevenueCat customer to our backend user
```

---

## 3. Membership Gate (App.js)

**Source of truth for "has membership":** Backend API `GET /payments/memberships/active`

- On auth change, app calls `MembershipApiService.getActiveMembership()`
- Response drives `showMembershipModal`:
  - **Active membership** → `showMembershipModal = false` → user sees Tabs (main app)
  - **No/expired membership** → `showMembershipModal = true` → user sees `MembershipRequired` screen

**Active membership criteria:**
- `status` in `['active', 'trial', 'trial_free']` or `isActive === true`
- AND (`daysRemaining > 0` OR `endDate > now` OR `daysRemaining === -1`)

**Important:** On iOS, RevenueCat `isPro` is **not** used for the membership gate. The gate is purely backend-driven via `getActiveMembership()`.

**Refresh trigger:** Membership check runs when `userData` or `Auth` changes (e.g. login, `refreshAuthState` on app focus). After a RevenueCat purchase, user is navigated to Tabs; membership is re-checked on next app focus when auth state refreshes.

---

## 4. Which Plans Use RevenueCat on iOS?

**Config:** `Config/RevenueCatConfig.js` → `isRevenueCatPlanOnIOS(plan)`

A plan uses RevenueCat if **all** of:
- `planType === 'basic'` OR `plan.name` includes `'basic'`
- `plan.validityDays <= 35` OR `plan.name` includes `'monthly'`

**Current behavior:** Only **Basic Monthly** plans from backend match this. All other plans (Premium, Basic yearly, etc.) use the existing flow (PaymentPage → Razorpay/backend).

---

## 5. Membership Screen Flow (MemberShip.jsx)

### 5.1 Load Data

1. `loadMembershipData()`:
   - `MembershipApiService.getActivePlans()` → plans from backend
   - `MembershipApiService.getActiveMembership()` → active membership
   - Trial plans filtered if user already had trial (`hasUserHadTrialPlan`)

2. **iOS only:** Only Basic tab + Basic Monthly plan cards shown (`basicPlans.filter(isRevenueCatPlanOnIOS)`)

### 5.2 User Clicks "Subscribe"

**If iOS + plan is RevenueCat (Basic Monthly):**
```javascript
subscription.presentPaywall()
    │
    ├─► RevenueCat UI paywall shown (from RevenueCat dashboard)
    ├─► User completes purchase via App Store
    └─► On success:
            • syncRevenueCatPurchaseToBackend(productId)
            • loadMembershipData()  // refresh local membership
```

**Otherwise (Android, or non-RC plan):**
```javascript
navigation.navigate('PaymentPage', { planId, planName, basePrice })
    // Existing Razorpay/backend flow
```

---

## 6. MembershipRequired Page Flow

When user has no active membership, they see `MembershipRequiredPage`:

1. **"Take Your Membership Now"** → `navigation.navigate('Plans')` → MemberShip screen
2. **"Subscribe with Apple / Google"** (iOS only, when RevenueCat available):
   - `subscription.presentPaywall()`
   - On purchase → `navigation.reset({ routes: [{ name: 'Tabs' }] })` → main app

---

## 7. Post-Purchase Sync to Backend

**File:** `services/syncRevenueCatPurchaseToBackend.js`

After a successful RevenueCat purchase, app tries **two** sync strategies:

### Strategy 1: Receipt-based (preferred)

1. `IAP.getAvailablePurchases()` → get receipt for `productId`
2. `POST /membership/verify-receipt`
   - Body: `{ productId, receiptData, platform: 'ios' }`
   - Backend validates receipt with Apple, creates/updates membership

### Strategy 2: RevenueCat sync (fallback)

If Strategy 1 fails (e.g. no receipt, verify-receipt error):

1. `POST /membership/sync-revenuecat`
   - Body: `{ productId, platform: 'ios' }`
   - Backend should verify with RevenueCat API (or webhooks) and create membership

**productId** comes from RevenueCat `customerInfo.entitlements.active['Samsara Wellness Pro'].productIdentifier` (e.g. `basic_monthly_plan`).

---

## 8. Backend API Summary

### Required Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/membership-plans/active` | GET | List plans (used to decide RC vs PaymentPage) |
| `/payments/memberships/active` | GET | Source of truth for membership gate |
| `/membership/verify-receipt` | POST | Validate Apple receipt, create membership |
| `/membership/sync-revenuecat` | POST | Fallback: verify via RevenueCat API, create membership |

### verify-receipt Request

```json
{
  "productId": "basic_monthly_plan",
  "receiptData": "<base64 Apple receipt>",
  "platform": "ios"
}
```

### sync-revenuecat Request

```json
{
  "productId": "basic_monthly_plan",
  "platform": "ios"
}
```

**Backend must:**
- Identify user from auth token (same as other membership endpoints)
- Map `productId` (RevenueCat/App Store) to internal plan ID
- Create/update membership record
- Return membership in same shape as `getActiveMembership` so app shows active state

---

## 9. RevenueCat Configuration (App)

| Config | Value | Notes |
|--------|-------|-------|
| `ENTITLEMENT_ID` | `Samsara Wellness Pro` | Must match RevenueCat dashboard |
| `DEFAULT_OFFERING_ID` | `basic` | Offering used for paywall |
| `PRODUCT_IDS.BASIC_MONTHLY` | `basic_monthly_plan` | App Store product ID |
| API keys | `REVENUECAT_API_KEYS.TEST` / `APPLE` | In RevenueCatConfig.js |

---

## 10. Plan Matching: Backend ↔ RevenueCat

Backend plans have: `planType`, `name`, `validityDays`, `_id`, etc.

App decides "use RevenueCat" with:
```javascript
isRevenueCatPlanOnIOS(plan) =
  (planType === 'basic' || name.includes('basic')) &&
  (validityDays <= 35 || name.includes('monthly'))
```

Backend receives `productId` from RevenueCat (e.g. `basic_monthly_plan`). Backend must map this to the correct plan `_id` when creating membership.

**Suggested mapping (backend):**
- `basic_monthly_plan` → plan with `planType: 'basic'`, `validityDays: 30` (or equivalent)

---

## 11. Files Reference

| File | Role |
|------|------|
| `Config/RevenueCatConfig.js` | API keys, entitlement, product IDs, `isRevenueCatPlanOnIOS` |
| `services/RevenueCatService.js` | configure, logIn, getCustomerInfo, hasProEntitlement, etc. |
| `services/syncRevenueCatPurchaseToBackend.js` | Post-purchase sync (verify-receipt + sync-revenuecat) |
| `services/MembershipApiService.js` | getActivePlans, getActiveMembership, verifyReceipt, syncRevenueCatPurchase |
| `hooks/useRevenueCat.js` | presentPaywall, presentPaywallIfNeeded, isPro, customerInfo |
| `Context/SubscriptionContext.jsx` | SubscriptionProvider, useSubscription |
| `Pages/MemberShip/MemberShip.jsx` | Plans screen, plan click → RC paywall or PaymentPage |
| `Pages/MemberShip/MembershipRequiredPage.jsx` | Gate screen, "Subscribe with Apple" button |
| `App.js` | configureRevenueCat, logInRevenueCat, membership gate logic |

---

## 12. What Backend Needs to Implement/Verify

1. **`POST /membership/verify-receipt`**
   - Validate Apple receipt server-side
   - Create membership for authenticated user
   - Map `productId` to plan

2. **`POST /membership/sync-revenuecat`**
   - Receive `productId` + `platform`
   - Verify purchase via RevenueCat REST API (or rely on webhooks)
   - Create/update membership for authenticated user

3. **`GET /payments/memberships/active`**
   - Must return iOS RevenueCat-created memberships (same shape as Razorpay memberships)
   - App uses this for membership gate; if missing, user stays on MembershipRequired

4. **Plan mapping**
   - Ensure a plan exists that matches `basic_monthly_plan` (basic, ~30 days)
   - Backend plan `_id` used when creating membership from RC purchase

---

## 13. Optional: RevenueCat Webhooks

Backend can subscribe to RevenueCat webhooks (e.g. `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`) to keep membership in sync without relying on app-initiated sync. App sync is still used as immediate post-purchase notification; webhooks help with renewals, cancellations, and missed app syncs.

---

## 14. Testing Notes

- **Sandbox:** Use Apple sandbox testers; RevenueCat test key or Apple key both work
- **Expo Go:** RevenueCat runs in preview mode (no real IAP)
- **Test receipt bypass:** If `receiptData === 'DUMMY_TEST_RECEIPT'`, `MembershipApiService.verifyReceipt` returns mock success (dev only)
