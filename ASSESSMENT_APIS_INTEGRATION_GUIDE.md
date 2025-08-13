# Assessment APIs Integration Guide

This document provides comprehensive integration details for all assessment APIs in the Samsara backend system.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Thyroid Assessment APIs

### 1.1 Get Assessment Questions (Public)
**GET** `/thyroid-assessment/questions`

**Description:** Retrieves all thyroid assessment questions and their answer options.

**Response:**
```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "field": "bowelMovements",
        "options": ["Regular", "Irregular", "Urge of defecation just after eating", "Constipated (>3 days)", "Diarrhea"]
      },
      {
        "field": "acidity",
        "options": ["Yes", "No", "Sometimes"]
      }
      // ... more questions
    ]
  }
}
```

### 1.2 Calculate Risk Level (Public)
**POST** `/thyroid-assessment/calculate-risk`

**Description:** Calculates risk level without saving the assessment.

**Request Body:**
```json
{
  "answers": {
    "bowelMovements": "Regular",
    "acidity": "No",
    "heatIntolerance": "Yes",
    "weightIssues": "Weight Gain",
    "coldSensitivity": "No",
    "appetite": "Increased",
    "jointStiffness": "Yes",
    "facialSwelling": "Sometimes",
    "anxiety": "Yes",
    "sleepPattern": "Disturbed Sleep Pattern",
    "drySkinHair": "Extremely Dry",
    "nails": "Brittle",
    "sweating": "Extreme",
    "voiceHoarseness": "Present",
    "pastIllness": ["Diabetes", "Hypertension"],
    "pastIllnessOther": "Additional details if needed",
    "familyHistory": ["Mother", "Maternal Family"],
    "thyroidProfileChecked": "Yes (share reports)",
    "hairThinning": "Yes",
    "heartRate": "Too fast",
    "neckSwelling": "Yes"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "riskLevel": "High",
    "score": 85,
    "recommendations": ["Consult a doctor", "Get thyroid profile checked"]
  }
}
```

### 1.3 Create Assessment (Protected)
**POST** `/thyroid-assessment/`

**Description:** Creates a new thyroid assessment for the authenticated user.

**Request Body:** Same as calculate-risk endpoint.

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "assessment_id",
      "userId": "user_id",
      "answers": { /* answers object */ },
      "riskLevel": "High",
      "score": 85,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 1.4 Get Latest Assessment (Protected)
**GET** `/thyroid-assessment/latest`

**Description:** Retrieves the most recent assessment for the authenticated user.

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "assessment_id",
      "userId": "user_id",
      "answers": { /* answers object */ },
      "riskLevel": "High",
      "score": 85,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 1.5 Get Assessment History (Protected)
