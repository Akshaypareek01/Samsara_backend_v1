# PCOS Assessment API Documentation

## Overview

The PCOS Assessment API provides comprehensive Polycystic Ovary Syndrome (PCOS/PCOD) risk evaluation through 15 detailed questions covering menstrual health, symptoms, and risk factors. The system automatically calculates risk levels and provides personalized recommendations.

## Base URL
```
https://your-api-domain.com/api/v1/pcos-assessment
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
| `answers` | Object | User responses to 15 questions | Yes |
| `scores` | Object | Individual question scores | Auto |
| `totalScore` | Number | Sum of all scores (0-25) | Auto |
| `riskLevel` | String | Risk category (Low risk/Moderate risk/High risk) | Auto |
| `riskDescription` | String | Detailed risk explanation | Auto |
| `recommendations` | Array | Personalized recommendations | Auto |
| `cycleLength` | Number | Calculated menstrual cycle length | Auto |
| `isCompleted` | Boolean | Assessment completion status | Auto |

### Question Fields

#### Q1. Last Menstrual Period
- **Field**: `lastCycleDate`
- **Type**: Date
- **Description**: Date of last menstrual period
- **Score Range**: Used for cycle length calculation

#### Q2. Menstrual Cycle Regularity
- **Field**: `cycleRegularity`
- **Options**: `['Regular', 'Irregular']`
- **Score Range**: 0-2

#### Q3. Period Duration
- **Field**: `periodDuration`
- **Options**: `['1-2 days', '3-5 days', '5-7 days', '7+ days']`
- **Score Range**: 0-2

#### Q4. Menstrual Flow
- **Field**: `menstrualFlow`
- **Options**: `['Normal', 'Scanty', 'Heavy']`
- **Score Range**: 0-2

#### Q5. Menstrual Blood Color
- **Field**: `bloodColor`
- **Options**: `['Bright red', 'Brown-Blackish', 'Initially brown then red']`
- **Score Range**: 0-1

#### Q6. Facial Hair (Hirsutism)
- **Field**: `facialHair`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-3

#### Q7. Weight Gain
- **Field**: `weightGain`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-2

#### Q8. Food Cravings
- **Field**: `foodCravings`
- **Type**: String (free text)
- **Description**: Type of food cravings
- **Score Range**: 0-1

#### Q9. History of Hormonal Medications
- **Field**: `hormonalMedications`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-2

#### Q10. Period Pain
- **Field**: `periodPain`
- **Options**: `['Absent', 'Bearable', 'Unbearable']`
- **Score Range**: 0-2

#### Q11. Facial Acne
- **Field**: `facialAcne`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-2

#### Q12. Low Libido
- **Field**: `lowLibido`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-1

#### Q13. Hair Thinning / Hair Loss
- **Field**: `hairLoss`
- **Options**: `['Excess', 'Normal', 'Absent']`
- **Score Range**: 0-2

#### Q14. Dark Skin Patches
- **Field**: `darkSkinPatches`
- **Options**: `['Yes', 'No']`
- **Score Range**: 0-3

#### Q15. Difficulty Conceiving
- **Field**: `difficultyConceiving`
- **Options**: `['Never conceived', 'Conceived once, then failure', 'Second conception failed', 'Other']`
- **Score Range**: 0-3

## API Endpoints

### 1. Get Assessment Questions
**GET** `/questions`

Get all PCOS assessment questions and options (public endpoint).

**Response:**
```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "When was your last menstrual period?",
        "type": "date",
        "tag": "last_cycle_date",
        "description": "This helps calculate cycle length and irregularity"
      },
      {
        "id": 2,
        "question": "How is your Menstrual Cycle?",
        "type": "select",
        "options": [
          { "value": "Regular", "score": 0, "tag": "regular_cycle" },
          { "value": "Irregular", "score": 2, "tag": "cycle_irregular" }
        ]
      }
    ]
  }
}
```

### 2. Create Assessment
**POST** `/`

Create a new PCOS assessment.

**Request Body:**
```json
{
  "answers": {
    "lastCycleDate": "2024-01-01T00:00:00.000Z",
    "cycleRegularity": "Irregular",
    "periodDuration": "5-7 days",
    "menstrualFlow": "Heavy",
    "bloodColor": "Brown-Blackish",
    "facialHair": "Yes",
    "weightGain": "Yes",
    "foodCravings": "Sweet foods",
    "hormonalMedications": "Yes",
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
  "message": "PCOS assessment created successfully",
  "data": {
    "assessment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "assessmentDate": "2024-01-15T10:30:00.000Z",
      "answers": { /* all answers */ },
      "scores": {
        "cycleIrregularityScore": 2,
        "periodDurationScore": 2,
        "menstrualFlowScore": 2,
        "bloodColorScore": 1,
        "facialHairScore": 3,
        "weightGainScore": 2,
        "foodCravingsScore": 1,
        "hormonalMedicationsScore": 2,
        "periodPainScore": 2,
        "facialAcneScore": 2,
        "lowLibidoScore": 1,
        "hairLossScore": 2,
        "darkSkinPatchesScore": 3,
        "difficultyConceivingScore": 0
      },
      "totalScore": 23,
      "riskLevel": "High risk",
      "riskDescription": "Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.",
      "recommendations": [
        "Consult with a gynecologist or endocrinologist",
        "Get hormonal profile tests (FSH, LH, Testosterone, AMH)",
        "Consider ultrasound for ovarian cysts",
        "Lifestyle modifications: diet and exercise",
        "Monitor blood sugar levels"
      ],
      "cycleLength": 35,
      "isCompleted": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "summary": {
      "totalScore": 23,
      "riskLevel": "High risk",
      "riskDescription": "Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.",
      "recommendations": [ /* array of recommendations */ ],
      "cycleLength": 35
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
      "totalScore": 23,
      "riskLevel": "High risk",
      "riskDescription": "Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.",
      "recommendations": [ /* array of recommendations */ ],
      "cycleLength": 35
    },
    "summary": {
      "totalScore": 23,
      "riskLevel": "High risk",
      "riskDescription": "Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.",
      "recommendations": [ /* array of recommendations */ ],
      "cycleLength": 35
    }
  }
}
```

### 4. Get Assessment History
**GET** `/history?page=1&limit=10&riskLevel=High%20risk`

Get paginated assessment history with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `riskLevel` (optional): Filter by risk level ("Low risk", "Moderate risk", "High risk")

**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "assessmentDate": "2024-01-15T10:30:00.000Z",
        "totalScore": 23,
        "riskLevel": "High risk",
        "cycleLength": 35
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "totalResults": 25,
    "hasNextPage": true,
    "hasPrevPage": false
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
  "message": "Assessment deleted successfully"
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
      "averageScore": 15.2,
      "latestScore": 23,
      "latestRiskLevel": "High risk",
      "averageCycleLength": 32.5
    },
    "riskDistribution": [
      {
        "_id": "Low risk",
        "count": 1
      },
      {
        "_id": "Moderate risk",
        "count": 2
      },
      {
        "_id": "High risk",
        "count": 2
      }
    ]
  }
}
```

### 9. Submit Reassessment
**POST** `/reassessment`

Submit a new assessment (creates a new record).

**Request Body:** Same as Create Assessment
**Response:** Same as Create Assessment

### 10. Calculate Risk Level (Preview)
**POST** `/calculate-risk`

Calculate risk level from answers without saving.

**Request Body:** Same as Create Assessment
**Response:** Same as Create Assessment (without database fields)

## Risk Level Calculation

### Scoring System
- **Total Score Range**: 0-25
- **Low Risk**: 0-8 points
- **Moderate Risk**: 9-16 points  
- **High Risk**: 17+ points

### Risk Descriptions
- **Low Risk**: "Low risk of PCOS/PCOD. Continue monitoring and maintain healthy lifestyle."
- **Moderate Risk**: "Moderate risk of PCOS/PCOD. Consider consulting with healthcare provider."
- **High Risk**: "High risk of PCOS/PCOD. Immediate medical consultation is recommended."

### Cycle Length Calculation
The system calculates menstrual cycle length based on the last cycle date and current date:
- **Regular cycles**: 21-35 days
- **Irregular cycles**: <21 or >35 days

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Missing required answers: lastCycleDate, cycleRegularity"
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
const usePcosAssessment = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const createAssessment = async (answers) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/pcos-assessment', {
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
    'lastCycleDate', 'cycleRegularity', 'periodDuration', 'menstrualFlow',
    'bloodColor', 'facialHair', 'weightGain', 'foodCravings', 'hormonalMedications',
    'periodPain', 'facialAcne', 'lowLibido', 'hairLoss', 'darkSkinPatches', 'difficultyConceiving'
  ];
  
  const missing = required.filter(field => !answers[field]);
  return missing.length === 0 ? null : `Missing: ${missing.join(', ')}`;
};
```

### Date Validation Example
```javascript
const validateLastCycleDate = (date) => {
  const lastCycle = new Date(date);
  const today = new Date();
  const diffTime = Math.abs(today - lastCycle);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    return 'Last cycle date cannot be more than 1 year ago';
  }
  
  if (lastCycle > today) {
    return 'Last cycle date cannot be in the future';
  }
  
  return null;
};
```

### Risk Level Display Component
```javascript
const RiskLevelDisplay = ({ riskLevel, totalScore }) => {
  const getRiskColor = (level) => {
    switch (level) {
      case 'Low risk': return 'green';
      case 'Moderate risk': return 'orange';
      case 'High risk': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className={`risk-level risk-${getRiskColor(riskLevel)}`}>
      <h3>Risk Level: {riskLevel}</h3>
      <p>Total Score: {totalScore}/25</p>
    </div>
  );
};
```
