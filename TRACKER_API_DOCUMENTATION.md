# Tracker API Documentation

This document provides comprehensive information about all tracker-related API endpoints in the Samsara backend.

## Base URL
```
/v1/trackers
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Overview

### Dashboard
- `GET /dashboard` - Get latest data from all trackers

### History Endpoints
- `GET /weight/history` - Get weight tracking history
- `GET /water/history` - Get water intake history
- `GET /mood/history` - Get mood tracking history
- `GET /temperature/history` - Get temperature tracking history
- `GET /fat/history` - Get body fat tracking history
- `GET /bmi/history` - Get BMI tracking history
- `GET /body-status/history` - Get body measurements history
- `GET /step/history` - Get step tracking history
- `GET /sleep/history` - Get sleep tracking history

### Add Entry Endpoints
- `POST /weight` - Add weight entry
- `POST /water` - Add water intake entry
- `POST /mood` - Add mood entry
- `POST /temperature` - Add temperature entry
- `POST /fat` - Add body fat entry
- `POST /bmi` - Add BMI entry
- `POST /body-status` - Add body measurements entry
- `POST /step` - Add step entry
- `POST /sleep` - Add sleep entry

### Update/Delete Endpoints
- `PUT /:trackerType/:entryId` - Update tracker entry
- `DELETE /:trackerType/:entryId` - Delete tracker entry

---

## Detailed Endpoint Documentation

### 1. Dashboard Data
**GET** `/v1/trackers/dashboard`

Returns the latest entry from each tracker for the authenticated user.

**Response:**
```json
{
  "weight": {
    "id": "tracker_id",
    "currentWeight": { "value": 70, "unit": "kg" },
    "goalWeight": { "value": 65, "unit": "kg" },
    "bmi": { "value": 22.5, "category": "Normal" },
    "status": "On Track",
    "measurementDate": "2024-01-15T10:30:00Z"
  },
  "water": {
    "id": "tracker_id",
    "targetMl": 2000,
    "totalIntake": 1800,
    "status": "Hydrated",
    "date": "2024-01-15T00:00:00Z"
  },
  "mood": {
    "id": "tracker_id",
    "mood": "Happy",
    "note": "Feeling great today!",
    "createdAt": "2024-01-15T14:30:00Z"
  },
  "temperature": {
    "id": "tracker_id",
    "temperature": { "value": 98.6, "unit": "F" },
    "status": "Normal",
    "measurementDate": "2024-01-15T09:00:00Z"
  },
  "fat": {
    "id": "tracker_id",
    "bodyFat": { "value": 15, "unit": "%" },
    "healthRangeCategory": "Fitness",
    "measurementDate": "2024-01-15T08:00:00Z"
  },
  "bmi": {
    "id": "tracker_id",
    "bmi": { "value": 22.5, "category": "Normal" },
    "measurementDate": "2024-01-15T08:00:00Z"
  },
  "bodyStatus": {
    "id": "tracker_id",
    "height": { "value": 170, "unit": "cm" },
    "weight": { "value": 70, "unit": "kg" },
    "measurementDate": "2024-01-15T08:00:00Z"
  },
  "step": {
    "id": "tracker_id",
    "steps": 8500,
    "goal": 10000,
    "distance": { "value": 6.8, "unit": "km" },
    "calories": 425,
    "measurementDate": "2024-01-15T00:00:00Z"
  },
  "sleep": {
    "id": "tracker_id",
    "hoursSlept": 7.5,
    "goal": 8,
    "bedtime": "22:30",
    "wakeUpTime": "06:00",
    "date": "2024-01-15T00:00:00Z"
  }
}
```

### 2. History Endpoints

All history endpoints support the following query parameters:
- `days` (optional): Number of days to fetch (default: 30, max: 365)

**Example:** `GET /v1/trackers/weight/history?days=7`

**Response:**
```json
[
  {
    "id": "tracker_id_1",
    "currentWeight": { "value": 70, "unit": "kg" },
    "goalWeight": { "value": 65, "unit": "kg" },
    "bmi": { "value": 22.5, "category": "Normal" },
    "status": "On Track",
    "measurementDate": "2024-01-15T10:30:00Z"
  },
  {
    "id": "tracker_id_2",
    "currentWeight": { "value": 70.5, "unit": "kg" },
    "goalWeight": { "value": 65, "unit": "kg" },
    "bmi": { "value": 22.7, "category": "Normal" },
    "status": "On Track",
    "measurementDate": "2024-01-14T10:30:00Z"
  }
]
```

### 3. Add Entry Endpoints

#### Weight Tracker
**POST** `/v1/trackers/weight`

**Request Body:**
```json
{
  "currentWeight": {
    "value": 70,
    "unit": "kg"
  },
  "goalWeight": {
    "value": 65,
    "unit": "kg"
  },
  "startingWeight": {
    "value": 75,
    "unit": "kg"
  },
  "notes": "Weekly weigh-in"
}
```

#### Water Tracker
**POST** `/v1/trackers/water`

**Request Body:**
```json
{
  "targetGlasses": 8,
  "targetMl": 2000,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "08:00 AM"
    },
    {
      "amountMl": 500,
      "time": "12:00 PM"
    }
  ],
  "totalIntake": 1800,
  "notes": "Good hydration day"
}
```

#### Mood Tracker
**POST** `/v1/trackers/mood`

**Request Body:**
```json
{
  "mood": "Happy",
  "note": "Had a great workout session"
}
```

**Valid mood values:** Happy, Sad, Angry, Anxious, Excited, Calm, Stressed, Energetic, Tired, Neutral

#### Temperature Tracker
**POST** `/v1/trackers/temperature`

**Request Body:**
```json
{
  "temperature": {
    "value": 98.6,
    "unit": "F"
  },
  "notes": "Morning temperature reading"
}
```

#### Fat Tracker
**POST** `/v1/trackers/fat`

**Request Body:**
```json
{
  "age": 30,
  "gender": "Male",
  "height": {
    "value": 175,
    "unit": "cm"
  },
  "weight": {
    "value": 70,
    "unit": "kg"
  },
  "bodyFat": {
    "value": 15,
    "unit": "%"
  },
  "goal": 12,
  "notes": "Monthly body composition check"
}
```

#### BMI Tracker
**POST** `/v1/trackers/bmi`

**Request Body:**
```json
{
  "age": 30,
  "gender": "Male",
  "height": {
    "value": 175,
    "unit": "cm"
  },
  "weight": {
    "value": 70,
    "unit": "kg"
  },
  "notes": "Monthly BMI check"
}
```

#### Body Status Tracker
**POST** `/v1/trackers/body-status`

**Request Body:**
```json
{
  "height": {
    "value": 175,
    "unit": "cm"
  },
  "weight": {
    "value": 70,
    "unit": "kg"
  },
  "chest": {
    "value": 95,
    "unit": "cm"
  },
  "waist": {
    "value": 80,
    "unit": "cm"
  },
  "hips": {
    "value": 95,
    "unit": "cm"
  },
  "arms": {
    "value": 30,
    "unit": "cm"
  },
  "thighs": {
    "value": 55,
    "unit": "cm"
  },
  "bodyFat": {
    "value": 15,
    "unit": "%"
  },
  "notes": "Complete body measurements"
}
```

#### Step Tracker
**POST** `/v1/trackers/step`

**Request Body:**
```json
{
  "steps": 8500,
  "goal": 10000,
  "distance": {
    "value": 6.8,
    "unit": "km"
  },
  "calories": 425,
  "activeTime": 45,
  "notes": "Good walking day"
}
```

#### Sleep Tracker
**POST** `/v1/trackers/sleep`

**Request Body:**
```json
{
  "sleepRate": 85,
  "sleepTime": 450,
  "hoursSlept": 7.5,
  "bedtime": "22:30",
  "wakeUpTime": "06:00",
  "goal": 8,
  "notes": "Good quality sleep"
}
```

### 4. Update Entry
**PUT** `/v1/trackers/:trackerType/:entryId`

**Parameters:**
- `trackerType`: One of: weight, water, mood, temperature, fat, bmi, bodyStatus, step, sleep
- `entryId`: The ID of the entry to update

**Request Body:** Same as the corresponding POST endpoint

### 5. Delete Entry
**DELETE** `/v1/trackers/:trackerType/:entryId`

**Parameters:**
- `trackerType`: One of: weight, water, mood, temperature, fat, bmi, bodyStatus, step, sleep
- `entryId`: The ID of the entry to delete

---

## Error Responses

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Validation error",
  "details": [
    {
      "field": "currentWeight.value",
      "message": "\"currentWeight.value\" must be a number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Entry not found"
}
```

### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Internal server error"
}
```

---

## Automatic Tracker Creation

When a new user registers, the system automatically creates initial tracker entries for all tracker types. This ensures that every user has a complete set of trackers from the moment they join.

---

## Data Validation Rules

### Weight Tracker
- `currentWeight.value`: Required number
- `currentWeight.unit`: Must be 'kg' or 'lbs'
- `goalWeight.value`: Required number
- `goalWeight.unit`: Must be 'kg' or 'lbs'

### Water Tracker
- `targetGlasses`: Number between 1-20
- `targetMl`: Number between 500-5000
- `totalIntake`: Number >= 0

### Mood Tracker
- `mood`: Must be one of the predefined mood values
- `note`: Maximum 500 characters

### Temperature Tracker
- `temperature.value`: Required number
- `temperature.unit`: Must be 'F' or 'C'

### Fat Tracker
- `age`: Number between 1-120
- `gender`: Must be 'Male', 'Female', or 'Other'
- `bodyFat.value`: Number between 0-100

### BMI Tracker
- `age`: Number between 1-120
- `gender`: Must be 'Male', 'Female', or 'Other'

### Body Status Tracker
- All measurement values must be positive numbers
- Units must be valid for each measurement type

### Step Tracker
- `steps`: Number between 0-100000
- `goal`: Number between 1000-50000

### Sleep Tracker
- `hoursSlept`: Number between 0-24
- `goal`: Number between 1-24
- `bedtime` and `wakeUpTime`: Must be in HH:MM format 