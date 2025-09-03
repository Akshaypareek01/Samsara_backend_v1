# Enhanced Pricing Structure with Taxes and Discounts

## Overview

The membership system now includes comprehensive pricing with:
- **Base Price**: The core plan price
- **GST**: 18% GST (configurable)
- **Other Taxes**: Additional taxes (if any)
- **Discounts**: Coupon-based discounts with plan-specific limits
- **Final Amount**: Total amount after taxes and discounts

## Example Plan Structure

### Basic Monthly Plan
```json
{
  "name": "Basic Monthly",
  "basePrice": 499,
  "currency": "INR",
  "taxConfig": {
    "gst": {
      "rate": 18,
      "type": "percentage"
    },
    "otherTaxes": []
  },
  "discountConfig": {
    "maxDiscountPercentage": 50,
    "maxDiscountAmount": 200
  }
}
```

### Pricing Calculation Example

**Base Price**: ₹499
**GST (18%)**: ₹89.82
**Subtotal**: ₹588.82
**Discount (WELCOME20 - 20%)**: ₹117.76
**Final Amount**: ₹471.06

## API Endpoints

### 1. Get Plan with Pricing Breakdown

```bash
GET /api/v1/membership-plans/{planId}/pricing?couponCode=WELCOME20
```

**Response:**
```json
{
  "plan": {
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

### 2. Create Payment Order with Pricing

```bash
POST /api/v1/payments/create-order
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
    "amount": 47106, // Amount in paise
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
  "discount": {
    "couponCode": "WELCOME20",
    "discountAmount": 117.76,
    "originalAmount": 588.82,
    "finalAmount": 471.06
  }
}
```

## Tax Configuration Options

### 1. GST Configuration
```json
{
  "gst": {
    "rate": 18, // 18% GST
    "type": "percentage" // or "fixed"
  }
}
```

### 2. Other Taxes
```json
{
  "otherTaxes": [
    {
      "name": "Service Tax",
      "rate": 5,
      "type": "percentage"
    },
    {
      "name": "Processing Fee",
      "rate": 0,
      "type": "fixed",
      "amount": 10
    }
  ]
}
```

## Discount Configuration

### 1. Plan-Level Discount Limits
```json
{
  "discountConfig": {
    "maxDiscountPercentage": 50, // Max 50% discount
    "maxDiscountAmount": 200 // Max ₹200 discount
  }
}
```

### 2. Coupon Discount Calculation
- Coupon calculates discount on subtotal (base price + taxes)
- Plan-level limits are applied to final discount amount
- Final amount = subtotal - discount

## Frontend Implementation

### 1. Display Pricing Breakdown
```jsx
const PricingBreakdown = ({ pricing }) => {
  return (
    <div className="pricing-breakdown">
      <div className="price-item">
        <span>Base Price:</span>
        <span>₹{pricing.basePrice}</span>
      </div>
      
      <div className="price-item">
        <span>GST ({pricing.taxes.gst.rate}%):</span>
        <span>₹{pricing.taxes.gst.amount}</span>
      </div>
      
      {pricing.taxes.other.map(tax => (
        <div className="price-item" key={tax.name}>
          <span>{tax.name} ({tax.rate}%):</span>
          <span>₹{tax.amount}</span>
        </div>
      ))}
      
      <div className="price-item subtotal">
        <span>Subtotal:</span>
        <span>₹{pricing.subtotal}</span>
      </div>
      
      {pricing.discount.amount > 0 && (
        <div className="price-item discount">
          <span>Discount ({pricing.discount.couponCode}):</span>
          <span>-₹{pricing.discount.amount}</span>
        </div>
      )}
      
      <div className="price-item total">
        <span>Total:</span>
        <span>₹{pricing.total}</span>
      </div>
    </div>
  );
};
```

### 2. Coupon Application
```javascript
const applyCoupon = async (planId, couponCode) => {
  const response = await fetch(`/api/v1/membership-plans/${planId}/pricing?couponCode=${couponCode}`);
  const data = await response.json();
  
  if (data.pricing.discount.amount > 0) {
    setPricingBreakdown(data.pricing);
    setCouponApplied(true);
  } else {
    setCouponError('Invalid or expired coupon code');
  }
};
```

## Benefits

1. **Transparency**: Users see exactly what they're paying for
2. **Compliance**: Proper GST and tax handling
3. **Flexibility**: Configurable tax rates and discount limits
4. **Accuracy**: Precise calculations with proper rounding
5. **User Experience**: Clear pricing breakdown before payment

## Use Cases

1. **E-commerce**: Standard pricing with taxes
2. **SaaS**: Subscription pricing with regional taxes
3. **Marketplace**: Commission-based pricing
4. **B2B**: Corporate pricing with custom tax rates
5. **International**: Multi-currency with local tax compliance
