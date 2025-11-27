# Period Tracker - Complete System Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [How It Works](#how-it-works)
3. [Data Flow](#data-flow)
4. [User Journey](#user-journey)
5. [API Endpoints](#api-endpoints)
6. [Data Models](#data-models)
7. [Frontend Integration](#frontend-integration)
8. [Testing & Validation](#testing--validation)
9. [Common Scenarios](#common-scenarios)

---

## System Overview

The Period Tracker is a comprehensive menstrual cycle tracking system that:
- Tracks period cycles with start/end dates
- Logs daily symptoms, flow, and health data
- Predicts next period, ovulation, and fertile windows
- Learns from historical data to improve accuracy
- Supports both current and historical data entry
- **Auto-completes old cycles** (configurable, default 60 days)
- **Separates period end from cycle end** (period ends ≠ cycle ends)

### ⚠️ Important: Period vs Cycle

**Period** = Bleeding phase (3-7 days)
- Ends when user stops bleeding → `periodEndDate` is set
- Cycle continues after period ends

**Cycle** = Full menstrual cycle (21-35 days)
- Starts when period starts
- Continues through: Menstruation → Follicular → Ovulation → Luteal
- Ends when next period starts → `cycleEndDate` is set

**Flow:**
1. Start period → Cycle created (Active)
2. Stop period → `periodEndDate` set, cycle still Active
3. Cycle continues → All phases happen
4. Start next period → Previous cycle ends (`cycleEndDate` set), new cycle starts

### Key Features
✅ **Cycle Management**: Start/stop periods, track cycle length, update/delete cycles  
✅ **Period vs Cycle Separation**: Period ends separately from cycle (cycle continues after period)  
✅ **Auto-Completion**: Automatically completes cycles exceeding maxCycleDays (default 60 days)  
✅ **Daily Logging**: Comprehensive symptom and health tracking, delete logs  
✅ **Predictions**: Next period, ovulation, fertile window, PMS window  
✅ **Historical Data**: Enter past cycles and logs, bulk import  
✅ **Analytics**: Cycle patterns, regularity, accuracy, insights, statistics  
✅ **Settings**: Customizable cycle length, reminders, pregnancy mode, PMS settings, maxCycleDays  
✅ **Pregnancy Mode**: Track pregnancy, disable predictions  
✅ **PMS Prediction**: Predict PMS window (5 days before period)  
✅ **Irregularity Detection**: Automatic detection of irregular cycles with variance calculation  
✅ **Enhanced Validation**: Comprehensive validation rules and business logic  

---

## How It Works

### Core Concepts

1. **Cycle**: One complete menstrual cycle from period start to next period start (typically 21-35 days)
2. **Period**: The bleeding phase (typically 3-7 days) - part of the cycle
3. **Cycle Length**: Days from one period start to the next period start
4. **Period Duration**: Days of bleeding (from period start to period end)
5. **Phases**: Menstruation → Follicular → Ovulation → Luteal

**Important Distinction:**
- **Period ends** → Bleeding stops, but cycle continues
- **Cycle ends** → When next period starts (cycleEndDate is set)
- A cycle can have `periodEndDate` set but still be Active (cycle continues)

### Prediction Logic

```
1. User enters period start date
2. System looks at last 6 completed cycles
3. Calculates average cycle length (trimming outliers)
4. Handles edge cases:
   - Extremely short cycles (<21 days) → adjusted to 21
   - Extremely long cycles (>45 days) → adjusted to 45
   - Missing cycles → uses defaults
5. Predicts:
   - Next period: startDate + averageCycleLength
   - Ovulation: nextPeriod - 14 days (luteal phase)
   - Fertile window: ovulation ± 5 days
   - PMS window: 5 days before next period (if enabled)
6. Updates predictions as more data is collected
7. Calculates irregularity (standard deviation, variance)
```

### Irregularity Detection

```
1. System tracks cycle lengths from completed cycles
2. Calculates:
   - Average cycle length
   - Standard deviation
   - Variance
   - Min/Max cycle lengths
3. Determines regularity:
   - Regular: standard deviation ≤ 3 days AND range ≤ 7 days
   - Irregular: standard deviation > 3 days OR range > 7 days
4. Flags extreme cycles (<21 or >45 days)
5. Updates regularity status on all cycles
```

### PMS Prediction

```
1. System predicts next period date
2. Calculates PMS window:
   - PMS Start: nextPeriod - 5 days (configurable)
   - PMS End: nextPeriod - 1 day
3. Shows PMS window in calendar
4. Provides recommendations during PMS window
5. Can be disabled in settings
```

### Cycle States

- **Active**: Current ongoing cycle (may have periodEndDate set, but cycleEndDate is null)
- **Completed**: Finished cycle with cycleEndDate set (when next period started)
- **Predicted**: Future predicted cycle (not yet started)

### Cycle Lifecycle

```
1. User starts period → Cycle created (Active, no periodEndDate, no cycleEndDate)
2. User stops period → periodEndDate set, cycle remains Active
3. Cycle continues → Follicular → Ovulation → Luteal phases
4. User starts next period → Previous cycle ends (cycleEndDate set, status = Completed)
5. New cycle created → Active cycle starts
```

### Auto-Completion Feature

- **Purpose**: Prevents cycles from running indefinitely if user forgets to start next period
- **Default**: Cycles exceeding 60 days are automatically completed
- **Configurable**: Users can set `maxCycleDays` in settings (30-90 days)
- **When it runs**: Automatically checked when:
  - Getting current status (`/current` or `/current-enhanced`)
  - Adding daily logs
- **What it does**: Sets `cycleEndDate` to today, marks cycle as Completed

### Pregnancy Mode

- When enabled: Disables all period predictions
- Tracks: Pregnancy start date, due date, current week
- Use case: User is pregnant, no need for period predictions
- Can be toggled on/off in settings

---

## Data Flow

### Flow Diagram

```
User Action → API Request → Service Layer → Database → Response
     ↓
Frontend Update
```

### Complete Flow

1. **User Starts Period**
   ```
   User clicks "Start Period" 
   → POST   /v1/period-tracker/period/start
   → Creates new PeriodCycle document
   → Closes previous open cycle (if exists)
   → Calculates predictions
   → Returns cycle data
   → Frontend updates UI
   ```

2. **User Logs Daily Data**
   ```
   User enters daily log
   → PUT   /v1/period-tracker/logs/:date
   → Finds cycle containing that date
   → Adds/updates log in cycle.dailyLogs[]
   → Updates cycle phase if needed
   → Returns updated log
   → Frontend updates calendar
   ```

3. **User Stops Period**
   ```
   User clicks "Stop Period"
   → POST   /v1/period-tracker/period/stop
   → Sets periodEndDate (bleeding stopped)
   → Calculates period duration
   → Updates phase from Menstruation → Follicular
   → Cycle remains Active (cycle continues)
   → Returns cycle with periodEndDate set
   → Frontend shows period ended, cycle continues
   ```

4. **User Starts Next Period (Cycle Ends)**
   ```
   User clicks "Start Period" (next cycle)
   → POST   /v1/period-tracker/period/start
   → Closes previous cycle (sets cycleEndDate)
   → Calculates cycle length (previous start to this start)
   → Marks previous cycle as Completed
   → Creates new Active cycle
   → Returns new cycle data
   → Frontend shows new period started
   ```

5. **System Predicts Next Period**
   ```
   User views calendar
   → GET   /v1/period-tracker/current
   → Gets latest cycle
   → Auto-completes old cycles (>60 days)
   → Calculates average from history
   → Returns predictions
   → Frontend displays predictions
   ```

---

## User Journey

### First Time User

```
1. User opens app → No cycle data
2. User enters settings (optional):
   - Default cycle length: 28 days
   - Luteal phase: 14 days
   - Reminder time: 20:00
3. User starts first period:
   - Clicks "Start Period"
   - System creates cycle #1
   - Predictions use defaults (28-day cycle)
4. User logs daily data (optional):
   - Flow intensity
   - Symptoms
   - Energy level
5. User stops period:
   - Clicks "Stop Period"
   - System sets periodEndDate
   - System calculates period duration
   - Cycle remains Active (continues)
6. Next period:
   - User starts new period
   - Previous cycle ends (cycleEndDate set, status = Completed)
   - System calculates cycle length
   - System uses completed cycles for predictions
   - Accuracy improves with each cycle
```

### Returning User

```
1. User opens app → Sees current cycle status
2. If period active:
   - Shows current cycle day
   - Shows predicted end date
   - Shows current phase
3. If no active period:
   - Shows days until next predicted period
   - Shows predicted ovulation date
4. User can:
   - View calendar with predictions
   - Add daily logs
   - View history
   - Update settings
```

### Historical Data Entry

```
1. User wants to enter past data
2. Option A: Single cycle
   - POST /period/start with past date
   - Include cycleEndDate for completed cycles
   - Include dailyLogs array
3. Option B: Bulk import
   - POST /bulk-import
   - Send array of cycles with logs
   - System processes chronologically
4. System:
   - Creates cycles with correct numbers
   - Associates logs with cycles
   - Updates predictions
```

---

## API Endpoints

### Base URL
```
  /v1/period-tracker
```

### Authentication
All endpoints require JWT token:
```
Authorization: Bearer <token>
```

---

### 1. Get Current Status

**Endpoint:** `GET   /v1/period-tracker/current`

**Description:** Get current cycle status, predictions, and settings

**Response:**
```json
{
  "cycle": {
    "_id": "...",
    "cycleNumber": 3,
    "cycleStartDate": "2024-01-15T00:00:00.000Z",
    "cycleEndDate": null,
    "cycleStatus": "Active",
    "currentPhase": "Menstruation",
    "periodDurationDays": null,
    "dailyLogs": [...]
  },
  "predictions": {
    "nextPeriod": "2024-02-12T00:00:00.000Z",
    "ovulation": "2024-01-29T00:00:00.000Z",
    "fertileWindow": {
      "start": "2024-01-24T00:00:00.000Z",
      "end": "2024-01-30T00:00:00.000Z"
    },
    "averageCycleDays": 28,
    "currentPhase": "Menstruation",
    "currentCycleDay": 3
  },
  "settings": {
    "defaultCycleLengthDays": 28,
    "lutealPhaseDays": 14,
    "trackingReminderEnabled": true,
    "trackingReminderTime": "20:00"
  }
}
```

**Use Case:** Load app, show current status

---

### 2. Start Period

**Endpoint:** `POST   /v1/period-tracker/period/start`

**Request:**
```json
{
  "date": "2024-01-15",  // Optional, defaults to today
  "cycleEndDate": "2024-01-20",  // Optional, for historical completed cycles
  "periodDurationDays": 5,  // Optional
  "cycleStatus": "Completed",  // Optional: "Active" or "Completed"
  "dailyLogs": [  // Optional
    {
      "date": "2024-01-15",
      "flowIntensity": 3,
      "crampingIntensity": "Moderate"
    }
  ]
}
```

**Response:**
```json
{
  "_id": "...",
  "userId": "...",
  "cycleNumber": 3,
  "cycleStartDate": "2024-01-15T00:00:00.000Z",
  "cycleEndDate": null,
  "cycleStatus": "Active",
  "currentPhase": "Menstruation",
  "predictedNextPeriodDate": "2024-02-12T00:00:00.000Z",
  "predictedOvulationDate": "2024-01-29T00:00:00.000Z",
  "dailyLogs": []
}
```

**Use Case:** User clicks "Start Period" button

---

### 3. Stop Period

**Endpoint:** `POST   /v1/period-tracker/period/stop`

**Description:** Stops the bleeding period. The cycle continues (remains Active) until the next period starts.

**Request:**
```json
{
  "date": "2024-01-20"  // Optional, defaults to today
}
```

**Response:**
```json
{
  "_id": "...",
  "cycleNumber": 3,
  "cycleStartDate": "2024-01-15T00:00:00.000Z",
  "cycleEndDate": null,  // Cycle hasn't ended yet
  "periodEndDate": "2024-01-20T00:00:00.000Z",  // Period ended
  "periodDurationDays": 5,
  "cycleStatus": "Active",  // Cycle continues
  "currentPhase": "Follicular",  // Updated from Menstruation
  "dailyLogs": [...]
}
```

**Important Notes:**
- `periodEndDate` is set (bleeding stopped)
- `cycleEndDate` remains null (cycle continues)
- `cycleStatus` remains "Active"
- Cycle only ends when next period starts
- Phase updates from "Menstruation" to "Follicular"

**Use Case:** User clicks "Stop Period" button

---

### 4. Add/Update Daily Log

**Endpoint:** `PUT   /v1/period-tracker/logs/:date`

**URL Parameter:** `date` in format `YYYY-MM-DD` (can be past date)

**Request:**
```json
{
  "flowIntensity": 3,  // 0-5
  "crampingIntensity": "Moderate",  // None, Mild, Moderate, Strong, Severe
  "painLevel": 5,  // 0-10
  "energyPattern": "Low",  // Low, Low-Mid, Moderate, Mid-High, High
  "restNeeded": true,
  "symptoms": ["bloating", "headache", "mood swings"],
  "cravings": ["chocolate"],
  "medicationTaken": true,
  "supplementTaken": false,
  "exercise": {
    "type": "yoga",
    "minutes": 30,
    "intensity": "moderate"
  },
  "discharge": {
    "type": "egg white",
    "color": "clear",
    "consistency": "sticky",
    "amount": "normal",
    "notableChanges": ["increased"]
  },
  "sexualActivity": {
    "hadSex": true,
    "protected": true
  },
  "pregnancyTest": {
    "taken": false,
    "result": "Negative"  // Positive, Negative, Unknown
  },
  "notes": "Feeling better today"
}
```

**Response:**
```json
{
  "date": "2024-01-15T00:00:00.000Z",
  "flowIntensity": 3,
  "crampingIntensity": "Moderate",
  "painLevel": 5,
  "symptoms": ["bloating", "headache"],
  ...
}
```

**Use Case:** User logs daily data on calendar day

**Note:** All fields are optional. Send only fields user entered.

---

### 5. Get Calendar View

**Endpoint:** `GET   /v1/period-tracker/calendar?month=2024-01`

**Query Parameters:**
- `month`: Optional, format `YYYY-MM` (defaults to current month)

**Response:**
```json
{
  "year": 2024,
  "month": 1,
  "days": [],
  "periodRanges": [
    {
      "start": "2024-01-15T00:00:00.000Z",
      "end": "2024-01-20T00:00:00.000Z"
    }
  ],
  "fertileWindow": {
    "start": "2024-01-24T00:00:00.000Z",
    "end": "2024-01-30T00:00:00.000Z"
  },
  "ovulationDate": "2024-01-29T00:00:00.000Z",
  "nextPeriodDate": "2024-02-12T00:00:00.000Z"
}
```

**Use Case:** Display calendar with period days, fertile window, ovulation

**Frontend Implementation:**
```javascript
// Build calendar days
const days = [];
for (let day = 1; day <= daysInMonth; day++) {
  const date = new Date(year, month - 1, day);
  const isPeriod = periodRanges.some(range => 
    date >= range.start && date <= range.end
  );
  const isFertile = date >= fertileWindow.start && date <= fertileWindow.end;
  const isOvulation = date.getTime() === ovulationDate.getTime();
  
  days.push({
    date,
    isPeriod,
    isFertile,
    isOvulation
  });
}
```

---

### 6. Get Cycle History

**Endpoint:** `GET   /v1/period-tracker/history?limit=6`

**Query Parameters:**
- `limit`: Optional, default 6, max 24

**Response:**
```json
[
  {
    "id": "...",
    "month": "2024-01-15T00:00:00.000Z",
    "periodDurationDays": 5,
    "cycleLengthDays": 28,
    "delayDays": 0,
    "fertileWindow": {
      "start": "2024-01-24T00:00:00.000Z",
      "end": "2024-01-30T00:00:00.000Z"
    },
    "ovulationDate": "2024-01-29T00:00:00.000Z"
  },
  ...
]
```

**Use Case:** Show past cycles in history view

---

### 7. Get Specific Day

**Endpoint:** `GET   /v1/period-tracker/day/:date`

**URL Parameter:** `date` in format `YYYY-MM-DD`

**Response:**
```json
{
  "cycleId": "...",
  "log": {
    "date": "2024-01-15T00:00:00.000Z",
    "flowIntensity": 3,
    "crampingIntensity": "Moderate",
    ...
  },
  "cycle": {
    "cycleNumber": 3,
    "cycleStartDate": "2024-01-15T00:00:00.000Z",
    ...
  }
}
```

**Use Case:** Show log details when user taps on calendar day

---

### 8. Get Settings

**Endpoint:** `GET   /v1/period-tracker/settings`

**Response:**
```json
{
  "_id": "...",
  "userId": "...",
  "trackingReminderEnabled": true,
  "trackingReminderTime": "20:00",
  "defaultCycleLengthDays": 28,
  "lutealPhaseDays": 14
}
```

**Use Case:** Load user settings

---

### 9. Update Settings

**Endpoint:** `PUT /api/v1/period-tracker/settings`

**Request:**
```json
{
  "trackingReminderEnabled": true,
  "trackingReminderTime": "20:00",  // HH:mm format
  "defaultCycleLengthDays": 28,  // 15-60
  "lutealPhaseDays": 14,  // 10-20
  // Pregnancy Mode
  "pregnancyModeEnabled": false,
  "pregnancyStartDate": "2024-01-01",  // Optional
  "pregnancyDueDate": "2024-10-01",  // Optional
  "pregnancyWeek": 4,  // Optional, 0-42
  // PMS Settings
  "pmsPredictionEnabled": true,
  "pmsDaysBeforePeriod": 5,  // 1-10
  // Auto-Completion Settings
  "maxCycleDays": 60,  // 30-90, auto-complete cycles exceeding this
  // Sync
  "syncEnabled": true
}
```

**Response:** Updated settings object

**Use Case:** User updates preferences, enables pregnancy mode, configures PMS

**Pregnancy Mode:**
- When `pregnancyModeEnabled: true`, all period predictions are disabled
- System tracks pregnancy week and due date
- Useful when user is pregnant and doesn't need period tracking

**PMS Settings:**
- `pmsPredictionEnabled`: Enable/disable PMS window predictions
- `pmsDaysBeforePeriod`: How many days before period to show PMS window (default: 5)

---

### 10. Get Current Enhanced (with PMS & Pregnancy Mode)

**Endpoint:** `GET /api/v1/period-tracker/current-enhanced`

**Description:** Enhanced current status with PMS window, irregularity detection, and pregnancy mode support

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {
      "_id": "...",
      "cycleNumber": 3,
      "cycleStartDate": "2024-01-15T00:00:00.000Z",
      "cycleStatus": "Active",
      "currentPhase": "Menstruation"
    },
    "predictions": {
      "nextPeriod": "2024-02-12T00:00:00.000Z",
      "ovulation": "2024-01-29T00:00:00.000Z",
      "fertileWindow": {
        "start": "2024-01-24T00:00:00.000Z",
        "end": "2024-01-30T00:00:00.000Z"
      },
      "daysUntilNextPeriod": 28,
      "averageCycleDays": 28,
      "currentPhase": "Menstruation",
      "currentCycleDay": 3
    },
    "pmsWindow": {
      "pmsStartDate": "2024-02-07T00:00:00.000Z",
      "pmsEndDate": "2024-02-11T00:00:00.000Z",
      "daysUntilPeriod": 5
    },
    "regularity": "Regular",
    "isIrregular": false,
    "settings": {...},
    "pregnancyMode": false
  }
}
```

**Use Case:** Get comprehensive current status with all predictions and insights

---

### 11. Bulk Import Historical Cycles

**Endpoint:** `POST /api/v1/period-tracker/bulk-import`

**Request:**
```json
{
  "cycles": [
    {
      "cycleStartDate": "2024-01-15",
      "cycleEndDate": "2024-01-20",
      "periodDurationDays": 5,
      "cycleStatus": "Completed",
      "cycleNotes": "Normal cycle",
      "dailyLogs": [
        {
          "date": "2024-01-15",
          "flowIntensity": 3,
          "crampingIntensity": "Moderate"
        },
        {
          "date": "2024-01-16",
          "flowIntensity": 4
        }
      ]
    },
    {
      "cycleStartDate": "2024-02-12",
      "cycleEndDate": "2024-02-17",
      "cycleStatus": "Completed"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycles": [...],
    "count": 2
  },
  "message": "Successfully imported 2 historical cycle(s)"
}
```

**Use Case:** Import past months of data

**Limits:** Maximum 50 cycles per request

---

### 12. Delete Cycle

**Endpoint:** `DELETE /api/v1/period-tracker/cycle/:cycleId`

**URL Parameter:** `cycleId` - Cycle ID to delete

**Response:**
```json
{
  "status": "success",
  "message": "Cycle deleted successfully"
}
```

**Use Case:** User wants to remove an incorrect cycle entry

**Note:** System automatically re-numbers remaining cycles

---

### 13. Update Cycle

**Endpoint:** `PUT /api/v1/period-tracker/cycle/:cycleId`

**URL Parameter:** `cycleId` - Cycle ID to update

**Request:**
```json
{
  "cycleStartDate": "2024-01-15",  // Optional
  "cycleEndDate": "2024-01-20",  // Optional
  "periodDurationDays": 5,  // Optional
  "cycleStatus": "Completed",  // Optional: "Active", "Completed", "Predicted"
  "cycleNotes": "Updated notes",  // Optional
  "currentPhase": "Menstruation"  // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "cycle": {...}
  },
  "message": "Cycle updated successfully"
}
```

**Use Case:** Correct cycle dates or add notes to existing cycle

**Validation:**
- `cycleEndDate` cannot be before `cycleStartDate`
- System recalculates `periodDurationDays` if dates change

---

### 14. Delete Daily Log

**Endpoint:** `DELETE /api/v1/period-tracker/logs/:date`

**URL Parameter:** `date` in format `YYYY-MM-DD`

**Response:**
```json
{
  "status": "success",
  "message": "Log deleted successfully"
}
```

**Use Case:** Remove incorrect log entry

---

### 15. Get Analytics

**Endpoint:** `GET /api/v1/period-tracker/analytics`

**Description:** Comprehensive cycle analytics including irregularity, flow analysis, symptoms frequency

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "totalCycles": 6,
      "averageCycleLength": 28,
      "averagePeriodDuration": 5,
      "minCycleLength": 25,
      "maxCycleLength": 32,
      "regularity": "Regular",
      "isIrregular": false,
      "standardDeviation": 2.5,
      "variance": 6.25,
      "averagePredictionAccuracy": 85,
      "flowAnalysis": {
        "averageFlowDays": 5,
        "averageHeavyFlowDays": 1,
        "cycles": [...]
      },
      "topSymptoms": [
        { "symptom": "bloating", "count": 12 },
        { "symptom": "headache", "count": 8 }
      ],
      "cycleTrend": [...]
    }
  }
}
```

**Use Case:** Display analytics dashboard, show patterns and trends

---

### 16. Get Insights

**Endpoint:** `GET /api/v1/period-tracker/insights`

**Description:** Personalized insights, recommendations, and predictions

**Response:**
```json
{
  "status": "success",
  "data": {
    "insights": {
      "currentStatus": {
        "cycleDay": 3,
        "phase": "Menstruation",
        "isPeriodActive": true
      },
      "predictions": {
        "nextPeriodDate": "2024-02-12T00:00:00.000Z",
        "daysUntilNextPeriod": 28,
        "averageCycleLength": 28,
        "regularity": "Regular"
      },
      "patterns": {
        "regularity": "Regular",
        "trend": "Stable",
        "averageCycleLength": 28,
        "consistency": "Consistent"
      },
      "recommendations": [
        "Your cycles show consistent patterns. Predictions are highly accurate.",
        "You may experience PMS symptoms. Your period is predicted in 5 days."
      ]
    }
  }
}
```

**Use Case:** Show personalized insights and recommendations to user

---

### 17. Get Statistics

**Endpoint:** `GET /api/v1/period-tracker/stats`

**Description:** Quick statistics summary

**Response:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalCycles": 6,
      "totalDaysTracked": 168,
      "averageCycleLength": 28,
      "averagePeriodDuration": 5,
      "shortestCycle": 25,
      "longestCycle": 32,
      "shortestPeriod": 4,
      "longestPeriod": 6
    }
  }
}
```

**Use Case:** Display quick stats summary

---

## Data Models

### PeriodCycle Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  cycleNumber: Number (required), // Sequential: 1, 2, 3...
  cycleStartDate: Date (required, indexed),
  cycleEndDate: Date (optional), // When cycle ends (next period starts)
  periodEndDate: Date (optional), // When bleeding/period ends (separate from cycle end)
  periodDurationDays: Number, // Days of bleeding
  cycleLengthDays: Number, // Days from previous cycle start to this cycle start
  cycleStatus: String, // "Active", "Completed", "Predicted"
  currentPhase: String, // "Menstruation", "Follicular", "Ovulation", "Luteal"
  regularity: String, // "Regular", "Irregular"
  
  // Predictions
  predictedNextPeriodDate: Date,
  predictedOvulationDate: Date,
  predictedFertileWindowStart: Date,
  predictedFertileWindowEnd: Date,
  
  // Daily logs array
  dailyLogs: [DailyLog],
  
  // Enhanced tracking
  actualOvulationDate: Date,
  actualFertileWindowStart: Date,
  actualFertileWindowEnd: Date,
  cycleNotes: String,
  predictionAccuracy: Number, // 0-100
  // Irregularity tracking
  varianceFromAverage: Number, // Days difference from average
  isOutlier: Boolean (default: false), // If cycle is extreme outlier
  // PMS tracking
  pmsStartDate: Date,
  pmsEndDate: Date,
  pmsSymptoms: [String],
  // Flow tracking
  spottingDays: Number (default: 0), // Days with light flow/spotting
  heavyFlowDays: Number (default: 0), // Days with heavy flow
  
  createdAt: Date,
  updatedAt: Date
}
```

**Database Indexes:**
- `userId + cycleStartDate` (compound, descending)
- `userId + cycleStatus` (compound)
- `userId + cycleNumber` (compound, descending)
- `userId + predictedNextPeriodDate` (for reminders)
- `dailyLogs.date` (for log queries)

**Constraints:**
- Only one active cycle per user (enforced in application logic)
- `cycleEndDate` cannot be before `cycleStartDate` (pre-save validation)
- Cycle numbers are sequential and unique per user
```

### DailyLog Schema

```javascript
{
  date: Date (required),
  flowIntensity: Number, // 0-5 (0=none, 5=heavy)
  crampingIntensity: String, // "None", "Mild", "Moderate", "Strong", "Severe"
  painLevel: Number, // 0-10
  energyPattern: String, // "Low", "Low-Mid", "Moderate", "Mid-High", "High"
  restNeeded: Boolean,
  symptoms: [String], // ["bloating", "headache", ...]
  cravings: [String],
  medicationTaken: Boolean,
  supplementTaken: Boolean,
  exercise: {
    type: String,
    minutes: Number,
    intensity: String
  },
  discharge: {
    type: String,
    color: String,
    consistency: String,
    amount: String,
    notableChanges: [String]
  },
  sexualActivity: {
    hadSex: Boolean,
    protected: Boolean
  },
  pregnancyTest: {
    taken: Boolean,
    result: String // "Positive", "Negative", "Unknown"
  },
  notes: String
}
```

### PeriodSettings Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  trackingReminderEnabled: Boolean (default: false),
  trackingReminderTime: String (default: "20:00"), // HH:mm
  defaultCycleLengthDays: Number (default: 28, min: 15, max: 60),
  lutealPhaseDays: Number (default: 14, min: 10, max: 20),
  // Pregnancy Mode
  pregnancyModeEnabled: Boolean (default: false),
  pregnancyStartDate: Date,
  pregnancyDueDate: Date,
  pregnancyWeek: Number (min: 0, max: 42),
  // PMS Settings
  pmsPredictionEnabled: Boolean (default: true),
  pmsDaysBeforePeriod: Number (default: 5, min: 1, max: 10),
  // Auto-Completion Settings
  maxCycleDays: Number (default: 60, min: 30, max: 90), // Auto-complete cycles exceeding this
  // Sync/Backup
  lastSyncDate: Date,
  syncEnabled: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Frontend Integration

### 1. App Initialization

```javascript
// On app load
async function loadPeriodTracker() {
  try {
    const response = await fetch('  /v1/period-tracker/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    // Check if user has cycles
    if (data.cycle) {
      // Show current cycle status
      displayCurrentCycle(data.cycle, data.predictions);
    } else {
      // Show onboarding or "Start Period" button
      showOnboarding();
    }
  } catch (error) {
    console.error('Error loading period tracker:', error);
  }
}
```

### 2. Start Period Flow

```javascript
async function startPeriod(date = null) {
  try {
    const response = await fetch('  /v1/period-tracker/period/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: date || new Date().toISOString().split('T')[0]
      })
    });
    
    const cycle = await response.json();
    
    // Update UI
    showActivePeriod(cycle);
    updateCalendar();
    showPredictions(cycle);
  } catch (error) {
    console.error('Error starting period:', error);
    showError('Failed to start period');
  }
}
```

### 3. Daily Log Entry

```javascript
async function saveDailyLog(date, logData) {
  try {
    const dateStr = formatDate(date); // "YYYY-MM-DD"
    const response = await fetch(`  /v1/period-tracker/logs/${dateStr}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
    
    const log = await response.json();
    
    // Update UI
    updateCalendarDay(date, log);
    showSuccess('Log saved');
  } catch (error) {
    console.error('Error saving log:', error);
    showError('Failed to save log');
  }
}

// Example usage
saveDailyLog(new Date(), {
  flowIntensity: 3,
  crampingIntensity: "Moderate",
  painLevel: 5,
  symptoms: ["bloating", "headache"]
});
```

### 4. Calendar View

```javascript
async function loadCalendar(month) {
  try {
    const monthStr = formatMonth(month); // "YYYY-MM"
    const response = await fetch(
      `  /v1/period-tracker/calendar?month=${monthStr}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    // Build calendar
    const days = buildCalendarDays(
      data.year,
      data.month,
      data.periodRanges,
      data.fertileWindow,
      data.ovulationDate
    );
    
    // Render calendar
    renderCalendar(days);
  } catch (error) {
    console.error('Error loading calendar:', error);
  }
}

function buildCalendarDays(year, month, periodRanges, fertileWindow, ovulationDate) {
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if period day
    const isPeriod = periodRanges.some(range => {
      const rangeStart = new Date(range.start).toISOString().split('T')[0];
      const rangeEnd = new Date(range.end).toISOString().split('T')[0];
      return dateStr >= rangeStart && dateStr <= rangeEnd;
    });
    
    // Check if fertile window
    const isFertile = fertileWindow && 
      dateStr >= new Date(fertileWindow.start).toISOString().split('T')[0] &&
      dateStr <= new Date(fertileWindow.end).toISOString().split('T')[0];
    
    // Check if ovulation
    const isOvulation = ovulationDate &&
      dateStr === new Date(ovulationDate).toISOString().split('T')[0];
    
    days.push({
      date,
      day,
      isPeriod,
      isFertile,
      isOvulation
    });
  }
  
  return days;
}
```

### 5. Stop Period Flow

```javascript
async function stopPeriod(date = null) {
  try {
    const response = await fetch('  /v1/period-tracker/period/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: date || new Date().toISOString().split('T')[0]
      })
    });
    
    const cycle = await response.json();
    
    // Update UI
    // Note: Cycle is still Active, period has ended
    showPeriodEnded(cycle);
    updateCalendar();
    // Show that cycle continues (Follicular phase)
    showCycleContinues(cycle);
    showNextPeriodPrediction(cycle);
  } catch (error) {
    console.error('Error stopping period:', error);
    showError('Failed to stop period');
  }
}
```

**Important:** After stopping period:
- `cycle.periodEndDate` is set (bleeding stopped)
- `cycle.cycleStatus` is still "Active" (cycle continues)
- `cycle.currentPhase` is "Follicular" (moved from Menstruation)
- Cycle will end when user starts next period

### 6. Historical Data Entry

```javascript
// Single cycle
async function importHistoricalCycle(cycleData) {
  try {
    const response = await fetch('  /v1/period-tracker/period/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: cycleData.startDate,
        cycleEndDate: cycleData.endDate,
        cycleStatus: 'Completed',
        dailyLogs: cycleData.logs
      })
    });
    
    const cycle = await response.json();
    showSuccess('Historical cycle imported');
    return cycle;
  } catch (error) {
    console.error('Error importing cycle:', error);
    showError('Failed to import cycle');
  }
}