**GET** `/thyroid-assessment/history?page=1&limit=10&riskLevel=High`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `riskLevel` (optional): Filter by risk level ("Low", "Moderate", "High")

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessments": [
      {
        "_id": "assessment_id",
        "riskLevel": "High",
        "score": 85,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 1.6 Get Assessment Statistics (Protected)
**GET** `/thyroid-assessment/stats`

**Description:** Retrieves assessment statistics for the authenticated user.

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalAssessments": 25,
    "averageScore": 72.5,
    "riskLevelDistribution": {
      "Low": 8,
      "Moderate": 12,
      "High": 5
    },
    "lastAssessmentDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.7 Submit Reassessment (Protected)
**POST** `/thyroid-assessment/reassessment`

**Description:** Creates a new assessment (same as create assessment).

**Request Body:** Same as create assessment.

**Response:** Same as create assessment.

### 1.8 Get Assessment by ID (Protected)
**GET** `/thyroid-assessment/:assessmentId`

**Path Parameters:**
- `assessmentId`: MongoDB ObjectId of the assessment

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "assessment_id",
      "userId": "user_id",
      "answers": { /* answers object */ },
      "riskLevel": "High",
      "score": 85,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 1.9 Update Assessment (Protected)
**PUT** `/thyroid-assessment/:assessmentId`

**Path Parameters:**
- `assessmentId`: MongoDB ObjectId of the assessment

**Request Body:** Same as create assessment.

**Response:** Same as create assessment.

### 1.10 Delete Assessment (Protected)
**DELETE** `/thyroid-assessment/:assessmentId`

**Path Parameters:**
- `assessmentId`: MongoDB ObjectId of the assessment

**Response:**
```json
{
  "status": "success",
  "data": null
}
```

---

## 2. Menopause Assessment APIs

### 2.1 Get Assessment Questions (Public)
**GET** `/menopause-assessment/questions`

**Response:**
```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "field": "irregularPeriods",
        "options": ["Yes, frequently", "Sometimes", "Rarely", "No, Never"]
      },
      {
        "field": "fatigue",
        "options": ["Always tired", "Often tired", "Sometimes tired", "Rarely tired"]
      },
      {
        "field": "weightChanges",
        "options": ["Significant weight gain", "Slight weight gain", "Weight remains stable", "Weight loss"]
      },
      {
        "field": "sleepQuality",
        "options": ["Very poor sleep", "Poor sleep", "Average sleep", "Good sleep"]
      },
      {
        "field": "moodSwings",
        "options": ["Very frequently", "Frequently", "Sometimes", "Never"]
      }
    ]
  }
}
```

### 2.2 Calculate Risk Level (Public)
**POST** `/menopause-assessment/calculate-risk`

**Request Body:**
```json
{
  "answers": {
    "irregularPeriods": "Yes, frequently",
    "fatigue": "Always tired",
    "weightChanges": "Significant weight gain",
    "sleepQuality": "Very poor sleep",
    "moodSwings": "Very frequently"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "riskLevel": "High",
    "score": 90,
    "recommendations": ["Consult a gynecologist", "Consider hormone therapy"]
  }
}
```

### 2.3 Create Assessment (Protected)
**POST** `/menopause-assessment/`

**Request Body:** Same as calculate-risk endpoint.

**Response:** Same structure as thyroid assessment.

### 2.4 Get Latest Assessment (Protected)
**GET** `/menopause-assessment/latest`

**Response:** Same structure as thyroid assessment.

### 2.5 Get Assessment History (Protected)
**GET** `/menopause-assessment/history`

**Response:** Same structure as thyroid assessment.

### 2.6 Get Assessment Statistics (Protected)
**GET** `/menopause-assessment/stats`

**Response:** Same structure as thyroid assessment.

### 2.7 Submit Reassessment (Protected)
**POST** `/menopause-assessment/reassessment`

**Request Body:** Same as create assessment.

**Response:** Same structure as thyroid assessment.

### 2.8 Get Assessment by ID (Protected)
**GET** `/menopause-assessment/:assessmentId`

**Response:** Same structure as thyroid assessment.

### 2.9 Update Assessment (Protected)
**PUT** `/menopause-assessment/:assessmentId`

**Request Body:** Same as create assessment.

**Response:** Same structure as thyroid assessment.

### 2.10 Delete Assessment (Protected)
**DELETE** `/menopause-assessment/:assessmentId`

**Response:** Same structure as thyroid assessment.

---

## 3. PCOS Assessment APIs

### 3.1 Get Assessment Questions (Public)
**GET** `/pcos-assessment/questions`

**Response:**
```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "field": "cycleRegularity",
        "options": ["Regular", "Irregular"]
      },
      {
        "field": "periodDuration",
        "options": ["1-2 days", "3-5 days", "5-7 days", "7+ days"]
      },
      {
        "field": "menstrualFlow",
        "options": ["Normal", "Scanty", "Heavy"]
      },
      {
        "field": "bloodColor",
        "options": ["Bright red", "Brown-Blackish", "Initially brown then red"]
      },
      {
        "field": "facialHair",
        "options": ["Yes", "No"]
      },
      {
        "field": "weightGain",
        "options": ["Yes", "No"]
      },
      {
        "field": "hormonalMedications",
        "options": ["Yes", "No"]
      },
      {
        "field": "periodPain",
        "options": ["Absent", "Bearable", "Unbearable"]
      },
      {
        "field": "facialAcne",
        "options": ["Yes", "No"]
      },
      {
        "field": "lowLibido",
        "options": ["Yes", "No"]
      },
      {
        "field": "hairLoss",
        "options": ["Excess", "Normal", "Absent"]
      },
      {
        "field": "darkSkinPatches",
        "options": ["Yes", "No"]
      },
      {
        "field": "difficultyConceiving",
        "options": ["Never conceived", "Conceived once, then failure", "Second conception failed", "Other"]
      }
    ]
  }
}
```

### 3.2 Calculate Risk Level (Public)
**POST** `/pcos-assessment/calculate-risk`

**Request Body:**
```json
{
  "answers": {
    "lastCycleDate": "2024-01-01",
    "cycleRegularity": "Irregular",
    "periodDuration": "5-7 days",
    "menstrualFlow": "Heavy",
    "bloodColor": "Brown-Blackish",
    "facialHair": "Yes",
    "weightGain": "Yes",
    "foodCravings": "High cravings for sweets and carbs",
    "hormonalMedications": "No",
    "periodPain": "Unbearable",
    "facialAcne": "Yes",
    "lowLibido": "Yes",
    "hairLoss": "Excess",
    "darkSkinPatches": "Yes",
    "difficultyConceiving": "Never conceived"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "riskLevel": "High risk",
    "score": 88,
    "recommendations": ["Consult an endocrinologist", "Get hormone profile checked", "Consider lifestyle changes"]
  }
}
```

### 3.3 Create Assessment (Protected)
**POST** `/pcos-assessment/`

**Request Body:** Same as calculate-risk endpoint.

**Response:** Same structure as thyroid assessment.

### 3.4 Get Latest Assessment (Protected)
**GET** `/pcos-assessment/latest`

**Response:** Same structure as thyroid assessment.

### 3.5 Get Assessment History (Protected)
**GET** `/pcos-assessment/history?page=1&limit=10&riskLevel=High%20risk`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `riskLevel` (optional): Filter by risk level ("Low risk", "Moderate risk", "High risk")

**Response:** Same structure as thyroid assessment.

### 3.6 Get Assessment Statistics (Protected)
**GET** `/pcos-assessment/stats`

**Response:** Same structure as thyroid assessment.

### 3.7 Submit Reassessment (Protected)
**POST** `/pcos-assessment/reassessment`

**Request Body:** Same as create assessment.

**Response:** Same structure as thyroid assessment.

### 3.8 Get Assessment by ID (Protected)
**GET** `/pcos-assessment/:assessmentId`

**Response:** Same structure as thyroid assessment.

### 3.9 Update Assessment (Protected)
**PUT** `/pcos-assessment/:assessmentId`

**Request Body:** Same as create assessment.

**Response:** Same structure as thyroid assessment.

### 3.10 Delete Assessment (Protected)
**DELETE** `/pcos-assessment/:assessmentId`

**Response:** Same structure as thyroid assessment.

---

## 4. Frontend Integration Examples

### 4.1 JavaScript/React Example

```javascript
// Authentication setup
const API_BASE = 'http://localhost:3000/api/v1';
const token = localStorage.getItem('jwt_token');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Get questions
const getQuestions = async (assessmentType) => {
  try {
    const response = await fetch(`${API_BASE}/${assessmentType}/questions`);
    const data = await response.json();
    return data.data.questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
  }
};

// Calculate risk
const calculateRisk = async (assessmentType, answers) => {
  try {
    const response = await fetch(`${API_BASE}/${assessmentType}/calculate-risk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers })
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error calculating risk:', error);
  }
};

