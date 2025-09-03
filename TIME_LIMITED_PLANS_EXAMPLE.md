# Time-Limited Plans Example

## Overview

This document explains how to create and manage time-limited membership plans where:
1. **Plan Purchase Window**: Users can only purchase the plan within a specific time period
2. **Fixed Membership End Date**: All memberships from the plan expire on the same date, regardless of when they were purchased

## Example: 2025 Year-End Special Plan

### Plan Configuration

```json
{
  "name": "2025 Year-End Special",
  "description": "Special year-end membership - Purchase by Sep 31, 2025, Valid until Dec 30, 2025",
  "price": 1999,
  "currency": "INR",
  "validityDays": 0, // Special case - will be calculated based on end date
  "features": [
    "All premium features",
    "Year-end bonus content",
    "Special 2025 challenges",
    "Exclusive year-end events",
    "Priority support",
    "2025 achievement badges"
  ],
  "planType": "limited-time",
  "maxUsers": 1,
  "isActive": true,
  "availableFrom": "2024-01-01T00:00:00.000Z",
  "availableUntil": "2025-09-30T23:59:59.000Z", // Can purchase until Sep 31, 2025
  "metadata": {
    "specialValidityEndDate": "2025-12-30T23:59:59.000Z", // All memberships expire on Dec 30, 2025
    "description": "This plan can be purchased until September 31, 2025. All memberships from this plan will expire on December 30, 2025, regardless of purchase date."
  }
}
```

### How It Works

#### 1. Plan Availability
- **Available From**: January 1, 2024
- **Available Until**: September 30, 2025
- Users can only purchase this plan during this period

#### 2. Membership Validity
- **Fixed End Date**: December 30, 2025
- All memberships created from this plan will expire on this date
- The actual validity period depends on when the user purchases:

| Purchase Date | Membership Start | Membership End | Validity Period |
|---------------|------------------|----------------|-----------------|
| Jan 1, 2024   | Jan 1, 2024     | Dec 30, 2025   | ~729 days       |
| Jun 1, 2024   | Jun 1, 2024     | Dec 30, 2025   | ~577 days       |
| Sep 30, 2025  | Sep 30, 2025    | Dec 30, 2025   | ~91 days        |

### API Usage Examples

#### 1. Create the Plan (Admin)

```bash
POST /api/v1/membership-plans
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "2025 Year-End Special",
  "description": "Special year-end membership - Purchase by Sep 31, 2025, Valid until Dec 30, 2025",
  "price": 1999,
  "currency": "INR",
  "validityDays": 0,
  "features": [
    "All premium features",
    "Year-end bonus content",
    "Special 2025 challenges",
    "Exclusive year-end events",
    "Priority support",
    "2025 achievement badges"
  ],
  "planType": "limited-time",
  "maxUsers": 1,
  "availableFrom": "2024-01-01T00:00:00.000Z",
  "availableUntil": "2025-09-30T23:59:59.000Z",
  "metadata": {
    "specialValidityEndDate": "2025-12-30T23:59:59.000Z",
    "description": "This plan can be purchased until September 31, 2025. All memberships from this plan will expire on December 30, 2025, regardless of purchase date."
  }
}
```

#### 2. Purchase Membership (User)

```bash
POST /api/v1/payments/create-order
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "planId": "64a1b2c3d4e5f6789012345"
}
```

**Response:**
```json
{
  "order": {
    "id": "order_1234567890",
    "amount": 199900,
    "currency": "INR",
    "receipt": "RCP_1234567890_abc123",
    "status": "created"
  },
  "transaction": {
    "transactionId": "TXN_1234567890_def456",
    "status": "pending",
    "amount": 1999,
    "originalAmount": 1999,
    "discountAmount": 0
  },
  "plan": {
    "name": "2025 Year-End Special",
    "price": 1999,
    "validityDays": 0
  }
}
```

#### 3. Verify Payment

```bash
POST /api/v1/payments/verify
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and membership created successfully",
  "membership": {
    "userId": "64a1b2c3d4e5f6789012346",
    "planId": "64a1b2c3d4e5f6789012345",
    "planName": "2025 Year-End Special",
    "validityDays": 729, // Calculated based on purchase date
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2025-12-30T23:59:59.000Z", // Fixed end date
    "amountPaid": 1999,
    "status": "active"
  }
}
```

### System Behavior

#### Before September 30, 2025
- Plan appears in available plans list
- Users can purchase the plan
- Each purchase creates a membership with the fixed end date

#### After September 30, 2025
- Plan no longer appears in available plans list
- Users cannot purchase the plan
- Existing memberships continue until December 30, 2025

#### After December 30, 2025
- All memberships from this plan automatically expire
- System marks them as expired

### Use Cases

1. **Seasonal Promotions**: Holiday specials, summer programs
2. **Event-Based Plans**: Conference access, workshop memberships
3. **Limited-Time Offers**: Flash sales, early bird pricing
4. **Year-End Campaigns**: Annual membership drives
5. **Corporate Programs**: Time-bound employee wellness programs

### Benefits

1. **Clear Communication**: Users know exactly when they can purchase and when their membership expires
2. **Fair Pricing**: Everyone pays the same price regardless of purchase timing
3. **Marketing Flexibility**: Create urgency with limited purchase windows
4. **Event Alignment**: Align memberships with specific events or seasons
5. **Revenue Predictability**: Know exactly when all memberships from a plan will end

### Technical Implementation

The system handles this through:

1. **Plan Availability Check**: `availableFrom` and `availableUntil` fields control purchase window
2. **Fixed End Date**: `metadata.specialValidityEndDate` overrides normal validity calculation
3. **Dynamic Validity**: `getMembershipEndDate()` and `getActualValidityDays()` methods calculate correct dates
4. **Automatic Expiration**: System automatically marks memberships as expired on the fixed end date

This approach provides maximum flexibility for creating time-limited promotional plans while maintaining clear and predictable membership terms.
