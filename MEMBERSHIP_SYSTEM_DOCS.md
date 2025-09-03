# Membership & Payment System Documentation

## Overview

This document describes the comprehensive membership and payment system built for the Samsara backend. The system includes membership plans, coupon codes, payment processing with Razorpay, and transaction management.

## System Architecture

### Models

#### 1. MembershipPlan Model
- **Purpose**: Defines different membership plans with pricing and features
- **Key Fields**:
  - `name`: Plan name (unique)
  - `description`: Plan description
  - `price`: Plan price in rupees
  - `currency`: Currency code (INR, USD, EUR)
  - `validityDays`: Number of days the plan is valid
  - `features`: Array of plan features
  - `planType`: Type of plan (basic, premium, enterprise, trial)
  - `maxUsers`: Maximum users allowed
  - `razorpayPlanId`: Razorpay plan ID for recurring payments
  - `isActive`: Whether the plan is active

#### 2. CouponCode Model
- **Purpose**: Manages discount coupons with validation logic
- **Key Fields**:
  - `code`: Unique coupon code (uppercase)
  - `name`: Coupon name
  - `discountType`: Type of discount (percentage, fixed)
  - `discountValue`: Discount amount/percentage
  - `maxDiscountAmount`: Maximum discount for percentage coupons
  - `minOrderAmount`: Minimum order amount to apply coupon
  - `startDate`/`endDate`: Validity period
  - `usageLimit`: Total usage limit (null for unlimited)
  - `usedCount`: Number of times used
  - `usageLimitPerUser`: Usage limit per user
  - `applicablePlans`: Plans this coupon can be applied to
  - `applicableUserCategories`: User categories this coupon applies to
  - `isActive`: Whether the coupon is active

#### 3. Membership Model
- **Purpose**: Tracks user memberships and subscriptions
- **Key Fields**:
  - `userId`: Reference to user
  - `planId`: Reference to membership plan
  - `planName`: Plan name (denormalized)
  - `validityDays`: Validity in days
  - `status`: Membership status (active, inactive, expired, cancelled, pending)
  - `startDate`/`endDate`: Membership period
  - `amountPaid`: Amount actually paid
  - `originalAmount`: Original plan price
  - `discountAmount`: Discount applied
  - `couponCode`: Reference to coupon used
  - `razorpayOrderId`/`razorpayPaymentId`/`razorpaySignature`: Razorpay details
  - `autoRenewal`: Auto-renewal setting
  - `cancelledAt`/`cancellationReason`: Cancellation details
  - `refundAmount`/`refundStatus`/`refundDate`: Refund details

#### 4. Transaction Model
- **Purpose**: Tracks all payment transactions
- **Key Fields**:
  - `userId`: Reference to user
  - `membershipId`: Reference to membership (if applicable)
  - `transactionId`: Unique transaction ID
  - `orderId`: Order ID
  - `amount`: Transaction amount
  - `currency`: Currency code
  - `razorpayOrderId`/`razorpayPaymentId`/`razorpaySignature`: Razorpay details
  - `status`: Transaction status (pending, completed, failed, cancelled, refunded)
  - `paymentMethod`: Payment method used
  - `couponCode`: Reference to coupon used
  - `discountAmount`: Discount applied
  - `originalAmount`: Original amount
  - `planId`/`planName`: Plan details
  - `errorDetails`: Error information for failed transactions
  - `refundAmount`/`refundId`/`refundStatus`/`refundDate`: Refund details

### Services

#### RazorpayService
- **Purpose**: Handles all Razorpay payment operations
- **Key Methods**:
  - `createOrder()`: Create Razorpay order
  - `verifyPaymentSignature()`: Verify payment signature
  - `fetchPayment()`: Get payment details
  - `createRefund()`: Process refunds
  - `createPlan()`: Create recurring payment plans
  - `createSubscription()`: Create subscriptions
  - `convertToPaise()`/`convertFromPaise()`: Currency conversion utilities

### Controllers

#### 1. MembershipPlanController
- **Endpoints**:
  - `POST /membership-plans` - Create plan (admin)
  - `GET /membership-plans` - Get all plans
  - `GET /membership-plans/active` - Get active plans (public)
  - `GET /membership-plans/type/:planType` - Get plans by type
  - `GET /membership-plans/:planId` - Get specific plan
  - `PATCH /membership-plans/:planId` - Update plan (admin)
  - `DELETE /membership-plans/:planId` - Delete plan (admin)
  - `PATCH /membership-plans/:planId/toggle-status` - Toggle status (admin)
  - `GET /membership-plans/stats` - Get plan statistics

