# Thyroid Assessment API Documentation

## Overview

The Thyroid Assessment API provides comprehensive thyroid health evaluation through 20 detailed questions covering symptoms, medical history, and risk factors. The system automatically calculates risk levels and provides personalized recommendations.

## Base URL
```
https://your-api-domain.com/api/v1/thyroid-assessment
```

## Authentication
Most endpoints require JWT token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Data Model

### Assessment Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `userId` | ObjectId | Reference to user | Yes |
| `assessmentDate` | Date | Assessment completion date | Auto |
| `answers` | Object | User responses to 20 questions | Yes |
| `scores` | Object | Individual question scores | Auto |
| `totalScore` | Number | Sum of all scores (0-20) | Auto |
| `riskLevel` | String | Risk category (Low/Moderate/High) | Auto |
| `riskDescription` | String | Detailed risk explanation | Auto |
| `recommendations` | Array | Personalized recommendations | Auto |
| `isCompleted` | Boolean | Assessment completion status | Auto |

### Question Fields

#### Q1. Bowel Movements
- **Field**: `bowelMovements`
- **Options**: `['Regular', 'Irregular', 'Urge of defecation just after eating', 'Constipated (>3 days)', 'Diarrhea']`
- **Score Range**: 0-2

#### Q2. Acidity (Burning Sensation)
- **Field**: `acidity`
- **Options**: `['Yes', 'No', 'Sometimes']`
- **Score Range**: 0-1

#### Q3. Intolerance to Heat
- **Field**: `heatIntolerance`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-1

#### Q4. Sudden (Unexplained) Weight Issues
- **Field**: `weightIssues`
- **Options**: `['Weight Gain', 'Weight Loss']`
- **Score Range**: 0-1

#### Q5. Sensitivity to Cold
- **Field**: `coldSensitivity`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-1

#### Q6. Appetite
- **Field**: `appetite`
- **Options**: `['Increased', 'Low', 'Regular']`
- **Score Range**: 0-1

#### Q7. Morning Joint Stiffness
- **Field**: `jointStiffness`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-1

#### Q8. Puffy Face / Swollen Eyes
- **Field**: `facialSwelling`
- **Options**: `['Yes', 'Sometimes', 'No']`
- **Score Range**: 0-1

#### Q9. Anxiety / Heart Palpitations
- **Field**: `anxiety`
- **Options**: `['Yes', 'No', 'Stress Induced']`
- **Score Range**: 0-1

#### Q10. Sleep Pattern
- **Field**: `sleepPattern`
- **Options**: `['7–8 hrs', 'Disturbed Sleep Pattern', 'Difficulty in Sleeping']`
- **Score Range**: 0-1

#### Q11. Dry Skin / Hair
- **Field**: `drySkinHair`
- **Options**: `['Extremely Dry', 'Normal']`
- **Score Range**: 0-1

#### Q12. Nails
- **Field**: `nails`
- **Options**: `['Brittle', 'Healthy']`
- **Score Range**: 0-1

#### Q13. Sweating
- **Field**: `sweating`
- **Options**: `['Extreme', 'Normal', 'Absent']`
- **Score Range**: 0-1

#### Q14. Hoarseness in Voice
- **Field**: `voiceHoarseness`
- **Options**: `['Present', 'Absent']`
- **Score Range**: 0-1

#### Q15. Past Illness (multi-select)
- **Field**: `pastIllness`
- **Options**: `['Diabetes', 'Hypertension', 'Other']`
- **Additional Field**: `pastIllnessOther` (string, max 500 chars)
- **Score Range**: 0-2

#### Q16. Family History of Thyroid (multi-select)
- **Field**: `familyHistory`
- **Options**: `['Mother', 'Father', 'Maternal Family', 'Paternal Family', 'None']`
- **Score Range**: 0-1

#### Q17. Thyroid Profile Checked?
- **Field**: `thyroidProfileChecked`
- **Options**: `['Yes (share reports)', 'No']`
- **Score Range**: 0-1

