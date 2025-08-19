# Frontend API Migration Guide: Period Tracker → Period Cycles

## Current Issue
Your frontend is calling the old `/period-tracker/*` endpoints, but these are incompatible with the new `PeriodCycle` model, causing 500 errors.

## Migration Required

### Old Endpoints → New Endpoints

| Old Endpoint | New Endpoint | Changes |
|--------------|--------------|---------|
| `GET /period-tracker/calendar` | `GET /period-cycles/current` + `GET /period-cycles/predictions` | Split into current cycle + predictions |
| `POST /period-tracker/period/start` | `POST /period-cycles/start` | No body required |
| `POST /period-tracker/period/stop` | `PUT /period-cycles/:cycleId/complete` | Requires cycle ID |
| `PUT /period-tracker/logs/:date` | `POST /period-cycles/:cycleId/daily-log` | Requires cycle ID + different body format |
| `GET /period-tracker/current` | `GET /period-cycles/current` | Same response structure |
| `GET /period-tracker/history` | `GET /period-cycles/history` | Same response structure |

## Immediate Fix for Your Current Error

Replace this call:
```javascript
// OLD - This is failing
const response = await fetch('/period-tracker/period/start', {
  method: 'POST',
  body: JSON.stringify({ date: "2025-08-19T11:39:06.231Z" })
});
```

With this:
```javascript
// NEW - This will work
const response = await fetch('/period-cycles/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
  // No body needed - system uses current date
});
```

## Complete Migration Steps

### 1. Update API Base URLs
```javascript
// OLD
const API_BASE = '/period-tracker';

// NEW  
const API_BASE = '/period-cycles';
```

### 2. Update Calendar Function
```javascript
// OLD
const getCalendar = async (month) => {
  const response = await fetch(`${API_BASE}/calendar?month=${month}`);
  return response.json();
};

// NEW
const getCalendar = async (month) => {
  const [currentResponse, predictionsResponse] = await Promise.all([
    fetch(`${API_BASE}/current`),
    fetch(`${API_BASE}/predictions`)
  ]);
  
  const current = await currentResponse.json();
  const predictions = await predictionsResponse.json();
  
  // Combine data for calendar view
  return {
    currentCycle: current.data.cycle,
    predictions: predictions.data.predictions,
    // Build calendar days from these
  };
};
```

### 3. Update Start Period Function
```javascript
// OLD
const startPeriod = async (date) => {
  const response = await fetch(`${API_BASE}/period/start`, {
    method: 'POST',
    body: JSON.stringify({ date })
  });
  return response.json();
};

// NEW
const startPeriod = async () => {
  const response = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 4. Update Daily Log Function
```javascript
// OLD
const updateLog = async (date, logData) => {
  const response = await fetch(`${API_BASE}/logs/${date}`, {
    method: 'PUT',
    body: JSON.stringify(logData)
  });
  return response.json();
};

// NEW
const updateLog = async (cycleId, logData) => {
  const response = await fetch(`${API_BASE}/${cycleId}/daily-log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData)
  });
  return response.json();
};
```

### 5. Update Stop Period Function
```javascript
// OLD
const stopPeriod = async (date) => {
  const response = await fetch(`${API_BASE}/period/stop`, {
    method: 'POST',
    body: JSON.stringify({ date })
  });
  return response.json();
};

// NEW
const stopPeriod = async (cycleId) => {
  const response = await fetch(`${API_BASE}/${cycleId}/complete`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Quick Fix Implementation

Here's the minimal change to fix your current error:

```javascript
// Replace this function
const startPeriod = async (date) => {
  try {
    // OLD - Remove this
    // const response = await fetch('/period-tracker/period/start', {
    //   method: 'POST',
    //   body: JSON.stringify({ date })
    // });
    
    // NEW - Use this instead
    const response = await fetch('/period-cycles/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Error starting period:', error);
    throw error;
  }
};
```

## Why This Happened

1. **Model Mismatch**: Old system expected simple fields, new system requires `cycleNumber`
2. **Missing Required Fields**: New `PeriodCycle` model has stricter validation
3. **Different API Structure**: New system is more robust with better error handling

## Benefits of New System

- ✅ **Better Predictions**: Uses machine learning from cycle history
- ✅ **Auto-completion**: Automatically detects when period ends
- ✅ **Comprehensive Tracking**: More detailed symptom logging
- ✅ **Analytics**: Better insights and regularity analysis
- ✅ **Scalability**: Separate documents per cycle for better performance

## Testing the Fix

After updating your API calls:

1. **Test start period**: Should create new cycle successfully
2. **Test daily logging**: Should update symptoms without errors  
3. **Test predictions**: Should get accurate cycle predictions
4. **Test analytics**: Should see cycle history and insights

The new system will automatically handle cycle numbering, predictions, and phase detection, making your app more intelligent and reliable.
