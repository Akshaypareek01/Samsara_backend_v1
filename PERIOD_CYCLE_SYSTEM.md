# Period Cycle Tracking System

## Overview

The Period Cycle Tracking System is a comprehensive solution for tracking menstrual cycles, daily symptoms, and providing intelligent predictions based on user history. It automatically creates new cycles, tracks daily logs, and learns from user patterns to improve predictions over time.

## How It Works

### 1. Cycle Lifecycle

**Starting a New Cycle:**
- User marks start of period → New `PeriodCycle` document created
- System automatically calculates predictions based on cycle history
- Cycle status set to 'Active'
- Sequential cycle number assigned

**During Cycle:**
- User logs daily symptoms, flow intensity, etc.
- System updates current phase automatically
- Auto-completion detection (no flow for 3+ days)

**Completing Cycle:**
- User manually completes or system auto-completes
- Actual cycle length calculated
- Prediction accuracy scored
- Cycle status set to 'Completed'

### 2. Multi-Month Tracking

**Each Month = New Document:**
- Every new period creates a new `PeriodCycle` document
- Previous cycles remain as history
- System uses history for better predictions

**Learning from History:**
- Average cycle length calculated from completed cycles
- Regularity status updated (Regular/Irregular)
- Predictions improve with more data

## API Endpoints

### Core Cycle Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/period-cycles/start` | Start new period cycle |
| `PUT` | `/api/v1/period-cycles/:cycleId/complete` | Complete active cycle |
| `GET` | `/api/v1/period-cycles/current` | Get current active cycle |
| `GET` | `/api/v1/period-cycles/history` | Get cycle history |

### Daily Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/period-cycles/:cycleId/daily-log` | Add/update daily log |
| `GET` | `/api/v1/period-cycles/:cycleId` | Get specific cycle |

### Analytics & Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/period-cycles/predictions` | Get upcoming predictions |
| `GET` | `/api/v1/period-cycles/analytics` | Get cycle analytics |

## Data Model

### PeriodCycle Schema

```javascript
{
  userId: ObjectId,           // Reference to user
  cycleNumber: Number,        // Sequential number (1, 2, 3...)
  cycleStartDate: Date,       // When period started
  cycleEndDate: Date,         // When period ended
  cycleStatus: String,        // 'Active', 'Completed', 'Predicted'
  currentPhase: String,       // 'Menstruation', 'Follicular', 'Ovulation', 'Luteal'
  
  // Predictions (calculated from history)
  predictedNextPeriodDate: Date,
  predictedOvulationDate: Date,
  predictedFertileWindowStart: Date,
  predictedFertileWindowEnd: Date,
  
  // Actual data (filled when completed)
  cycleLengthDays: Number,
  periodDurationDays: Number,
  predictionAccuracy: Number,  // 0-100 score
  
  // Daily tracking
  dailyLogs: [DailyLogSchema],
  
  // Metadata
  regularity: String,          // 'Regular' or 'Irregular'
  cycleNotes: String,
  timestamps: true
}
```

### DailyLog Schema

```javascript
{
  date: Date,                 // Calendar date
  flowIntensity: Number,      // 0-5 scale
  crampingIntensity: String,  // None, Mild, Moderate, Strong, Severe
  painLevel: Number,          // 0-10 scale
  energyPattern: String,      // Low, Low-Mid, Moderate, Mid-High, High
  symptoms: [String],         // Array of symptoms
  cravings: [String],         // Food cravings
  exercise: Object,           // Type, minutes, intensity
  discharge: Object,          // Type, color, consistency, amount
  sexualActivity: Object,     // hadSex, protected
  pregnancyTest: Object,      // taken, result
  notes: String               // Free text notes
}
```

## Key Features

### 1. Intelligent Predictions
- **Cycle Length**: Based on average of previous cycles
- **Ovulation**: 14 days before predicted next period
- **Fertile Window**: 5 days before + ovulation day + 1 day after
- **Auto-improvement**: Predictions get better with more data

### 2. Automatic Phase Detection
- **Menstruation**: When flow intensity > 0
- **Follicular**: Days 1-14 of cycle
- **Ovulation**: Days 15-16 of cycle
- **Luteal**: Days 17+ of cycle

### 3. Smart Cycle Completion
- **Manual**: User marks cycle as complete
- **Auto**: System detects no flow for 3+ days
- **Accuracy Scoring**: How well predictions matched reality

### 4. Regularity Analysis
- **Standard Deviation**: Calculated from cycle lengths
- **Regular**: ≤3 days variation
- **Irregular**: >3 days variation

## Usage Examples

### Starting a New Cycle

```javascript
// User starts period
POST /api/v1/period-cycles/start

// System automatically:
// 1. Creates new cycle document
// 2. Calculates predictions from history
// 3. Sets cycle status to 'Active'
// 4. Assigns next cycle number
```

### Logging Daily Symptoms

```javascript
// User logs daily symptoms
POST /api/v1/period-cycles/:cycleId/daily-log
{
  "date": "2024-01-15",
  "flowIntensity": 3,
  "crampingIntensity": "Moderate",
  "painLevel": 6,
  "symptoms": ["bloating", "fatigue"],
  "notes": "Heavy flow today"
}

// System automatically:
// 1. Updates daily logs
// 2. Determines current phase
// 3. Checks for auto-completion
```

### Getting Predictions

```javascript
// Get upcoming predictions
GET /api/v1/period-cycles/predictions

// Returns:
{
  "predictedNextPeriodDate": "2024-02-12",
  "predictedOvulationDate": "2024-01-29",
  "predictedFertileWindowStart": "2024-01-24",
  "predictedFertileWindowEnd": "2024-01-30",
  "currentPhase": "Menstruation"
}
```

## Business Logic

### Prediction Algorithm

1. **New Users**: Default 28-day cycle, 5-day period
2. **Returning Users**: Average of last 6 completed cycles
3. **Ovulation**: Always 14 days before next period
4. **Fertile Window**: 7-day window around ovulation

### Auto-Completion Logic

- Monitors last 3 days of daily logs
- If no flow intensity for 3+ days → auto-complete cycle
- Prevents orphaned active cycles

### Regularity Calculation

- Uses standard deviation of cycle lengths
- Requires minimum 3 completed cycles
- Updates all user cycles when recalculated

## Benefits

1. **No Manual Cycle Management**: System handles cycle creation/completion
2. **Learning System**: Predictions improve with user data
3. **Comprehensive Tracking**: Detailed daily symptom logging
4. **Smart Analytics**: Insights into cycle patterns and regularity
5. **Scalable Architecture**: Separate documents per cycle, efficient queries

## Future Enhancements

- **Machine Learning**: More sophisticated prediction algorithms
- **Symptom Correlation**: Identify patterns between symptoms and cycle phases
- **Health Insights**: Recommendations based on tracked data
- **Integration**: Connect with other health tracking systems
- **Notifications**: Reminders for upcoming periods, fertile windows
