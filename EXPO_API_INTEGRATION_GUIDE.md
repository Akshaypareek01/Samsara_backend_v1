# Expo React Native API Integration Guide

## Overview
This guide provides complete API documentation for integrating the Samsara membership system with your Expo React Native app.

## Base Configuration

```javascript
// src/config/api.js
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/v1', // Change to your server URL
  RAZORPAY_KEY_ID: 'rzp_test_your_key_id', // Your Razorpay test key
};

// For production
const PRODUCTION_CONFIG = {
  BASE_URL: 'https://your-production-domain.com/v1',
  RAZORPAY_KEY_ID: 'rzp_live_your_live_key',
};
```

---

## 1. Authentication

### Get User Token
```javascript
// Store token after login
await AsyncStorage.setItem('authToken', userToken);

// Get token for API calls
const token = await AsyncStorage.getItem('authToken');
```

---

## 2. Membership Plans APIs

### 2.1 Get Active Membership Plans
**Endpoint:** `GET /membership-plans/active`

**Headers:**
```javascript
{
  'Content-Type': 'application/json'
  // No authentication required
}
```

**Response:**
```json
{
  "results": [
    {
      "_id": "68b81f09ead669d0f5daafe4",
      "name": "Basic Monthly",
      "description": "Basic membership plan for 1 month with essential features",
      "basePrice": 499,
      "currency": "INR",
      "validityDays": 30,
      "features": [
        "Access to basic classes",
        "Community support",
        "Basic tracking features"
      ],
      "planType": "basic",
      "maxUsers": 1,
      "isActive": true,
      "availableFrom": "2025-09-03T10:57:13.905Z",
      "availableUntil": null,
      "taxConfig": {
        "gst": {
          "rate": 18,
          "type": "percentage",
          "amount": 0
        },
        "otherTaxes": []
      },
      "discountConfig": {
        "maxDiscountPercentage": 50,
        "maxDiscountAmount": 200
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 7
}
```

**React Native Implementation:**
```javascript
const getActivePlans = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/membership-plans/active`);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
};
```

### 2.2 Get Plan Pricing Breakdown
**Endpoint:** `GET /membership-plans/{planId}/pricing?couponCode={couponCode}`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_USER_TOKEN'
}
```

**Query Parameters:**
- `couponCode` (optional): Coupon code to apply

**Response:**
```json
{
  "plan": {
    "_id": "68b81f09ead669d0f5daafe4",
    "name": "Basic Monthly",
    "basePrice": 499,
    "currency": "INR"
  },
  "pricing": {
    "basePrice": 499,
    "taxes": {
      "gst": {
        "rate": 18,
        "type": "percentage",
        "amount": 89.82
      },
      "other": []
    },
    "subtotal": 588.82,
    "discount": {
      "amount": 117.76,
      "couponCode": "WELCOME20"
    },
    "total": 471.06,
    "currency": "INR"
  },
  "coupon": {
    "code": "WELCOME20",
    "name": "Welcome Discount",
    "discountType": "percentage",
    "discountValue": 20
  }
}
```

**React Native Implementation:**
```javascript
const getPlanPricing = async (planId, couponCode = null) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const endpoint = couponCode 
      ? `/membership-plans/${planId}/pricing?couponCode=${couponCode}`
      : `/membership-plans/${planId}/pricing`;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pricing:', error);
    throw error;
  }
};
```

---

## 3. Coupon Codes APIs

### 3.1 Get Active Coupon Codes
**Endpoint:** `GET /coupons/active`

**Headers:**
```javascript
{
  'Content-Type': 'application/json'
  // No authentication required
}
```

**Response:**
```json
{
  "results": [
    {
      "_id": "68b81f09ead669d0f5daaffb",
      "code": "WELCOME20",
      "name": "Welcome Discount",
      "description": "20% off for new users",
      "discountType": "percentage",
      "discountValue": 20,
      "maxDiscountAmount": 500,
      "minOrderAmount": 1000,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-12-31T00:00:00.000Z",
      "usageLimit": 1000,
      "usedCount": 0,
      "usageLimitPerUser": 1,
      "applicablePlans": ["68b81f09ead669d0f5daafe5"],
      "applicableUserCategories": ["Personal"],
      "isActive": true
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 5
}
```

