# Period Cycle System - API Documentation

## Overview

The Period Cycle System provides comprehensive menstrual cycle tracking with intelligent predictions, daily symptom logging, and analytics. This document covers all API endpoints, request/response formats, and integration examples.

## Base URL
```
https://your-domain.com/api/v1/period-cycles
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Start New Period Cycle

**Endpoint:** `POST /api/v1/period-cycles/start`

**Description:** Starts a new period cycle when user begins their period.

**Request Body:** None required

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "cycleNumber": 3,
      "cycleStartDate": "2024-01-15T00:00:00.000Z",
      "cycleStatus": "Active",
      "currentPhase": "Menstruation",
      "predictedNextPeriodDate": "2024-02-12T00:00:00.000Z",
      "predictedOvulationDate": "2024-01-29T00:00:00.000Z",
      "predictedFertileWindowStart": "2024-01-24T00:00:00.000Z",
      "predictedFertileWindowEnd": "2024-01-30T00:00:00.000Z",
      "periodDurationDays": 5,
      "cycleLengthDays": 28,
      "dailyLogs": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "New period cycle started successfully"
}
```

**Frontend Integration:**
```javascript
// Start new cycle when user marks period start
const startNewCycle = async () => {
  try {
    const response = await fetch('/api/v1/period-cycles/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      // Update UI with new cycle data
      setCurrentCycle(data.data.cycle);
      // Navigate to cycle tracking view
    }
  } catch (error) {
    console.error('Error starting cycle:', error);
  }
};
```

---

### 2. Get Current Active Cycle

**Endpoint:** `GET /api/v1/period-cycles/current`

**Description:** Retrieves the user's currently active period cycle.

**Request Body:** None

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "cycleNumber": 3,
      "cycleStartDate": "2024-01-15T00:00:00.000Z",
      "cycleStatus": "Active",
      "currentPhase": "Menstruation",
      "predictedNextPeriodDate": "2024-02-12T00:00:00.000Z",
      "predictedOvulationDate": "2024-01-29T00:00:00.000Z",
      "predictedFertileWindowStart": "2024-01-24T00:00:00.000Z",
      "predictedFertileWindowEnd": "2024-01-30T00:00:00.000Z",
      "periodDurationDays": 5,
      "cycleLengthDays": 28,
      "dailyLogs": [
        {
          "date": "2024-01-15T00:00:00.000Z",
          "flowIntensity": 3,
          "crampingIntensity": "Moderate",
          "painLevel": 6,
          "symptoms": ["bloating", "fatigue"],
          "notes": "Heavy flow today"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**No Active Cycle Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": null
  },
  "message": "No active cycle found"
}
```

**Frontend Integration:**
```javascript
// Get current cycle on app load
const getCurrentCycle = async () => {
  try {
    const response = await fetch('/api/v1/period-cycles/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      if (data.data.cycle) {
        setCurrentCycle(data.data.cycle);
        setHasActiveCycle(true);
      } else {
        setHasActiveCycle(false);
        // Show "Start New Cycle" button
      }
    }
  } catch (error) {
    console.error('Error fetching current cycle:', error);
  }
};
```

---

### 3. Get Cycle History

**Endpoint:** `GET /api/v1/period-cycles/history?limit=6`

**Description:** Retrieves user's cycle history for analytics and predictions.

**Query Parameters:**
- `limit` (optional): Number of cycles to return (default: 6, max: 12)

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycles": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "cycleNumber": 3,
        "cycleStartDate": "2024-01-15T00:00:00.000Z",
        "cycleEndDate": "2024-01-20T00:00:00.000Z",
        "cycleStatus": "Completed",
        "cycleLengthDays": 28,
        "periodDurationDays": 5,
        "predictionAccuracy": 85,
        "regularity": "Regular"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "cycleNumber": 2,
        "cycleStartDate": "2023-12-18T00:00:00.000Z",
        "cycleEndDate": "2023-12-23T00:00:00.000Z",
        "cycleStatus": "Completed",
        "cycleLengthDays": 30,
        "periodDurationDays": 5,
        "predictionAccuracy": 90,
        "regularity": "Regular"
      }
    ],
    "total": 2
  }
}
```