// Bulk import
async function bulkImportCycles(cycles) {
  try {
    const response = await fetch('  /v1/period-tracker/bulk-import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cycles })
    });
    
    const result = await response.json();
    showSuccess(`Imported ${result.data.count} cycles`);
    return result.data.cycles;
  } catch (error) {
    console.error('Error bulk importing:', error);
    showError('Failed to import cycles');
  }
}
```

---

## Testing & Validation

### Test Flow Checklist

#### 1. First Time User
- [ ] Load app → Should show onboarding or "Start Period"
- [ ] Click "Start Period" → Should create cycle #1
- [ ] Check predictions → Should use defaults (28 days)
- [ ] Add daily log → Should save successfully
- [ ] Click "Stop Period" → Should mark cycle as Completed
- [ ] Check history → Should show 1 completed cycle

#### 2. Returning User
- [ ] Load app → Should show current cycle status
- [ ] If period active → Should show cycle day and phase
- [ ] If no period → Should show days until next period
- [ ] View calendar → Should show period days and predictions
- [ ] Add log for today → Should update immediately
- [ ] Add log for past date → Should find correct cycle

#### 3. Historical Data
- [ ] Import single past cycle → Should create with correct number
- [ ] Import bulk cycles → Should process chronologically
- [ ] Add log to past date → Should find/create correct cycle
- [ ] Check predictions → Should improve with more data

#### 4. Edge Cases
- [ ] Start period when one already active → Should close previous
- [ ] Add log before any cycle exists → Should create new cycle
- [ ] Import cycles out of order → Should re-number correctly
- [ ] Stop period twice → Should handle gracefully

### API Testing

```javascript
// Test 1: Start Period
const startResponse = await fetch('  /v1/period-tracker/period/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ date: '2024-01-15' })
});
console.log('Start Period:', await startResponse.json());