**React Native Implementation:**
```javascript
const getActiveCoupons = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/coupons/active`);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};
```

### 3.2 Validate Coupon Code
**Endpoint:** `POST /coupons/validate`

**Headers:**
```javascript
{
  'Content-Type': 'application/json'
  // No authentication required
}
```

**Request Body:**
```json
{
  "code": "WELCOME20",
  "planId": "68b81f09ead669d0f5daafe4",
  "userCategory": "Personal",
  "orderAmount": 588.82
}
```

**Response (Valid Coupon):**
```json
{
  "valid": true,
  "couponCode": {
    "_id": "68b81f09ead669d0f5daaffb",
    "code": "WELCOME20",
    "name": "Welcome Discount",
    "discountType": "percentage",
    "discountValue": 20
  },
  "discountAmount": 117.76,
  "finalAmount": 471.06
}
```

**Response (Invalid Coupon):**
```json
{
  "code": 400,
  "message": "Invalid coupon code"
}
```

**React Native Implementation:**
```javascript
const validateCoupon = async (code, planId, userCategory, orderAmount) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        planId,
        userCategory,
        orderAmount
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating coupon:', error);
    throw error;
  }
};
```

---

## 4. Payment APIs

### 4.1 Create Payment Order
**Endpoint:** `POST /payments/create-order`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_USER_TOKEN'
}
```

**Request Body:**
```json
{
  "planId": "68b81f09ead669d0f5daafe4",
  "couponCode": "WELCOME20"
}
```

**Response:**
```json
{
  "order": {
    "id": "order_1234567890",
    "amount": 47106,
    "currency": "INR",
    "receipt": "RCP_1234567890_abc123",
    "status": "created"
  },
  "transaction": {
    "_id": "68b81f09ead669d0f5daafe4",
    "transactionId": "TXN_1234567890_def456",
    "status": "pending",
    "amount": 471.06,
    "originalAmount": 588.82,
    "discountAmount": 117.76,
    "currency": "INR",
    "razorpayOrderId": "order_1234567890"
  },
  "plan": {
    "_id": "68b81f09ead669d0f5daafe4",
    "name": "Basic Monthly",
    "basePrice": 499,
    "validityDays": 30
  },
  "pricing": {
    "basePrice": 499,
    "taxes": {
      "gst": {
        "rate": 18,
        "type": "percentage",
        "amount": 89.82
      },
      "other": []
    },
    "subtotal": 588.82,
    "discount": {
      "amount": 117.76,
      "couponCode": "WELCOME20"
    },
    "total": 471.06,
    "currency": "INR"
  },
  "discount": {
    "couponCode": "WELCOME20",
    "discountAmount": 117.76,
    "originalAmount": 588.82,
    "finalAmount": 471.06
  }
}
```

**React Native Implementation:**
```javascript
const createPaymentOrder = async (planId, couponCode = null) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_CONFIG.BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        planId,
        couponCode
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};
```

### 4.2 Verify Payment
**Endpoint:** `POST /payments/verify`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_USER_TOKEN'
}
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_1234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified and membership created successfully",
  "membership": {
    "_id": "68b81f09ead669d0f5daafe4",
    "userId": "68b81f09ead669d0f5daafe4",
    "planId": "68b81f09ead669d0f5daafe4",
    "planName": "Basic Monthly",
    "validityDays": 30,
    "startDate": "2025-09-03T10:57:13.905Z",
    "endDate": "2025-10-03T10:57:13.905Z",
    "amountPaid": 471.06,
    "originalAmount": 588.82,
    "discountAmount": 117.76,
    "currency": "INR",
    "couponCode": "68b81f09ead669d0f5daaffb",
    "couponCodeString": "WELCOME20",
    "razorpayOrderId": "order_1234567890",
    "razorpayPaymentId": "pay_1234567890",
    "razorpaySignature": "signature_1234567890",
    "status": "active",
    "autoRenewal": false
  },
  "transaction": {
    "_id": "68b81f09ead669d0f5daafe4",
    "transactionId": "TXN_1234567890_def456",
    "status": "completed",
    "amount": 471.06,
    "razorpayPaymentId": "pay_1234567890",
    "paidAt": "2025-09-03T10:57:13.905Z"
  }
}
```

**Response (Failed):**
```json
{
  "code": 400,
  "message": "Invalid payment signature"
}
```

**React Native Implementation:**
```javascript
const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_CONFIG.BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};
```

---

## 5. User Membership APIs

### 5.1 Get User's Active Membership
**Endpoint:** `GET /payments/memberships/active`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_USER_TOKEN'
}
```