#### Q18. Hair Fall / Eyebrow Thinning
- **Field**: `hairThinning`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-1

#### Q19. Heart Rate
- **Field**: `heartRate`
- **Options**: `['Too slow', 'Too fast', 'Normal']`
- **Score Range**: 0-1

#### Q20. Neck Swelling or Pressure
- **Field**: `neckSwelling`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-1

## API Endpoints

### 1. Get Assessment Questions
**GET** `/questions`

Get all thyroid assessment questions and options (public endpoint).

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
      }
    ]
  }
}
```

### 2. Create Assessment
**POST** `/`

Create a new thyroid assessment.

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
      "answers": { /* all answers */ },
      "scores": {
        "bowelMovementsScore": 0,
        "acidityScore": 0,
        "heatIntoleranceScore": 0,
        "weightIssuesScore": 1,
        "coldSensitivityScore": 1,
        "appetiteScore": 1,
        "jointStiffnessScore": 1,
        "facialSwellingScore": 0,
        "anxietyScore": 0,
        "sleepPatternScore": 0,
        "drySkinHairScore": 0,
        "nailsScore": 0,
        "sweatingScore": 0,
        "voiceHoarsenessScore": 0,
        "pastIllnessScore": 1,
        "familyHistoryScore": 0,
        "thyroidProfileCheckedScore": 0,
        "hairThinningScore": 0,
        "heartRateScore": 0,
        "neckSwellingScore": 0
      },
      "totalScore": 5,
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

Get the most recent assessment for the authenticated user.

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "assessmentDate": "2024-01-15T10:30:00.000Z",
      "totalScore": 5,
      "riskLevel": "Moderate",
      "riskDescription": "Moderate risk of thyroid dysfunction. Further evaluation recommended.",
      "recommendations": [ /* array of recommendations */ ]
    }
  }
}
```

### 4. Get Assessment History
**GET** `/history?page=1&limit=10&riskLevel=Moderate`

Get paginated assessment history with optional filtering.

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
        "totalScore": 5,
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

**Response:** Same format as Create Assessment response

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
      "latestScore": 5,
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

Calculate risk level from answers without saving.

**Request Body:** Same as Create Assessment
**Response:** Same as Create Assessment (without database fields)

### 10. Submit Reassessment
**POST** `/reassessment`

Submit a new assessment (creates a new record).

**Request Body:** Same as Create Assessment
**Response:** Same as Create Assessment

## Risk Level Calculation

### Scoring System
- **Total Score Range**: 0-20
- **Low Risk**: 0-3 points
- **Moderate Risk**: 4-7 points  
- **High Risk**: 8+ points

### Risk Descriptions
- **Low Risk**: "Low risk of thyroid dysfunction. Continue monitoring and maintain healthy lifestyle."
- **Moderate Risk**: "Moderate risk of thyroid dysfunction. Further evaluation recommended."
- **High Risk**: "High risk of thyroid dysfunction. Immediate medical consultation strongly recommended."

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Missing required answers: bowelMovements, acidity"
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

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

## Frontend Integration Examples

### React Hook Example
```javascript
const useThyroidAssessment = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const createAssessment = async (answers) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/thyroid-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      const data = await response.json();
      setAssessment(data.data.assessment);
    } catch (error) {
      console.error('Error creating assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  return { assessment, loading, createAssessment };
};
```

### Form Validation Example
```javascript
const validateAnswers = (answers) => {
  const required = [
    'bowelMovements', 'acidity', 'heatIntolerance', 'weightIssues',
    'coldSensitivity', 'appetite', 'jointStiffness', 'facialSwelling',
    'anxiety', 'sleepPattern', 'drySkinHair', 'nails', 'sweating',
    'voiceHoarseness', 'pastIllness', 'familyHistory', 
    'thyroidProfileChecked', 'hairThinning', 'heartRate', 'neckSwelling'
  ];
  
  const missing = required.filter(field => !answers[field]);
  return missing.length === 0 ? null : `Missing: ${missing.join(', ')}`;
};
```
