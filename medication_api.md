# Medication & Supplement API Guide

This document describes the Medication Tracker API, supporting both Medication and Supplement as categories with identical fields and logic.

---

## 1. Overview

- **Purpose:** Allow users to track medications, supplements, and health conditions, and manage daily medication schedules.
- **User-specific:** Each medication/supplement and health condition is linked to a user (userId), so users can edit/update their own entries.
- **Flexible:** Supports pills, capsules, syrups, injections, custom dosage, frequency, reminders, and more.
- **Unified Model:** Use the `category` field to distinguish between Medication and Supplement.
- **Auto-create:** The MedicationTracker is automatically created for a user if it does not exist when adding a health condition or medication.

---

## 2. Data Model Reference

### MedicationItem (Medication or Supplement)
```js
{
  category: 'Medication' | 'Supplement',
  medicineType: 'Pills' | 'Capsule' | 'Syrup' | 'Injection' | 'Other',
  medicineName: String,
  dosage: {
    quantity: Number,
    unit: String // e.g., mg, ml, IU
  },
  duration: {
    startDate: Date,
    endDate: Date,
    preset: '1 week' | '1 month' | '3 months' | 'Ongoing'
  },
  frequency: 'Daily' | 'Weekly' | 'Custom',
  daysOfWeek: [ 'M', 'T', 'W', 'T', 'F', 'S', 'S' ],
  times: [ { time: String, ampm: 'AM' | 'PM' } ],
  consumptionInstructions: [ 'Before Meals' | 'During Meals' | 'After Meals' | 'Empty Stomach' | 'Before Sleep' ],
  additionalNotes: String,
  reminderNotifications: Boolean,
  isActive: Boolean,
  createdAt: Date
}
```

### HealthCondition
```js
{
  name: String,
  diagnosedYear: Number,
  analysis: String,
  level: 'High' | 'Moderate' | 'Low',
  isActive: Boolean,
  createdAt: Date
}
```

---

## 3. API Endpoints & Sample Postman Requests

### 3.1 Add Medication
- **POST** `/v1/medication/medications`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "category": "Medication",
  "medicineType": "Pills",
  "medicineName": "Paracetamol",
  "dosage": { "quantity": 500, "unit": "mg" },
  "duration": { "startDate": "2024-07-10", "endDate": "2024-07-20", "preset": "1 week" },
  "frequency": "Daily",
  "daysOfWeek": ["M", "T", "W", "T", "F"],
  "times": [ { "time": "08:00", "ampm": "AM" }, { "time": "08:00", "ampm": "PM" } ],
  "consumptionInstructions": ["After Meals"],
  "additionalNotes": "Take with water",
  "reminderNotifications": true
}
```

### 3.2 Add Supplement
- **POST** `/v1/medication/medications`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "category": "Supplement",
  "medicineType": "Capsule",
  "medicineName": "Vitamin D3",
  "dosage": { "quantity": 2000, "unit": "IU" },
  "duration": { "startDate": "2024-07-10", "endDate": "2024-08-10", "preset": "1 month" },
  "frequency": "Daily",
  "daysOfWeek": ["M", "T", "W", "T", "F", "S", "S"],
  "times": [ { "time": "09:00", "ampm": "AM" } ],
  "consumptionInstructions": ["After Meals"],
  "additionalNotes": "Take with breakfast",
  "reminderNotifications": true
}
```

### 3.3 Update Medication/Supplement
- **PATCH** `/v1/medication/medications/:medicationId`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (any updatable fields)
```json
{
  "dosage": { "quantity": 250, "unit": "mg" },
  "frequency": "Weekly",
  "daysOfWeek": ["M", "W", "F"]
}
```

### 3.4 Add Health Condition
- **POST** `/v1/medication/health-conditions`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "name": "Type 2 Diabetes",
  "diagnosedYear": 2020,
  "analysis": "Stable",
  "level": "High",
  "isActive": true
}
```

### 3.5 Get Health Condition by ID
- **GET** `/v1/medication/health-conditions/:conditionId`
- **Headers:** `Authorization: Bearer <token>`

### 3.6 Get Medication by ID
- **GET** `/v1/medication/medications/:medicationId`
- **Headers:** `Authorization: Bearer <token>`

### 3.7 Get Medication Tracker (with category filter)
- **GET** `/v1/medication/tracker?category=Supplement`
- **Headers:** `Authorization: Bearer <token>`

### 3.8 Create Daily Schedule
- **POST** `/v1/medication/schedules`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "date": "2024-07-10",
  "schedule": [
    {
      "time": "08:00",
      "period": "Morning",
      "medications": ["Paracetamol"],
      "isCompleted": false
    },
    {
      "time": "21:00",
      "period": "Night",
      "medications": ["Vitamin D3"],
      "isCompleted": false
    }
  ]
}
```

### 3.9 Get Daily Schedule
- **GET** `/v1/medication/schedules/by-date?date=2024-07-10`
- **Headers:** `Authorization: Bearer <token>`

---

## 4. Notes
- **category** is required for each item and can be either 'Medication' or 'Supplement'.
- **level** is required for health conditions and can be 'High', 'Moderate', or 'Low'.
- **All endpoints require authentication.**
- **You can update or delete individual items by their IDs.**
- **Schedule endpoints allow you to view and update daily medication/supplement plans.**
- **The MedicationTracker is automatically created for a user if it does not exist when adding a health condition or medication.**

---

**Ready to use in Postman!**
- Import these endpoints, set your auth token, and manage both medications and supplements as per the UI! 