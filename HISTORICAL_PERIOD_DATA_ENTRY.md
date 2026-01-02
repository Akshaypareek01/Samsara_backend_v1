# Historical Period Data Entry Guide

## Overview

The period tracker now supports entering **past/historical period data** with logs. This allows users to:
- Enter past months' period history
- Add logs for previous dates
- System automatically associates logs with the correct cycle based on date
- Better predictions from historical data

---

## Features

### ✅ **What's Supported**

1. **Past Date Cycle Creation**
   - Create cycles with any past date
   - System handles cycle numbering correctly
   - Supports both active and completed historical cycles

2. **Past Date Log Entry**
   - Add logs for any past date
   - System automatically finds or creates the correct cycle
   - Logs are associated with the cycle that contains that date

3. **Bulk Import**
   - Import multiple historical cycles at once
   - Include daily logs for each cycle
   - System handles all cycle numbering and relationships

4. **Completed Cycle Logs**
   - Can add logs to completed cycles (for historical data)
   - System maintains data integrity

---

## API Endpoints

### 1. Start Period (with Historical Data Support)

**Endpoint:** `POST /api/v1/period-tracker/period/start`

**Request Body:**
```json
{
  "date": "2024-01-15",  // Required - can be any past date
  "cycleEndDate": "2024-01-20",  // Optional - for completed historical cycles
  "periodDurationDays": 5,  // Optional - auto-calculated if cycleEndDate provided
  "cycleStatus": "Completed",  // Optional - "Active" or "Completed" (default: "Active")
  "dailyLogs": [  // Optional - add logs when creating cycle
    {
      "date": "2024-01-15",
      "flowIntensity": 3,
      "crampingIntensity": "Moderate",
      "painLevel": 5,
      "symptoms": ["bloating", "headache"]
    },
    {
      "date": "2024-01-16",
      "flowIntensity": 4,
      "crampingIntensity": "Strong"
    }
  ]
}
```

**Response:**
```json
{
  "_id": "...",
  "userId": "...",
  "cycleNumber": 1,
  "cycleStartDate": "2024-01-15T00:00:00.000Z",
  "cycleEndDate": "2024-01-20T00:00:00.000Z",
  "periodDurationDays": 5,
  "cycleStatus": "Completed",
  "dailyLogs": [...],
  "predictedNextPeriodDate": "...",
  ...
}
```

**Example: Create a completed historical cycle**
```bash
POST /api/v1/period-tracker/period/start
{
  "date": "2024-01-15",
  "cycleEndDate": "2024-01-20",
  "cycleStatus": "Completed",
  "dailyLogs": [
    {
      "date": "2024-01-15",
      "flowIntensity": 3,
      "crampingIntensity": "Moderate"
    }
  ]
}
```

---

### 2. Add Log for Past Date

**Endpoint:** `PUT /api/v1/period-tracker/logs/:date`

**URL Parameter:**
- `date`: Date in format `YYYY-MM-DD` (can be any past date)

**Request Body:**
```json
{
  "flowIntensity": 3,
  "crampingIntensity": "Moderate",
  "painLevel": 5,
  "symptoms": ["bloating"],
  "notes": "Feeling better today"
}
```

**How It Works:**
- System finds the cycle that contains this date (cycleStartDate <= date)
- If no cycle exists, creates a new one automatically
- Adds/updates the log for that date
- Works for both active and completed cycles

**Example: Add log for past date**
```bash
PUT /api/v1/period-tracker/logs/2024-01-15
{
  "flowIntensity": 3,
  "crampingIntensity": "Moderate",
  "painLevel": 5
}
```

---

### 3. Bulk Import Historical Cycles

**Endpoint:** `POST /api/v1/period-tracker/bulk-import`

