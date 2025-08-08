# Thyroid Assessment API Documentation

## Overview

The Thyroid Assessment API provides endpoints for managing thyroid health assessments. This system helps users evaluate their thyroid function based on 20 comprehensive questions covering various symptoms and risk factors.

## Base URL

```
https://your-api-domain.com/api/v1/thyroid-assessment
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Assessment Questions

**GET** `/questions`

Get all thyroid assessment questions and their options.

**Response:**
```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "Bowel Movements",
        "options": [
          "Regular",
          "Irregular", 
          "Urge of defecation just after eating",
          "Constipated (>3 days)",
          "Diarrhea"
        ],
        "type": "single_select",
        "tag": "bowel_movements"
      },
      {
        "id": 2,
        "question": "Acidity (Burning Sensation)",
        "options": ["Yes", "No", "Sometimes"],
        "type": "single_select",
        "tag": "acidity"
      }
      // ... 18 more questions
    ]
  }
}
```

### 2. Create Assessment

**POST** `/`

Create a new thyroid assessment for the authenticated user.

**Request Body:**
```json
{
  "answers": {
    "bowelMovements": "Regular",
    "acidity": "No",
    "heatIntolerance": "No",
    "weightIssues": "Weight Gain",
    "coldSensitivity": "Yes",
    "appetite": "Low",
    "jointStiffness": "Yes",
    "facialSwelling": "Sometimes",
    "anxiety": "No",
    "sleepPattern": "7–8 hrs",
    "drySkinHair": "Normal",
    "nails": "Healthy",
    "sweating": "Normal",
    "voiceHoarseness": "Absent",
    "pastIllness": ["Diabetes"],
    "pastIllnessOther": "",
    "familyHistory": ["None"],
    "thyroidProfileChecked": "No",
    "hairThinning": "No",
    "heartRate": "Normal",
    "neckSwelling": "No"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "assessmentDate": "2024-01-15T10:30:00.000Z",
      "answers": {
        "bowelMovements": "Regular",
        "acidity": "No",
        // ... all answers
      },
      "scores": {
        "bowelMovementsScore": 0,
        "acidityScore": 0,
        // ... all scores
      },
      "totalScore": 4,
      "riskLevel": "Moderate",
      "riskDescription": "Moderate risk of thyroid dysfunction. Further evaluation recommended.",
      "recommendations": [
        "Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)",
        "Consult with healthcare provider",
        "Monitor symptoms closely",
        "Consider lifestyle modifications"
      ],
      "isCompleted": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 3. Get Latest Assessment

**GET** `/latest`

Get the most recent thyroid assessment for the authenticated user.

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "assessmentDate": "2024-01-15T10:30:00.000Z",
      "totalScore": 4,
      "riskLevel": "Moderate",
      "riskDescription": "Moderate risk of thyroid dysfunction. Further evaluation recommended.",
      "recommendations": [
        "Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)",
        "Consult with healthcare provider"
      ]
    }
  }
}
```

### 4. Get Assessment History

**GET** `/history?page=1&limit=10&riskLevel=Moderate`

Get paginated assessment history with optional filtering by risk level.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `riskLevel` (optional): Filter by risk level (Low, Moderate, High)

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessments": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "assessmentDate": "2024-01-15T10:30:00.000Z",
        "totalScore": 4,
        "riskLevel": "Moderate"
      }
    ],
    "totalPages": 2,
    "currentPage": 1,
    "total": 15
  }
}
```

### 5. Get Assessment by ID

**GET** `/:assessmentId`

Get a specific assessment by its ID.

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "assessmentDate": "2024-01-15T10:30:00.000Z",
      "answers": {
        // ... all answers
      },
      "scores": {
        // ... all scores
      },
      "totalScore": 4,
      "riskLevel": "Moderate",
      "riskDescription": "Moderate risk of thyroid dysfunction. Further evaluation recommended.",
      "recommendations": [
        "Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)",
        "Consult with healthcare provider"
      ]
    }
  }
}
```

### 6. Update Assessment

**PUT** `/:assessmentId`

Update an existing assessment.

**Request Body:** Same as Create Assessment

**Response:** Same as Create Assessment

### 7. Delete Assessment

**DELETE** `/:assessmentId`

Delete an assessment.

**Response:**
```json
{
  "status": "success",
  "data": null
}
```

### 8. Get Assessment Statistics

**GET** `/stats`

Get statistics for the authenticated user's assessments.

**Response:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalAssessments": 5,
      "averageScore": 3.8,
      "latestScore": 4,
      "latestRiskLevel": "Moderate"
    },
    "riskDistribution": [
      {
        "_id": "Low",
        "count": 2
      },
      {
        "_id": "Moderate",
        "count": 2
      },
      {
        "_id": "High",
        "count": 1
      }
    ]
  }
}
```

### 9. Calculate Risk Level (Preview)

**POST** `/calculate-risk`

Calculate risk level from answers without saving the assessment.