#### 2. CouponController
- **Endpoints**:
  - `POST /coupons` - Create coupon (admin)
  - `GET /coupons` - Get all coupons
  - `GET /coupons/active` - Get active coupons (public)
  - `GET /coupons/validate` - Validate coupon code
  - `GET /coupons/plan/:planId` - Get coupons for specific plan
  - `GET /coupons/:couponId` - Get specific coupon
  - `PATCH /coupons/:couponId` - Update coupon (admin)
  - `DELETE /coupons/:couponId` - Delete coupon (admin)
  - `PATCH /coupons/:couponId/toggle-status` - Toggle status (admin)
  - `GET /coupons/stats` - Get coupon statistics

#### 3. PaymentController
- **Endpoints**:
  - `POST /payments/create-order` - Create payment order
  - `POST /payments/verify` - Verify payment
  - `GET /payments/transactions` - Get user transactions
  - `GET /payments/transactions/:transactionId` - Get specific transaction
  - `GET /payments/memberships` - Get user memberships
  - `GET /payments/memberships/active` - Get active membership
  - `PATCH /payments/memberships/:membershipId/cancel` - Cancel membership
  - `POST /payments/memberships/:membershipId/refund` - Request refund
  - `POST /payments/memberships/:membershipId/process-refund` - Process refund (admin)

## API Usage Examples

### 1. Create a Membership Plan (Admin)

```bash
POST /api/v1/membership-plans
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Premium Monthly",
  "description": "Premium membership for 1 month",
  "price": 999,
  "currency": "INR",
  "validityDays": 30,
  "features": [
    "Unlimited classes",
    "Personal trainer access",
    "Nutrition guidance"
  ],
  "planType": "premium",
  "maxUsers": 1
}
```

### 2. Create a Coupon Code (Admin)

```bash
POST /api/v1/coupons
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "WELCOME20",
  "name": "Welcome Discount",
  "description": "20% off for new users",
  "discountType": "percentage",
  "discountValue": 20,
  "maxDiscountAmount": 500,
  "minOrderAmount": 1000,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "usageLimit": 1000,
  "usageLimitPerUser": 1,
  "applicableUserCategories": ["Personal"]
}
```

### 3. Create Payment Order

```bash
POST /api/v1/payments/create-order
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "planId": "64a1b2c3d4e5f6789012345",
  "couponCode": "WELCOME20"
}
```

**Response:**
```json
{
  "order": {
    "id": "order_1234567890",
    "amount": 79920,
    "currency": "INR",
    "receipt": "RCP_1234567890_abc123",
    "status": "created"
  },
  "transaction": {
    "transactionId": "TXN_1234567890_def456",
    "status": "pending",
    "amount": 799.20,
    "originalAmount": 999,
    "discountAmount": 199.80
  },
  "plan": {
    "name": "Premium Monthly",
    "price": 999,
    "validityDays": 30
  },
  "discount": {
    "couponCode": "WELCOME20",
    "discountAmount": 199.80,
    "originalAmount": 999,
    "finalAmount": 799.20
  }
}
```

### 4. Verify Payment

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

### 5. Validate Coupon Code

```bash
POST /api/v1/coupons/validate
Content-Type: application/json

{
  "code": "WELCOME20",
  "planId": "64a1b2c3d4e5f6789012345",
  "userCategory": "Personal",
  "orderAmount": 999
}
```

## Environment Variables

Add these to your `.env` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret_key
```

## Database Indexes

The system includes optimized indexes for:
- User memberships by status and dates
- Transactions by user and payment IDs
- Coupon codes by code and validity
- Membership plans by type and status

## Error Handling

The system includes comprehensive error handling for:
- Invalid coupon codes
- Expired coupons
- Payment verification failures
- Insufficient permissions
- Invalid plan references
- Razorpay API errors

## Security Features

- Payment signature verification
- User authorization checks
- Admin-only operations protection
- Input validation and sanitization
- Secure coupon code validation

## Testing

To test the system:

1. **Create test plans and coupons** using admin endpoints
2. **Test payment flow** with Razorpay test keys
3. **Verify coupon validation** with different scenarios
4. **Test membership lifecycle** (create, cancel, refund)

## Production Considerations

1. **Use Razorpay live keys** in production
2. **Set up webhooks** for payment status updates
3. **Implement proper logging** for all transactions
4. **Set up monitoring** for failed payments
5. **Configure backup systems** for critical data
6. **Implement rate limiting** for payment endpoints

## Future Enhancements

1. **Recurring payments** with Razorpay subscriptions
2. **Gift memberships** functionality
3. **Referral system** with commission tracking
4. **Advanced analytics** for membership metrics
5. **Multi-currency support** with dynamic pricing
6. **Membership tiers** with upgrade/downgrade options

## Support

For issues or questions regarding the membership system, please refer to:
- Razorpay documentation: https://razorpay.com/docs/
- System logs for debugging
- Database queries for data verification