**Response (Active Membership):**
```json
{
  "_id": "68b81f09ead669d0f5daafe4",
  "userId": "68b81f09ead669d0f5daafe4",
  "planId": {
    "_id": "68b81f09ead669d0f5daafe4",
    "name": "Basic Monthly",
    "basePrice": 499,
    "validityDays": 30,
    "features": [
      "Access to basic classes",
      "Community support",
      "Basic tracking features"
    ]
  },
  "planName": "Basic Monthly",
  "validityDays": 30,
  "startDate": "2025-09-03T10:57:13.905Z",
  "endDate": "2025-10-03T10:57:13.905Z",
  "amountPaid": 471.06,
  "originalAmount": 588.82,
  "discountAmount": 117.76,
  "currency": "INR",
  "couponCode": {
    "_id": "68b81f09ead669d0f5daaffb",
    "code": "WELCOME20",
    "name": "Welcome Discount"
  },
  "couponCodeString": "WELCOME20",
  "status": "active",
  "autoRenewal": false,
  "isActive": true,
  "isExpired": false,
  "daysRemaining": 25
}
```

**Response (No Active Membership):**
```json
{
  "code": 404,
  "message": "No active membership found"
}
```

**React Native Implementation:**
```javascript
const getActiveMembership = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_CONFIG.BASE_URL}/payments/memberships/active`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      return null; // No active membership
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching active membership:', error);
    throw error;
  }
};
```

### 5.2 Get User's Membership History
**Endpoint:** `GET /payments/memberships`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_USER_TOKEN'
}
```

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 10)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "results": [
    {
      "_id": "68b81f09ead669d0f5daafe4",
      "userId": "68b81f09ead669d0f5daafe4",
      "planId": {
        "_id": "68b81f09ead669d0f5daafe4",
        "name": "Basic Monthly",
        "basePrice": 499
      },
      "planName": "Basic Monthly",
      "status": "active",
      "startDate": "2025-09-03T10:57:13.905Z",
      "endDate": "2025-10-03T10:57:13.905Z",
      "amountPaid": 471.06,
      "couponCode": {
        "_id": "68b81f09ead669d0f5daaffb",
        "code": "WELCOME20"
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 1
}
```

**React Native Implementation:**
```javascript
const getUserMemberships = async (limit = 10, page = 1) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_CONFIG.BASE_URL}/payments/memberships?limit=${limit}&page=${page}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching memberships:', error);
    throw error;
  }
};
```

### 5.3 Get User's Transaction History
**Endpoint:** `GET /payments/transactions`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_USER_TOKEN'
}
```

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "results": [
    {
      "_id": "68b81f09ead669d0f5daafe4",
      "userId": "68b81f09ead669d0f5daafe4",
      "membershipId": "68b81f09ead669d0f5daafe4",
      "transactionId": "TXN_1234567890_def456",
      "orderId": "RCP_1234567890_abc123",
      "amount": 471.06,
      "currency": "INR",
      "razorpayOrderId": "order_1234567890",
      "razorpayPaymentId": "pay_1234567890",
      "status": "completed",
      "paymentMethod": "razorpay",
      "couponCode": {
        "_id": "68b81f09ead669d0f5daaffb",
        "code": "WELCOME20"
      },
      "discountAmount": 117.76,
      "originalAmount": 588.82,
      "planId": {
        "_id": "68b81f09ead669d0f5daafe4",
        "name": "Basic Monthly"
      },
      "planName": "Basic Monthly",
      "paidAt": "2025-09-03T10:57:13.905Z",
      "createdAt": "2025-09-03T10:57:13.905Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "totalResults": 1
}
```

**React Native Implementation:**
```javascript
const getUserTransactions = async (limit = 20, page = 1) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_CONFIG.BASE_URL}/payments/transactions?limit=${limit}&page=${page}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};
```

---

## 6. Razorpay Integration

### 6.1 Install Razorpay Package
```bash
npm install react-native-razorpay
```

### 6.2 Payment Flow Implementation
```javascript
import RazorpayCheckout from 'react-native-razorpay';