**Request Body:** Same as Create Assessment

**Response:**
```json
{
  "status": "success",
  "data": {
    "scores": {
      "bowelMovementsScore": 0,
      "acidityScore": 0,
      // ... all scores
    },
    "totalScore": 4,
    "riskLevel": "Moderate",
    "riskDescription": "Moderate risk of thyroid dysfunction. Further evaluation recommended.",
    "recommendations": [
      "Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)",
      "Consult with healthcare provider"
    ]
  }
}
```

### 10. Submit Reassessment

**POST** `/reassessment`

Submit a new assessment (creates a new record).

**Request Body:** Same as Create Assessment

**Response:** Same as Create Assessment

## Scoring System

The thyroid assessment uses a comprehensive scoring system based on 20 questions:

### Question Scoring:

1. **Bowel Movements:**
   - Regular: 0 pts
   - Irregular: 1 pt
   - Urge of defecation just after eating: 1 pt
   - Constipated (>3 days): 2 pts
   - Diarrhea: 1 pt

2. **Acidity:** Yes = 1 pt, No/Sometimes = 0 pts
3. **Heat Intolerance:** Yes = 1 pt, No = 0 pts
4. **Weight Issues:** Any weight change = 1 pt
5. **Cold Sensitivity:** Yes = 1 pt, No = 0 pts
6. **Appetite:** Increased/Low = 1 pt, Regular = 0 pts
7. **Joint Stiffness:** Yes = 1 pt, No = 0 pts
8. **Facial Swelling:** Yes = 1 pt, Sometimes = 0.5 pt, No = 0 pts
9. **Anxiety:** Yes = 1 pt, No/Stress Induced = 0 pts
10. **Sleep Pattern:** Disturbed/Difficulty = 1 pt, Normal = 0 pts
11. **Dry Skin/Hair:** Extremely Dry = 1 pt, Normal = 0 pts
12. **Nails:** Brittle = 1 pt, Healthy = 0 pts
13. **Sweating:** Extreme/Absent = 1 pt, Normal = 0 pts
14. **Voice Hoarseness:** Present = 1 pt, Absent = 0 pts
15. **Past Illness:** Number of conditions (max 2 pts)
16. **Family History:** Any family history = 1 pt, None = 0 pts
17. **Thyroid Profile Checked:** No = 1 pt, Yes = 0 pts
18. **Hair Thinning:** Yes = 1 pt, No = 0 pts
19. **Heart Rate:** Too slow/Too fast = 1 pt, Normal = 0 pts
20. **Neck Swelling:** Yes = 1 pt, No = 0 pts

### Risk Level Classification:

- **0-3 points:** Low Risk
  - Monitor, retake after 3 months
- **4-6 points:** Moderate Risk
  - Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)
- **≥7 points:** High Risk
  - Strongly recommend endocrinologist consult + labs

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Answers are required"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Please authenticate"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Assessment not found"
}
```

### 422 Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "details": [
    {
      "field": "answers.bowelMovements",
      "message": "Invalid bowel movements option"
    }
  ]
}
```

## Usage Examples

### Complete Assessment Flow

1. **Get Questions:**
   ```bash
   curl -X GET "https://your-api-domain.com/api/v1/thyroid-assessment/questions"
   ```

2. **Create Assessment:**
   ```bash
   curl -X POST "https://your-api-domain.com/api/v1/thyroid-assessment/" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "answers": {
         "bowelMovements": "Regular",
         "acidity": "No",
         "heatIntolerance": "No",
         "weightIssues": "Weight Gain",
         "coldSensitivity": "Yes",
         "appetite": "Low",
         "jointStiffness": "Yes",
         "facialSwelling": "Sometimes",
         "anxiety": "No",
         "sleepPattern": "7–8 hrs",
         "drySkinHair": "Normal",
         "nails": "Healthy",
         "sweating": "Normal",
         "voiceHoarseness": "Absent",
         "pastIllness": ["Diabetes"],
         "pastIllnessOther": "",
         "familyHistory": ["None"],
         "thyroidProfileChecked": "No",
         "hairThinning": "No",
         "heartRate": "Normal",
         "neckSwelling": "No"
       }
     }'
   ```