// Test 2: Add Log
const logResponse = await fetch('  /v1/period-tracker/logs/2024-01-15', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    flowIntensity: 3,
    crampingIntensity: 'Moderate'
  })
});
console.log('Add Log:', await logResponse.json());

// Test 3: Get Current
const currentResponse = await fetch('  /v1/period-tracker/current', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
console.log('Current Status:', await currentResponse.json());

// Test 4: Stop Period
const stopResponse = await fetch('  /v1/period-tracker/period/stop', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ date: '2024-01-20' })
});
console.log('Stop Period:', await stopResponse.json());
```

### Validation Checklist

- [ ] **Cycle Creation**: New cycles have correct cycleNumber
- [ ] **Predictions**: Calculations are accurate (next period, ovulation, fertile window, PMS)
- [ ] **Log Association**: Logs go to correct cycle
- [ ] **Date Handling**: Past dates work correctly
- [ ] **Cycle Numbering**: Sequential and correct
- [ ] **Auto-Close**: Previous cycles close when new starts
- [ ] **Bulk Import**: Processes correctly
- [ ] **Error Handling**: Graceful error messages
- [ ] **Irregularity Detection**: Standard deviation and variance calculated correctly
- [ ] **PMS Window**: PMS window appears 5 days before predicted period
- [ ] **Pregnancy Mode**: Predictions disabled when pregnancy mode enabled
- [ ] **Edge Cases**: Handles cycles <21 days and >45 days
- [ ] **Validation Rules**: Date ranges validated, no overlapping cycles
- [ ] **Analytics**: All metrics calculated correctly
- [ ] **Delete/Update**: Cycles and logs can be deleted/updated properly

---

## Common Scenarios

### Scenario 1: User Forgets to Log Yesterday

```javascript
// User can add log for past date
await saveDailyLog(new Date('2024-01-15'), {
  flowIntensity: 3,
  crampingIntensity: 'Moderate'
});