**Request Body:**
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
          "crampingIntensity": "Moderate",
          "painLevel": 5
        },
        {
          "date": "2024-01-16",
          "flowIntensity": 4,
          "crampingIntensity": "Strong"
        },
        {
          "date": "2024-01-17",
          "flowIntensity": 2,
          "crampingIntensity": "Mild"
        }
      ]
    },
    {
      "cycleStartDate": "2024-02-12",
      "cycleEndDate": "2024-02-17",
      "periodDurationDays": 5,
      "cycleStatus": "Completed",
      "dailyLogs": [
        {
          "date": "2024-02-12",
          "flowIntensity": 2,
          "crampingIntensity": "Mild"
        }
      ]
    },
    {
      "cycleStartDate": "2024-03-10",
      "cycleEndDate": "2024-03-15",
      "periodDurationDays": 5,
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
    "count": 3
  },
  "message": "Successfully imported 3 historical cycle(s)"
}
```

**Features:**
- Processes cycles in chronological order
- Automatically calculates cycle numbers
- Handles existing cycles (updates if found)
- Re-numbers all cycles to ensure correct sequence
- Maximum 50 cycles per request

**Example: Import 3 months of history**
```bash
POST /api/v1/period-tracker/bulk-import
{
  "cycles": [
    {
      "cycleStartDate": "2024-01-15",
      "cycleEndDate": "2024-01-20",
      "cycleStatus": "Completed",
      "dailyLogs": [...]
    },
    {
      "cycleStartDate": "2024-02-12",
      "cycleEndDate": "2024-02-17",
      "cycleStatus": "Completed"
    },
    {
      "cycleStartDate": "2024-03-10",
      "cycleEndDate": "2024-03-15",
      "cycleStatus": "Completed"
    }
  ]
}
```

---

## How It Works

### Cycle Number Assignment

When you create a cycle with a past date:
1. System finds all existing cycles sorted by date
2. Determines where the new date fits chronologically
3. Assigns the correct cycle number
4. Re-numbers cycles that come after (if needed)

**Example:**
- Existing cycles: Jan 15 (cycle 1), Mar 10 (cycle 2)
- Add cycle for Feb 12 → Becomes cycle 2, Mar 10 becomes cycle 3

### Log Association

When you add a log for a past date:
1. System finds the cycle where `cycleStartDate <= logDate`
2. If cycle has `cycleEndDate`, checks `logDate <= cycleEndDate`
3. If no cycle found, creates a new one automatically
4. Adds/updates the log in that cycle

**Example:**
- Cycle: Jan 15 - Jan 20
- Add log for Jan 17 → Goes to this cycle ✅
- Add log for Jan 25 → Creates new cycle (or finds next cycle)

### Bulk Import Process

1. Sorts cycles by start date
2. Processes each cycle chronologically
3. Updates existing cycles or creates new ones
4. Re-numbers all cycles at the end to ensure correct sequence

---

## Use Cases

### Use Case 1: Enter Last Month's Period

```bash
POST /api/v1/period-tracker/period/start
{
  "date": "2024-01-15",
  "cycleEndDate": "2024-01-20",
  "cycleStatus": "Completed",
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
}
```

### Use Case 2: Add Missing Logs to Past Cycle

```bash
# First, find the cycle ID
GET /api/v1/period-tracker/current

