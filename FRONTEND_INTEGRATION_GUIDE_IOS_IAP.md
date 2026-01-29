# Frontend Integration Guide: iOS In-App Purchases & Payments

This document outlines the workflow and API requirements for integrating iOS In-App Purchases (IAP) and existing Razorpay payments with the updated backend.

---

## 1. Important Change: Platform Identification
**Every payment-related request (Razorpay or Apple) must now include a `platform` field.**
Valid values: `ios`, `android`, `web`.

---

## 2. iOS In-App Purchase Flow (Apple)

For iOS devices, you **MUST NOT** use Razorpay. Instead, allow the user to purchase via Apple's native IAP and then verify the receipt with our backend.

### Step-by-Step Flow:
1. **Fetch Plans**: Call `GET /v1/membership-plans`. Use the `appleProductId` from the response to initialize your Apple IAP purchase.
2. **Apple Purchase**: Complete the purchase natively (e.g., using `expo-in-app-purchases` or `react-native-iap`).
3. **Receipt Verification**: Once Apple provides a receipt, send it to the backend.

### Receipt Verification API
- **URL**: `POST /v1/membership/verify-receipt`
- **Auth**: Required (Bearer Token)
- **Body**:
```json
{
  "productId": "com.samsara.wellness.monthly",
  "receiptData": "BASE64_ENCODED_RECEIPT_STRING"
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "iOS Subscription verified and membership created successfully",
  "data": {
    "planName": "Monthly Premium",
    "status": "active",
    "startDate": "2024-01-29T00:00:00.000Z",
    "endDate": "2024-02-29T00:00:00.000Z",
    "paymentProvider": "apple",
    "transactionId": "340001234567890"
  }
}
```

---

## 3. Updated Razorpay Flow (Web & Android)

The Razorpay flow is now restricted to `web` and `android` platforms. If you send `platform: "ios"`, the request will be rejected.

### A. Create Order
- **URL**: `POST /v1/payment/create-order`
- **Body**:
```json
{
  "planId": "PLAN_DB_ID",
  "couponCode": "NEWYEAR50",
  "platform": "android" 
}
```

### B. Verify Payment
- **URL**: `POST /v1/payment/verify`
- **Body**:
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "sig_xyz",
  "platform": "android"
}
```

---

## 4. UI Best Practices
1. **Logic for Billing**:
   - If `Platform.OS === 'ios'`, only show "Pay with Apple Pay / App Store".
   - If `Platform.OS === 'android'` or `Web`, show Razorpay/Card/UPI options.
2. **Active Subscription Check**:
   - Always call `GET /v1/membership/active` on app launch to check the user's current status. The response now includes `paymentProvider` (e.g., `"apple"` or `"razorpay"`).

---

## 5. Apple Product IDs Listing
Use these IDs to register your products in App Store Connect:
- **Trial Plan**: `com.samsara.wellness.monthly`
- **Lifetime Plan**: `com.samsara.wellness.monthly`
- **Beta Launch Plan**: `com.samsara.wellness.monthly`

*(Note: Currently all are set to the same ID as per your requirement; update them in the Admin Panel if different tiers are needed)*