// System automatically finds cycle containing Jan 15
// Adds log to that cycle
```

### Scenario 2: User Wants to Enter Last 3 Months

```javascript
const historicalCycles = [
  {
    cycleStartDate: '2024-01-15',
    cycleEndDate: '2024-01-20',
    cycleStatus: 'Completed',
    dailyLogs: [...]
  },
  {
    cycleStartDate: '2024-02-12',
    cycleEndDate: '2024-02-17',
    cycleStatus: 'Completed'
  },
  {
    cycleStartDate: '2024-03-10',
    cycleEndDate: '2024-03-15',
    cycleStatus: 'Completed'
  }
];

await bulkImportCycles(historicalCycles);
// System creates cycles 1, 2, 3 with correct numbering
```

### Scenario 3: User Starts Period Early

```javascript
// User's period started yesterday but forgot to log
await startPeriod('2024-01-14'); // Yesterday's date

// System creates cycle with past start date
// Can add logs for past dates
await saveDailyLog(new Date('2024-01-14'), {
  flowIntensity: 2
});
```

### Scenario 4: Irregular Cycles

```javascript
// User has irregular cycles (25-35 days)
// System learns from history
// After 3+ cycles, predictions adjust
// Regularity status updates to "Irregular" if variance > 3 days
```

### Scenario 5: User Skips Logging

```javascript
// User doesn't log every day - that's OK!
// Only logs when they want to
// System still tracks cycle start/end
// Predictions work with just cycle dates
// Logs are optional but improve accuracy
```

---

## Key Points for Frontend

### 1. **Date Format**
- Always use `YYYY-MM-DD` format for API requests
- Convert to Date objects for display
- Handle timezone properly (UTC midnight)

### 2. **Cycle States**
- **Active**: Show "Period Active" UI
- **No Active**: Show "Next Period" prediction
- **Completed**: Show in history

### 3. **Predictions**
- Use `predictions.nextPeriod` for countdown
- Use `predictions.fertileWindow` for calendar highlights
- Use `predictions.ovulation` for ovulation indicator

### 4. **Log Entry**
- All fields optional
- Send only fields user entered
- Can add logs for past dates
- System finds correct cycle automatically

### 5. **Error Handling**
- Check for 404 (no cycle found)
- Check for 400 (validation errors)
- Show user-friendly messages
- Retry on network errors

### 6. **Performance**
- Cache current status
- Refresh on period start/stop
- Lazy load history
- Debounce log saves

---

## Quick Reference

### Essential Endpoints
- `GET /current` - Load app (basic)
- `GET /current-enhanced` - Load app (with PMS, irregularity, pregnancy mode)
- `POST /period/start` - Start period
- `POST /period/stop` - Stop period
- `PUT /logs/:date` - Save daily log
- `GET /calendar` - Show calendar

### Management Endpoints
- `PUT /cycle/:cycleId` - Update cycle
- `DELETE /cycle/:cycleId` - Delete cycle
- `DELETE /logs/:date` - Delete daily log

### Analytics & Insights
- `GET /analytics` - Comprehensive analytics
- `GET /insights` - Personalized insights and recommendations
- `GET /stats` - Quick statistics

### Optional Endpoints
- `GET /history` - View past cycles
- `GET /day/:date` - View specific day
- `GET /settings` - Get settings
- `PUT /settings` - Update settings (includes pregnancy mode, PMS)
- `POST /bulk-import` - Import historical data

### Data Flow
```
User Action → API Call → Service → Database → Response → UI Update
```

### Cycle Lifecycle
```
Start Period → Active Cycle (Menstruation)
    ↓