// Create assessment
const createAssessment = async (assessmentType, answers) => {
  try {
    const response = await fetch(`${API_BASE}/${assessmentType}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers })
    });
    const data = await response.json();
    return data.data.assessment;
  } catch (error) {
    console.error('Error creating assessment:', error);
  }
};

// Get latest assessment
const getLatestAssessment = async (assessmentType) => {
  try {
    const response = await fetch(`${API_BASE}/${assessmentType}/latest`, {
      headers
    });
    const data = await response.json();
    return data.data.assessment;
  } catch (error) {
    console.error('Error fetching latest assessment:', error);
  }
};
```

### 4.2 Error Handling

```javascript
const handleApiError = (error) => {
  if (error.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login';
  } else if (error.status === 400) {
    // Bad request - show validation errors
    console.error('Validation errors:', error.message);
  } else if (error.status === 500) {
    // Server error - show generic error
    console.error('Server error occurred');
  }
};
```

### 4.3 Form Validation

```javascript
const validateAnswers = (answers, assessmentType) => {
  const errors = {};
  
  if (assessmentType === 'thyroid-assessment') {
    if (!answers.bowelMovements) errors.bowelMovements = 'Required';
    if (!answers.acidity) errors.acidity = 'Required';
    // ... validate all required fields
  } else if (assessmentType === 'menopause-assessment') {
    if (!answers.irregularPeriods) errors.irregularPeriods = 'Required';
    if (!answers.fatigue) errors.fatigue = 'Required';
    // ... validate all required fields
  } else if (assessmentType === 'pcos-assessment') {
    if (!answers.lastCycleDate) errors.lastCycleDate = 'Required';
    if (!answers.cycleRegularity) errors.cycleRegularity = 'Required';
    // ... validate all required fields
  }
  
  return errors;
};
```

---

## 5. Common Response Status Codes

- **200**: Success
- **201**: Created
- **204**: No Content (Delete operations)
- **400**: Bad Request (Validation errors)
- **401**: Unauthorized (Missing or invalid token)
- **403**: Forbidden (Insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## 6. Rate Limiting

The APIs implement rate limiting to prevent abuse. Respect the rate limits and implement appropriate retry logic with exponential backoff in your frontend application.

## 7. Testing

Use the provided Postman collections for testing:
- `thyroid_assessment_postman_collection.json`
- `menopause_assessment_postman_collection.json`
- `pcos_assessment_postman_collection.json`

## 8. Support

For technical support or questions about the API integration, refer to the main API documentation or contact the development team.