**Frontend Integration:**
```javascript
// Get cycle history for charts/analytics
const getCycleHistory = async (limit = 6) => {
  try {
    const response = await fetch(`/api/v1/period-cycles/history?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      setCycleHistory(data.data.cycles);
      // Use for charts, analytics, etc.
    }
  } catch (error) {
    console.error('Error fetching cycle history:', error);
  }
};
```

---

### 4. Get Cycle Predictions

**Endpoint:** `GET /api/v1/period-cycles/predictions`

**Description:** Retrieves upcoming cycle predictions including next period, ovulation, and fertile window.

**Request Body:** None

**Response:**
```json
{
  "status": "success",
  "data": {
    "predictions": {
      "predictedNextPeriodDate": "2024-02-12T00:00:00.000Z",
      "predictedOvulationDate": "2024-01-29T00:00:00.000Z",
      "predictedFertileWindowStart": "2024-01-24T00:00:00.000Z",
      "predictedFertileWindowEnd": "2024-01-30T00:00:00.000Z",
      "currentPhase": "Menstruation"
    }
  }
}
```

**Frontend Integration:**
```javascript
// Get predictions for calendar view
const getPredictions = async () => {
  try {
    const response = await fetch('/api/v1/period-cycles/predictions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      setPredictions(data.data.predictions);
      // Update calendar with predicted dates
      updateCalendarPredictions(data.data.predictions);
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
  }
};
```

---

### 5. Get Cycle Analytics

**Endpoint:** `GET /api/v1/period-cycles/analytics`

**Description:** Retrieves comprehensive cycle analytics and insights.

**Request Body:** None

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "totalCycles": 5,
      "averageCycleLength": 29,
      "averagePeriodDuration": 5,
      "shortestCycle": 26,
      "longestCycle": 32,
      "regularity": "Regular",
      "predictionAccuracy": 87
    }
  }
}
```

**Frontend Integration:**
```javascript
// Get analytics for dashboard
const getAnalytics = async () => {
  try {
    const response = await fetch('/api/v1/period-cycles/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      setAnalytics(data.data.analytics);
      // Update dashboard charts and metrics
      updateDashboardMetrics(data.data.analytics);
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
};
```

---

### 6. Get Specific Cycle by ID

**Endpoint:** `GET /api/v1/period-cycles/:cycleId`

**Description:** Retrieves a specific cycle by its ID.

**URL Parameters:**
- `cycleId`: MongoDB ObjectId of the cycle

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "cycleNumber": 3,
      "cycleStartDate": "2024-01-15T00:00:00.000Z",
      "cycleEndDate": "2024-01-20T00:00:00.000Z",
      "cycleStatus": "Completed",
      "currentPhase": "Menstruation",
      "cycleLengthDays": 28,
      "periodDurationDays": 5,
      "predictionAccuracy": 85,
      "regularity": "Regular",
      "dailyLogs": [
        {
          "date": "2024-01-15T00:00:00.000Z",
          "flowIntensity": 3,
          "crampingIntensity": "Moderate",
          "painLevel": 6,
          "symptoms": ["bloating", "fatigue"],
          "notes": "Heavy flow today"
        }
      ],
      "cycleNotes": "This was a relatively normal cycle",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Frontend Integration:**
```javascript
// Get specific cycle details
const getCycleById = async (cycleId) => {
  try {
    const response = await fetch(`/api/v1/period-cycles/${cycleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      setSelectedCycle(data.data.cycle);
      // Show cycle details modal/page
    }
  } catch (error) {
    console.error('Error fetching cycle:', error);
  }
};
```

---

### 7. Add/Update Daily Log

**Endpoint:** `POST /api/v1/period-cycles/:cycleId/daily-log`

**Description:** Adds or updates a daily log entry for tracking symptoms, flow, and other data.

**URL Parameters:**
- `cycleId`: MongoDB ObjectId of the cycle

**Request Body:**
```json
{
  "date": "2024-01-15",
  "flowIntensity": 3,
  "crampingIntensity": "Moderate",
  "painLevel": 6,
  "energyPattern": "Low",
  "restNeeded": true,
  "symptoms": ["bloating", "fatigue", "mood swings"],
  "cravings": ["chocolate", "salty foods"],
  "medicationTaken": true,
  "supplementTaken": false,
  "exercise": {
    "type": "walking",
    "minutes": 30,
    "intensity": "light"
  },
  "discharge": {
    "type": "normal",
    "color": "clear",
    "consistency": "watery",
    "amount": "moderate",
    "notableChanges": ["increased amount"]
  },
  "sexualActivity": {
    "hadSex": false,
    "protected": null
  },
  "pregnancyTest": {
    "taken": false,
    "result": null
  },
  "notes": "Feeling better today, flow is lighter"
}
```

**Field Descriptions:**
- `flowIntensity`: 0-5 scale (0 = no flow, 5 = very heavy)
- `crampingIntensity`: None, Mild, Moderate, Strong, Severe
- `painLevel`: 0-10 scale (0 = no pain, 10 = worst pain)
- `energyPattern`: Low, Low-Mid, Moderate, Mid-High, High
- `symptoms`: Array of symptom strings
- `cravings`: Array of food craving strings
- `exercise`: Object with type, minutes, intensity
- `discharge`: Object with type, color, consistency, amount, notableChanges
- `sexualActivity`: Object with hadSex (boolean) and protected (boolean)
- `pregnancyTest`: Object with taken (boolean) and result (Positive/Negative/Unknown)

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "dailyLogs": [
        {
          "date": "2024-01-15T00:00:00.000Z",
          "flowIntensity": 3,
          "crampingIntensity": "Moderate",
          "painLevel": 6,
          "energyPattern": "Low",
          "restNeeded": true,
          "symptoms": ["bloating", "fatigue", "mood swings"],
          "cravings": ["chocolate", "salty foods"],
          "medicationTaken": true,
          "supplementTaken": false,
          "exercise": {
            "type": "walking",
            "minutes": 30,
            "intensity": "light"
          },
          "discharge": {
            "type": "normal",
            "color": "clear",
            "consistency": "watery",
            "amount": "moderate",
            "notableChanges": ["increased amount"]
          },
          "sexualActivity": {
            "hadSex": false,
            "protected": null
          },
          "pregnancyTest": {
            "taken": false,
            "result": null
          },
          "notes": "Feeling better today, flow is lighter"
        }
      ],
      "currentPhase": "Menstruation"
    }
  },
  "message": "Daily log updated successfully"
}
```