Daily Logs (optional)
    ↓
Stop Period → periodEndDate set, Cycle still Active (Follicular → Ovulation → Luteal)
    ↓
Start Next Period → Previous cycle ends (cycleEndDate set, status = Completed)
    ↓
New Active Cycle created
```

### Key Points
- **Period End** ≠ **Cycle End**
- Period ends when bleeding stops (`periodEndDate` set)
- Cycle ends when next period starts (`cycleEndDate` set)
- Cycle continues through all phases even after period ends

---

## Support

For issues:
1. Check API response status codes
2. Verify date formats (`YYYY-MM-DD`)
3. Check authentication token
4. Review error messages
5. Test with Postman/curl first

For questions:
- Review this guide
- Check API response examples
- Test endpoints individually
- Verify data models match

---

---

## Validation Rules & Business Logic

### Date Validation
- **Future Dates**: Period start dates cannot be more than 1 day in the future (unless historical import)
- **Past Dates**: Allowed for historical data entry
- **Date Range**: `cycleEndDate` must be >= `cycleStartDate`
- **Overlapping Cycles**: System prevents overlapping active cycles (auto-closes previous)

### Cycle Validation
- **Cycle Length**: Must be between 15-60 days (adjusted if outside range)
- **Period Duration**: Must be between 1-15 days
- **Cycle Number**: Sequential, unique per user, auto-calculated
- **Active Cycles**: Only one active cycle per user at a time

### Log Validation
- **Date Required**: Log date is required
- **Flow Intensity**: 0-5 (0=none, 5=heavy)
- **Pain Level**: 0-10
- **Cramping**: Enum: None, Mild, Moderate, Strong, Severe
- **Energy Pattern**: Enum: Low, Low-Mid, Moderate, Mid-High, High
- **Symptoms Array**: Max 50 items
- **Notes**: Max 1000 characters

### Bulk Import Validation
- **Maximum Cycles**: 50 cycles per request
- **Required Fields**: `cycleStartDate` required for each cycle
- **Date Order**: Cycles processed chronologically
- **Duplicate Handling**: Updates existing cycles if same start date

### Prediction Validation
- **Minimum Cycles**: Uses defaults if < 3 completed cycles
- **Outlier Handling**: Trims top/bottom 10% for stability
- **Extreme Cycles**: Adjusts <21 days to 21, >45 days to 45
- **Pregnancy Mode**: No predictions when enabled

---

## Testing Script

A comprehensive test script is available: `test-period-tracker-complete-flow.js`

**Usage:**
```bash
node test-period-tracker-complete-flow.js
```

**Tests Included:**
1. Authentication
2. Import Historical Data (3 months)
3. Start Period
4. Add Daily Logs
5. Get Current Enhanced (with predictions, PMS, irregularity)
6. Stop Period
7. Get Analytics
8. Get Insights
9. Get Stats
10. Update Settings (PMS, Pregnancy Mode)
11. Pregnancy Mode Test
12. Delete & Update Operations
13. Predictions Accuracy Validation

**What It Validates:**
- ✅ Historical data import works
- ✅ Predictions are calculated correctly
- ✅ PMS window appears in predictions
- ✅ Irregularity detection works
- ✅ Analytics provide accurate metrics
- ✅ Pregnancy mode disables predictions
- ✅ Delete/update operations work
- ✅ Edge cases handled (extreme cycles, missing data)

---

## Architecture Notes

### Database Design
- **MongoDB** with Mongoose ODM
- **Indexes**: Optimized for userId + date queries
- **Constraints**: Application-level (unique active cycle, date validation)
- **Data Retention**: No automatic deletion (GDPR compliance handled separately)

### Service Layer
- **Separation**: Prediction logic, analytics, and core tracking in separate services
- **Reusability**: Utility functions for date calculations, irregularity detection
- **Error Handling**: Comprehensive error messages with HTTP status codes

### API Design
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Authentication**: JWT token required for all endpoints
- **Validation**: Joi validation schemas for all inputs
- **Response Format**: Consistent JSON structure with status, data, message

### Background Jobs (Future Enhancement)
- **Prediction Recalculation**: Nightly job to recalculate predictions
- **Reminder Notifications**: Daily job to send tracking reminders
- **Analytics Update**: Weekly job to update analytics cache
- **Sync**: Background sync for multi-device support

---

**Last Updated:** 2024
**Version:** 2.1 - Enhanced with:
- ✅ Period vs Cycle separation (periodEndDate vs cycleEndDate)
- ✅ Auto-completion feature (maxCycleDays setting)
- ✅ Pregnancy Mode, PMS Prediction
- ✅ Irregularity Detection, Analytics
- ✅ Complete Validation
- ✅ All 13 tests passing

