# Hydration Status API Documentation

## Overview

The Hydration Status API provides real-time hydration status calculation based on current water intake versus daily target. This API automatically calculates and updates the hydration status based on three predefined ranges.

## Endpoint

**GET** `/v1/trackers/water/hydration-status`

## Authentication

Requires JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Description

This endpoint calculates the current hydration status by comparing the user's water intake for today against their daily target. The status is automatically updated based on the following ranges:

### Status Ranges

| Range | Status | Description |
|-------|--------|-------------|
| 0-74% | **Dehydrated** | Need to drink more water |
| 75-99% | **Mildly dehydrated** | Almost there, keep drinking |
| 100%+ | **Hydrated** | Target achieved! |

### Automatic Features

1. **Auto-creation**: If no water tracker exists for today, one is automatically created with default targets (2000ml, 8 glasses)
2. **Status Update**: The hydration status is automatically recalculated and updated in the database
3. **Real-time Calculation**: Status is calculated based on current intake timeline

## Response Format

### Success Response (200 OK)

```json
{
  "currentIntake": 250,
  "targetMl": 2000,
  "targetGlasses": 8,
  "percentage": 12.5,
  "status": "Dehydrated",
  "remainingMl": 1750,
  "remainingGlasses": 7,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "4:54 PM"
    }
  ],
  "date": "2025-07-17T00:00:00.000Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `currentIntake` | number | Total water intake in ml for today |
| `targetMl` | number | Daily target in ml |
| `targetGlasses` | number | Daily target in glasses |
| `percentage` | number | Percentage of target achieved (rounded to 2 decimal places) |
| `status` | string | Current hydration status ("Dehydrated", "Mildly dehydrated", "Hydrated") |
| `remainingMl` | number | Remaining ml needed to reach target |
| `remainingGlasses` | number | Remaining glasses needed (calculated as remainingMl ÷ 250ml) |
| `intakeTimeline` | array | Array of water intake events for today |
| `date` | string | Date of the tracker entry |

### Intake Timeline Structure

Each entry in `intakeTimeline` contains:
```json
{
  "amountMl": 250,
  "time": "4:54 PM"
}
```

## Examples

### Example 1: Dehydrated Status

**Scenario**: User has consumed 500ml out of 2000ml target (25%)

**Response:**
```json
{
  "currentIntake": 500,
  "targetMl": 2000,
  "targetGlasses": 8,
  "percentage": 25.0,
  "status": "Dehydrated",
  "remainingMl": 1500,
  "remainingGlasses": 6,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "9:00 AM"
    },
    {
      "amountMl": 250,
      "time": "12:00 PM"
    }
  ],
  "date": "2025-07-17T00:00:00.000Z"
}
```

### Example 2: Mildly Dehydrated Status

**Scenario**: User has consumed 1800ml out of 2000ml target (90%)

**Response:**
```json
{
  "currentIntake": 1800,
  "targetMl": 2000,
  "targetGlasses": 8,
  "percentage": 90.0,
  "status": "Mildly dehydrated",
  "remainingMl": 200,
  "remainingGlasses": 1,
  "intakeTimeline": [
    {
      "amountMl": 500,
      "time": "8:00 AM"
    },
    {
      "amountMl": 500,
      "time": "11:00 AM"
    },
    {
      "amountMl": 500,
      "time": "2:00 PM"
    },
    {
      "amountMl": 300,
      "time": "5:00 PM"
    }
  ],
  "date": "2025-07-17T00:00:00.000Z"
}
```

### Example 3: Hydrated Status

**Scenario**: User has consumed 2200ml out of 2000ml target (110%)

**Response:**
```json
{
  "currentIntake": 2200,
  "targetMl": 2000,
  "targetGlasses": 8,
  "percentage": 110.0,
  "status": "Hydrated",
  "remainingMl": 0,
  "remainingGlasses": 0,
  "intakeTimeline": [
    {
      "amountMl": 500,
      "time": "8:00 AM"
    },
    {
      "amountMl": 500,
      "time": "11:00 AM"
    },
    {
      "amountMl": 500,
      "time": "2:00 PM"
    },
    {
      "amountMl": 500,
      "time": "5:00 PM"
    },
    {
      "amountMl": 200,
      "time": "8:00 PM"
    }
  ],
  "date": "2025-07-17T00:00:00.000Z"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Internal server error"
}
```

## Integration with Other APIs

This API works seamlessly with other water tracker endpoints:

1. **Add Water Intake** (`POST /v1/trackers/water`) - Updates intake and recalculates status
2. **Update Water Target** (`PUT /v1/trackers/water/target`) - Updates target and recalculates status
3. **Get Today's Water Data** (`GET /v1/trackers/water/today`) - Returns full tracker data including status

## Usage in Frontend

### React/JavaScript Example

```javascript
const getHydrationStatus = async () => {
  try {
    const response = await fetch('/v1/trackers/water/hydration-status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Update UI based on status
    switch(data.status) {
      case 'Hydrated':
        setStatusColor('green');
        setStatusMessage('Great job! You\'re hydrated!');
        break;
      case 'Mildly dehydrated':
        setStatusColor('orange');
        setStatusMessage(`Almost there! Drink ${data.remainingGlasses} more glass(es)`);
        break;
      case 'Dehydrated':
        setStatusColor('red');
        setStatusMessage(`Need to drink ${data.remainingGlasses} more glass(es)`);
        break;
    }
    
    setProgressPercentage(data.percentage);
    setRemainingMl(data.remainingMl);
    
  } catch (error) {
    console.error('Error fetching hydration status:', error);
  }
};
```

### Postman Collection

Add this request to your Postman collection:

```json
{
  "name": "Get Hydration Status",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{jwt_token}}",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{base_url}}/v1/trackers/water/hydration-status",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water", "hydration-status"]
    }
  }
}
```

## Best Practices

1. **Call this API after adding water intake** to get updated status
2. **Use the percentage field** for progress bars and visual indicators
3. **Display remaining glasses** to give users actionable feedback
4. **Update status in real-time** when users add water intake
5. **Use status colors** to provide visual feedback (red for dehydrated, orange for mildly dehydrated, green for hydrated)

## Notes

- The API automatically creates a water tracker for today if none exists
- Status is calculated and updated in real-time
- Remaining glasses calculation assumes 250ml per glass
- Percentage is rounded to 2 decimal places for display purposes
- The API is idempotent - calling it multiple times won't cause issues 