**Frontend Integration:**
```javascript
// Add/update daily log
const updateDailyLog = async (cycleId, logData) => {
  try {
    const response = await fetch(`/api/v1/period-cycles/${cycleId}/daily-log`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      // Update local state
      setCurrentCycle(data.data.cycle);
      // Show success message
      showNotification('Daily log updated successfully', 'success');
    }
  } catch (error) {
    console.error('Error updating daily log:', error);
    showNotification('Error updating daily log', 'error');
  }
};

// Example usage
const logData = {
  date: new Date().toISOString().split('T')[0],
  flowIntensity: 2,
  crampingIntensity: 'Mild',
  painLevel: 3,
  symptoms: ['slight bloating'],
  notes: 'Much better today'
};

updateDailyLog(currentCycle._id, logData);
```

---

### 8. Complete Cycle

**Endpoint:** `PUT /api/v1/period-cycles/:cycleId/complete`

**Description:** Manually completes an active cycle when the period ends.

**URL Parameters:**
- `cycleId`: MongoDB ObjectId of the cycle

**Request Body:** None

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "cycleStatus": "Completed",
      "cycleEndDate": "2024-01-20T00:00:00.000Z",
      "cycleLengthDays": 28,
      "predictionAccuracy": 85,
      "regularity": "Regular"
    }
  },
  "message": "Cycle completed successfully"
}
```

**Frontend Integration:**
```javascript
// Complete cycle manually
const completeCycle = async (cycleId) => {
  try {
    const response = await fetch(`/api/v1/period-cycles/${cycleId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      // Update local state
      setCurrentCycle(null);
      setHasActiveCycle(false);
      // Show completion message
      showNotification('Cycle completed successfully', 'success');
      // Refresh cycle history
      getCycleHistory();
    }
  } catch (error) {
    console.error('Error completing cycle:', error);
    showNotification('Error completing cycle', 'error');
  }
};
```

---

### 9. Update Cycle Notes

**Endpoint:** `PUT /api/v1/period-cycles/:cycleId/notes`

**Description:** Updates general notes for a specific cycle.

**URL Parameters:**
- `cycleId`: MongoDB ObjectId of the cycle

**Request Body:**
```json
{
  "cycleNotes": "This cycle was particularly challenging due to stress at work. Flow was heavier than usual and lasted longer."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "cycleNotes": "This cycle was particularly challenging due to stress at work. Flow was heavier than usual and lasted longer."
    }
  },
  "message": "Cycle notes updated successfully"
}
```

**Frontend Integration:**
```javascript
// Update cycle notes
const updateCycleNotes = async (cycleId, notes) => {
  try {
    const response = await fetch(`/api/v1/period-cycles/${cycleId}/notes`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cycleNotes: notes })
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      // Update local state
      setCurrentCycle(prev => ({ ...prev, cycleNotes: notes }));
      showNotification('Notes updated successfully', 'success');
    }
  } catch (error) {
    console.error('Error updating notes:', error);
    showNotification('Error updating notes', 'error');
  }
};
```

---

### 10. Delete Cycle

**Endpoint:** `DELETE /api/v1/period-cycles/:cycleId`

**Description:** Deletes a specific cycle (use with caution).

**URL Parameters:**
- `cycleId`: MongoDB ObjectId of the cycle

**Request Body:** None

**Response:**
```json
{
  "status": "success",
  "message": "Cycle deleted successfully"
}
```

**Frontend Integration:**
```javascript
// Delete cycle
const deleteCycle = async (cycleId) => {
  if (!confirm('Are you sure you want to delete this cycle? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/v1/period-cycles/${cycleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      // Remove from local state
      setCycleHistory(prev => prev.filter(c => c._id !== cycleId));
      showNotification('Cycle deleted successfully', 'success');
    }
  } catch (error) {
    console.error('Error deleting cycle:', error);
    showNotification('Error deleting cycle', 'error');
  }
};
```

---

## Complete Frontend Integration Example

Here's a complete React component example showing how to integrate all the APIs:

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const PeriodCycleTracker = () => {
  const { token } = useAuth();
  const [currentCycle, setCurrentCycle] = useState(null);
  const [cycleHistory, setCycleHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeTracker();
  }, []);

  const initializeTracker = async () => {
    try {
      setLoading(true);
      await Promise.all([
        getCurrentCycle(),
        getCycleHistory(),
        getPredictions(),
        getAnalytics()
      ]);
    } catch (error) {
      console.error('Error initializing tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCycle = async () => {
    const response = await fetch('/api/v1/period-cycles/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.status === 'success') {
      setCurrentCycle(data.data.cycle);
    }
  };

  const getCycleHistory = async () => {
    const response = await fetch('/api/v1/period-cycles/history?limit=6', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.status === 'success') {
      setCycleHistory(data.data.cycles);
    }
  };

  const getPredictions = async () => {
    const response = await fetch('/api/v1/period-cycles/predictions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.status === 'success') {
      setPredictions(data.data.predictions);
    }
  };

  const getAnalytics = async () => {
    const response = await fetch('/api/v1/period-cycles/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.status === 'success') {
      setAnalytics(data.data.analytics);
    }
  };

  const startNewCycle = async () => {
    try {
      const response = await fetch('/api/v1/period-cycles/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentCycle(data.data.cycle);
        showNotification('New cycle started!', 'success');
      }
    } catch (error) {
      console.error('Error starting cycle:', error);
      showNotification('Error starting cycle', 'error');
    }
  };

  const updateDailyLog = async (logData) => {
    if (!currentCycle) return;
    
    try {
      const response = await fetch(`/api/v1/period-cycles/${currentCycle._id}/daily-log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentCycle(data.data.cycle);
        showNotification('Daily log updated!', 'success');
      }
    } catch (error) {
      console.error('Error updating log:', error);
      showNotification('Error updating log', 'error');
    }
  };

  const completeCycle = async () => {
    if (!currentCycle) return;
    
    try {
      const response = await fetch(`/api/v1/period-cycles/${currentCycle._id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentCycle(null);
        showNotification('Cycle completed!', 'success');
        // Refresh data
        getCycleHistory();
        getAnalytics();
      }
    } catch (error) {
      console.error('Error completing cycle:', error);
      showNotification('Error completing cycle', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="period-cycle-tracker">
      {/* Current Cycle Status */}
      {currentCycle ? (
        <div className="current-cycle">
          <h2>Current Cycle #{currentCycle.cycleNumber}</h2>
          <p>Started: {new Date(currentCycle.cycleStartDate).toLocaleDateString()}</p>
          <p>Phase: {currentCycle.currentPhase}</p>
          <button onClick={completeCycle}>Complete Cycle</button>
        </div>
      ) : (
        <div className="no-active-cycle">
          <h2>No Active Cycle</h2>
          <button onClick={startNewCycle}>Start New Cycle</button>
        </div>
      )}

      {/* Predictions */}
      {predictions && (
        <div className="predictions">
          <h3>Upcoming Predictions</h3>
          <p>Next Period: {new Date(predictions.predictedNextPeriodDate).toLocaleDateString()}</p>
          <p>Ovulation: {new Date(predictions.predictedOvulationDate).toLocaleDateString()}</p>
          <p>Fertile Window: {new Date(predictions.predictedFertileWindowStart).toLocaleDateString()} - {new Date(predictions.predictedFertileWindowEnd).toLocaleDateString()}</p>
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="analytics">
          <h3>Cycle Analytics</h3>
          <p>Average Cycle Length: {analytics.averageCycleLength} days</p>
          <p>Regularity: {analytics.regularity}</p>
          <p>Prediction Accuracy: {analytics.predictionAccuracy}%</p>
        </div>
      )}

      {/* Daily Log Form */}
      {currentCycle && (
        <DailyLogForm 
          cycleId={currentCycle._id}
          onSubmit={updateDailyLog}
        />
      )}

      {/* Cycle History */}
      <div className="cycle-history">
        <h3>Recent Cycles</h3>
        {cycleHistory.map(cycle => (
          <div key={cycle._id} className="cycle-item">
            <span>Cycle #{cycle.cycleNumber}</span>
            <span>{cycle.cycleStatus}</span>
            <span>{cycle.cycleLengthDays} days</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeriodCycleTracker;
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (cycle doesn't exist)
- `500`: Internal Server Error

## Data Flow Summary

1. **User starts period** → `POST /start` → Creates new cycle
2. **Daily tracking** → `POST /:cycleId/daily-log` → Updates symptoms/flow
3. **System auto-detects** → No flow for 3+ days → Auto-completes cycle
4. **User can manually complete** → `PUT /:cycleId/complete` → Ends cycle
5. **Predictions improve** → Based on completed cycle history
6. **Analytics update** → Regularity, averages, accuracy scores

## Integration Tips

1. **Start with current cycle** - Always check for active cycle first
2. **Handle no active cycle** - Show "Start New Cycle" button
3. **Real-time updates** - Refresh data after major actions
4. **Error boundaries** - Handle network errors gracefully
5. **Loading states** - Show spinners during API calls
6. **Optimistic updates** - Update UI immediately, sync with server
7. **Offline support** - Cache cycle data locally when possible

This system provides a complete menstrual cycle tracking solution with intelligent predictions, comprehensive daily logging, and detailed analytics for better health insights.