3. **Get Latest Results:**
   ```bash
   curl -X GET "https://your-api-domain.com/api/v1/thyroid-assessment/latest" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Data Model

### ThyroidAssessment Schema

```javascript
{
  userId: ObjectId,           // Reference to User
  assessmentDate: Date,       // Assessment completion date
  answers: {
    bowelMovements: String,   // Enum: ['Regular', 'Irregular', ...]
    acidity: String,          // Enum: ['Yes', 'No', 'Sometimes']
    heatIntolerance: String,  // Enum: ['Yes', 'No']
    weightIssues: String,     // Enum: ['Weight Gain', 'Weight Loss']
    coldSensitivity: String,  // Enum: ['Yes', 'No']
    appetite: String,         // Enum: ['Increased', 'Low', 'Regular']
    jointStiffness: String,   // Enum: ['Yes', 'No']
    facialSwelling: String,   // Enum: ['Yes', 'Sometimes', 'No']
    anxiety: String,          // Enum: ['Yes', 'No', 'Stress Induced']
    sleepPattern: String,     // Enum: ['7–8 hrs', 'Disturbed Sleep Pattern', 'Difficulty in Sleeping']
    drySkinHair: String,      // Enum: ['Extremely Dry', 'Normal']
    nails: String,            // Enum: ['Brittle', 'Healthy']
    sweating: String,         // Enum: ['Extreme', 'Normal', 'Absent']
    voiceHoarseness: String,  // Enum: ['Present', 'Absent']
    pastIllness: [String],    // Array of selected illnesses
    pastIllnessOther: String, // Optional text for other illnesses
    familyHistory: [String],  // Array of family members
    thyroidProfileChecked: String, // Enum: ['Yes (share reports)', 'No']
    hairThinning: String,     // Enum: ['Yes', 'No']
    heartRate: String,        // Enum: ['Too slow', 'Too fast', 'Normal']
    neckSwelling: String      // Enum: ['Yes', 'No']
  },
  scores: {
    bowelMovementsScore: Number,
    acidityScore: Number,
    // ... individual scores for each question
  },
  totalScore: Number,         // Sum of all scores (0-20)
  riskLevel: String,          // Enum: ['Low', 'Moderate', 'High']
  riskDescription: String,    // Detailed risk description
  recommendations: [String],  // Array of recommendations
  isCompleted: Boolean,       // Always true for completed assessments
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

1. **Authentication Required:** All endpoints except `/questions` require valid JWT authentication
2. **User Isolation:** Users can only access their own assessments
3. **Input Validation:** All inputs are validated using Joi schemas
4. **Rate Limiting:** Consider implementing rate limiting for assessment creation
5. **Data Privacy:** Assessment data contains sensitive health information

## Sample Test Data

### Low Risk Assessment
```json
{
  "answers": {
    "bowelMovements": "Regular",
    "acidity": "No",
    "heatIntolerance": "No",
    "weightIssues": "Weight Gain",
    "coldSensitivity": "No",
    "appetite": "Regular",
    "jointStiffness": "No",
    "facialSwelling": "No",
    "anxiety": "No",
    "sleepPattern": "7–8 hrs",
    "drySkinHair": "Normal",
    "nails": "Healthy",
    "sweating": "Normal",
    "voiceHoarseness": "Absent",
    "pastIllness": [],
    "pastIllnessOther": "",
    "familyHistory": ["None"],
    "thyroidProfileChecked": "Yes (share reports)",
    "hairThinning": "No",
    "heartRate": "Normal",
    "neckSwelling": "No"
  }
}
```

### High Risk Assessment
```json
{
  "answers": {
    "bowelMovements": "Constipated (>3 days)",
    "acidity": "Yes",
    "heatIntolerance": "Yes",
    "weightIssues": "Weight Gain",
    "coldSensitivity": "Yes",
    "appetite": "Low",
    "jointStiffness": "Yes",
    "facialSwelling": "Yes",
    "anxiety": "Yes",
    "sleepPattern": "Difficulty in Sleeping",
    "drySkinHair": "Extremely Dry",
    "nails": "Brittle",
    "sweating": "Absent",
    "voiceHoarseness": "Present",
    "pastIllness": ["Diabetes", "Hypertension"],
    "pastIllnessOther": "",
    "familyHistory": ["Mother", "Father"],
    "thyroidProfileChecked": "No",
    "hairThinning": "Yes",
    "heartRate": "Too slow",
    "neckSwelling": "Yes"
  }
}
```

## Health Overview Documentation

For health overview documentation, the answers are structured separately to allow easy access and reporting:

### Answer Structure for Documentation:
```json
{
  "healthOverview": {
    "digestiveSymptoms": {
      "bowelMovements": "Regular",
      "acidity": "No"
    },
    "metabolicSymptoms": {
      "heatIntolerance": "No",
      "weightIssues": "Weight Gain",
      "coldSensitivity": "No",
      "appetite": "Regular",
      "sweating": "Normal"
    },
    "physicalSymptoms": {
      "jointStiffness": "No",
      "facialSwelling": "No",
      "drySkinHair": "Normal",
      "nails": "Healthy",
      "voiceHoarseness": "Absent",
      "hairThinning": "No",
      "neckSwelling": "No"
    },
    "psychologicalSymptoms": {
      "anxiety": "No",
      "sleepPattern": "7–8 hrs"
    },
    "cardiovascularSymptoms": {
      "heartRate": "Normal"
    },
    "medicalHistory": {
      "pastIllness": [],
      "familyHistory": ["None"],
      "thyroidProfileChecked": "Yes (share reports)"
    }
  }
}
```

This structure allows for easy categorization and reporting of symptoms for health overview documentation purposes.