# Then add log for past date (system finds cycle automatically)
PUT /api/v1/period-tracker/logs/2024-01-17
{
  "flowIntensity": 2,
  "crampingIntensity": "Mild",
  "notes": "Forgot to log this earlier"
}
```

### Use Case 3: Import 6 Months of History

```bash
POST /api/v1/period-tracker/bulk-import
{
  "cycles": [
    {
      "cycleStartDate": "2023-10-15",
      "cycleEndDate": "2023-10-20",
      "cycleStatus": "Completed"
    },
    {
      "cycleStartDate": "2023-11-12",
      "cycleEndDate": "2023-11-17",
      "cycleStatus": "Completed"
    },
    {
      "cycleStartDate": "2023-12-10",
      "cycleEndDate": "2023-12-15",
      "cycleStatus": "Completed"
    },
    {
      "cycleStartDate": "2024-01-08",
      "cycleEndDate": "2024-01-13",
      "cycleStatus": "Completed"
    },
    {
      "cycleStartDate": "2024-02-05",
      "cycleEndDate": "2024-02-10",
      "cycleStatus": "Completed"
    },
    {
      "cycleStartDate": "2024-03-03",
      "cycleEndDate": "2024-03-08",
      "cycleStatus": "Completed"
    }
  ]
}
```

---

## Best Practices

### 1. **Enter Cycles in Chronological Order**
- Start with oldest cycles first
- System handles re-numbering, but it's more efficient this way

### 2. **Use Bulk Import for Multiple Cycles**
- More efficient than individual API calls
- Ensures correct cycle numbering
- Better for importing months of data

### 3. **Include Daily Logs When Possible**
- More data = better predictions
- Can add logs later if needed
- System associates logs with correct cycle automatically

### 4. **Complete Historical Cycles**
- Set `cycleStatus: "Completed"` for past cycles
- Include `cycleEndDate` for accurate calculations
- System uses completed cycles for predictions

### 5. **Verify After Import**
- Check cycle numbers are correct
- Verify logs are in correct cycles
- Use `GET /api/v1/period-tracker/history` to review

---

## Data Validation

### Date Requirements
- Dates can be any valid date (past, present, or future)
- Format: ISO 8601 or `YYYY-MM-DD`
- System normalizes to UTC midnight

### Cycle Requirements
- `cycleStartDate`: Required
- `cycleEndDate`: Optional (required for completed cycles)
- `periodDurationDays`: Optional (auto-calculated)
- `cycleStatus`: Optional (default: "Active")

### Log Requirements
- `date`: Required in log object
- All other fields optional
- Date must be within cycle range (or system creates new cycle)

---

## Error Handling

### Cycle Already Exists
- If cycle with same `cycleStartDate` exists, it's updated
- Existing logs are merged (not replaced)
- New logs are added

### Invalid Date Range
- `cycleEndDate` must be >= `cycleStartDate`
- System validates and returns error if invalid

### Missing Cycle for Log
- System automatically creates a new cycle
- Cycle status set to "Active"
- Can be completed later

---

## Example: Complete Historical Data Entry Flow

```javascript
// Step 1: Import 3 months of historical cycles
POST /api/v1/period-tracker/bulk-import
{
  "cycles": [
    {
      "cycleStartDate": "2024-01-15",
      "cycleEndDate": "2024-01-20",
      "cycleStatus": "Completed",
      "dailyLogs": [
        { "date": "2024-01-15", "flowIntensity": 3 },
        { "date": "2024-01-16", "flowIntensity": 4 }
      ]
    },
    {
      "cycleStartDate": "2024-02-12",
      "cycleEndDate": "2024-02-17",
      "cycleStatus": "Completed"
    }
  ]
}

// Step 2: Add missing logs to existing cycle
PUT /api/v1/period-tracker/logs/2024-02-13
{
  "flowIntensity": 3,
  "crampingIntensity": "Moderate"
}

// Step 3: Verify data
GET /api/v1/period-tracker/history?limit=10

// Step 4: Check predictions (now based on historical data)
GET /api/v1/period-tracker/current
```

---

## Benefits

1. **Better Predictions**
   - More historical data = more accurate predictions
   - System learns from past patterns
   - Predictions improve with each cycle added

2. **Complete History**
   - Track all past cycles
   - Maintain comprehensive records
   - Better analytics and insights

3. **Flexible Entry**
   - Enter data in any order
   - Add missing logs later
   - System handles associations automatically

4. **Efficient Import**
   - Bulk import for multiple cycles
   - Single API call for months of data
   - Automatic cycle numbering

---

## Notes

- **Cycle Numbers**: Automatically calculated and maintained
- **Predictions**: Updated after each cycle addition
- **Analytics**: Include all historical cycles
- **Performance**: Bulk import is optimized for large datasets
- **Limits**: Maximum 50 cycles per bulk import request

---

## Support

For issues or questions:
- Check cycle numbering with `GET /api/v1/period-tracker/history`
- Verify log associations with `GET /api/v1/period-tracker/day/:date`
- Review predictions with `GET /api/v1/period-tracker/current`