const initiatePayment = async (planId, couponCode = null) => {
  try {
    // Step 1: Create payment order
    const orderData = await createPaymentOrder(planId, couponCode);
    
    // Step 2: Initialize Razorpay
    const options = {
      description: orderData.plan.name,
      image: 'https://your-logo-url.com/logo.png',
      currency: orderData.order.currency,
      key: API_CONFIG.RAZORPAY_KEY_ID,
      amount: orderData.order.amount, // Amount in paise
      name: 'Samsara Wellness',
      order_id: orderData.order.id,
      prefill: {
        email: 'user@example.com', // Get from user profile
        contact: '9999999999', // Get from user profile
        name: 'User Name', // Get from user profile
      },
      theme: { color: '#3498db' },
    };

    // Step 3: Open Razorpay checkout
    RazorpayCheckout.open(options)
      .then(async (data) => {
        // Step 4: Verify payment
        const verificationResult = await verifyPayment(
          orderData.order.id,
          data.razorpay_payment_id,
          data.razorpay_signature
        );
        
        if (verificationResult.success) {
          // Payment successful
          console.log('Payment successful:', verificationResult.membership);
          return verificationResult;
        }
      })
      .catch((error) => {
        console.log('Payment failed:', error);
        throw new Error('Payment was cancelled or failed');
      });
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};
```

---

## 7. Complete API Service Class

```javascript
// src/services/MembershipApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class MembershipApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/v1'; // Change to your server URL
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async makeRequest(endpoint, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const config = {
      headers: { ...headers, ...options.headers },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    return await response.json();
  }

  // Membership Plans
  async getActivePlans() {
    const data = await this.makeRequest('/membership-plans/active');
    return data.results;
  }

  async getPlanPricing(planId, couponCode = null) {
    const endpoint = couponCode 
      ? `/membership-plans/${planId}/pricing?couponCode=${couponCode}`
      : `/membership-plans/${planId}/pricing`;
    return this.makeRequest(endpoint);
  }

  // Coupons
  async getActiveCoupons() {
    const data = await this.makeRequest('/coupons/active');
    return data.results;
  }

  async validateCoupon(code, planId, userCategory, orderAmount) {
    return this.makeRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, planId, userCategory, orderAmount }),
    });
  }

  // Payments
  async createPaymentOrder(planId, couponCode = null) {
    return this.makeRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId, couponCode }),
    });
  }

  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    return this.makeRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    });
  }

  // User Memberships
  async getActiveMembership() {
    try {
      return await this.makeRequest('/payments/memberships/active');
    } catch (error) {
      if (error.message.includes('404')) {
        return null; // No active membership
      }
      throw error;
    }
  }

  async getUserMemberships(limit = 10, page = 1) {
    const data = await this.makeRequest(`/payments/memberships?limit=${limit}&page=${page}`);
    return data;
  }

  async getUserTransactions(limit = 20, page = 1) {
    const data = await this.makeRequest(`/payments/transactions?limit=${limit}&page=${page}`);
    return data;
  }
}

export default new MembershipApiService();
```

---

## 8. Error Handling

### Common Error Responses
```json
// Authentication Error
{
  "code": 401,
  "message": "Please authenticate"
}

// Not Found Error
{
  "code": 404,
  "message": "Membership plan not found"
}

// Validation Error
{
  "code": 400,
  "message": "Invalid coupon code"
}

// Server Error
{
  "code": 500,
  "message": "Internal server error"
}
```

### Error Handling in React Native
```javascript
const handleApiError = (error) => {
  if (error.message.includes('401')) {
    // Redirect to login
    navigation.navigate('Login');
  } else if (error.message.includes('404')) {
    Alert.alert('Not Found', 'The requested resource was not found');
  } else if (error.message.includes('400')) {
    Alert.alert('Invalid Request', error.message);
  } else {
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
};
```

---

## 9. Testing Checklist

### ✅ API Endpoints Tested
- [ ] Get active membership plans
- [ ] Get plan pricing breakdown
- [ ] Validate coupon codes
- [ ] Create payment orders
- [ ] Verify payments
- [ ] Get user's active membership
- [ ] Get user's membership history
- [ ] Get user's transaction history

### ✅ Error Scenarios Tested
- [ ] Invalid authentication token
- [ ] Invalid plan ID
- [ ] Invalid coupon code
- [ ] Payment verification failure
- [ ] Network connectivity issues

### ✅ Razorpay Integration Tested
- [ ] Payment initiation
- [ ] Payment success flow
- [ ] Payment failure flow
- [ ] Payment cancellation

---

## 10. Production Checklist

### ✅ Environment Configuration
- [ ] Update API base URL for production
- [ ] Use Razorpay live keys
- [ ] Configure proper error logging
- [ ] Set up monitoring and analytics

### ✅ Security
- [ ] Store authentication tokens securely
- [ ] Validate all API responses
- [ ] Handle sensitive data properly
- [ ] Implement proper error boundaries

This comprehensive guide provides everything you need to integrate the membership system with your Expo React Native app! 🚀
