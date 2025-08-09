# Menopause Assessment API Documentation

## Overview

The Menopause Assessment API provides comprehensive menopause risk evaluation through 5 key questions covering common menopausal symptoms. The system automatically calculates risk levels and provides personalized recommendations based on a 0-3 scoring scale.

## Base URL
```
https://your-api-domain.com/api/v1/menopause-assessment
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
| `answers` | Object | User responses to 5 questions | Yes |
| `scores` | Object | Individual question scores | Auto |
| `totalScore` | Number | Sum of all scores (0-15) | Auto |
| `averageScore` | Number | Average score (0-3) | Auto |
| `riskLevel` | String | Risk category (Low Risk/Low-Moderate Risk/Moderate Risk/High Risk) | Auto |
| `riskDescription` | String | Detailed risk explanation | Auto |
| `isLatest` | Boolean | Latest assessment flag | Auto |

### Question Fields

#### Q1. Irregular Periods
- **Field**: `irregularPeriods`
- **Options**: `['Yes, frequently', 'Sometimes', 'Rarely', 'No, Never']`
- **Score Range**: 0-3 (higher score = lower risk)
- **Description**: Frequency of irregular menstrual cycles

#### Q2. Fatigue
- **Field**: `fatigue`
- **Options**: `['Always tired', 'Often tired', 'Sometimes tired', 'Rarely tired']`
- **Score Range**: 0-3 (higher score = lower risk)
- **Description**: Level of fatigue experienced

#### Q3. Weight Changes
- **Field**: `weightChanges`
- **Options**: `['Significant weight gain', 'Slight weight gain', 'Weight remains stable', 'Weight loss']`
- **Score Range**: 0-3 (higher score = lower risk)
- **Description**: Changes in body weight

#### Q4. Sleep Quality
- **Field**: `sleepQuality`
- **Options**: `['Very poor sleep', 'Poor sleep', 'Average sleep', 'Good sleep']`
- **Score Range**: 0-3 (higher score = lower risk)
- **Description**: Quality of sleep patterns

#### Q5. Mood Swings
- **Field**: `moodSwings`
- **Options**: `['Very frequently', 'Frequently', 'Sometimes', 'Never']`
- **Score Range**: 0-3 (higher score = lower risk)
- **Description**: Frequency of mood changes

## API Endpoints

### 1. Get Assessment Questions
**GET** `/questions`

Get all menopause assessment questions and options (public endpoint).

**Response:**
```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "How often do you experience irregular periods?",
        "type": "select",
        "options": [
          { "value": "Yes, frequently", "score": 0, "description": "Very frequent irregularity" },
          { "value": "Sometimes", "score": 1, "description": "Occasional irregularity" },
          { "value": "Rarely", "score": 2, "description": "Infrequent irregularity" },
          { "value": "No, Never", "score": 3, "description": "Regular periods" }
        ],
        "tag": "irregular_periods"
      },
      {
        "id": 2,
        "question": "How would you describe your fatigue levels?",
        "type": "select",
        "options": [
          { "value": "Always tired", "score": 0, "description": "Constant fatigue" },
          { "value": "Often tired", "score": 1, "description": "Frequent fatigue" },
          { "value": "Sometimes tired", "score": 2, "description": "Occasional fatigue" },
          { "value": "Rarely tired", "score": 3, "description": "Minimal fatigue" }
        ],
        "tag": "fatigue"
      }
    ]
  }
}
```

### 2. Create Assessment
**POST** `/`

Create a new menopause assessment.

**Request Body:**
```json
{
  "answers": {
    "irregularPeriods": "Sometimes",
    "fatigue": "Often tired",
    "weightChanges": "Slight weight gain",
    "sleepQuality": "Poor sleep",
    "moodSwings": "Frequently"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Assessment created successfully",
  "data": {
    "assessment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "assessmentDate": "2024-01-15T10:30:00.000Z",
      "answers": {
        "irregularPeriods": "Sometimes",
        "fatigue": "Often tired",
        "weightChanges": "Slight weight gain",
        "sleepQuality": "Poor sleep",
        "moodSwings": "Frequently"
      },
      "scores": {
        "irregularPeriodsScore": 1,
        "fatigueScore": 1,
        "weightChangesScore": 1,
        "sleepQualityScore": 1,
        "moodSwingsScore": 1
      },
      "totalScore": 5,
      "averageScore": 1.0,
      "riskLevel": "Moderate Risk",
      "riskDescription": "You are showing moderate signs of menopause-related symptoms. It is recommended to consult with a healthcare provider for proper guidance and management.",
      "isLatest": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "summary": {
      "totalScore": 5,
      "averageScore": 1.0,
      "riskLevel": "Moderate Risk",
      "riskDescription": "You are showing moderate signs of menopause-related symptoms. It is recommended to consult with a healthcare provider for proper guidance and management."
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
      "averageScore": 1.0,
      "riskLevel": "Moderate Risk",
      "riskDescription": "You are showing moderate signs of menopause-related symptoms. It is recommended to consult with a healthcare provider for proper guidance and management."
    },
    "summary": {
      "totalScore": 5,
      "averageScore": 1.0,
      "riskLevel": "Moderate Risk",
      "riskDescription": "You are showing moderate signs of menopause-related symptoms. It is recommended to consult with a healthcare provider for proper guidance and management."
    }
  }
}
```

### 4. Get Assessment History
**GET** `/history?page=1&limit=10`

Get paginated assessment history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

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
        "averageScore": 1.0,
        "riskLevel": "Moderate Risk"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "total": 15
    }
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
      "averageScore": 1.8,
      "latestScore": 5,
      "latestRiskLevel": "Moderate Risk",
      "trend": "improving"
    },
    "riskDistribution": [
      {
        "_id": "Low Risk",
        "count": 1
      },
      {
        "_id": "Low-Moderate Risk",
        "count": 2
      },
      {
        "_id": "Moderate Risk",
        "count": 1
      },
      {
        "_id": "High Risk",
        "count": 1
      }
    ]
  }
}
```

### 9. Submit Reassessment
**POST** `/reassessment`

Submit a new assessment (creates a new record and marks previous as not latest).

**Request Body:** Same as Create Assessment
**Response:** Same as Create Assessment

### 10. Calculate Risk Level (Preview)
**POST** `/calculate-risk`

Calculate risk level from answers without saving.

**Request Body:** Same as Create Assessment
**Response:** Same as Create Assessment (without database fields)

## Risk Level Calculation

### Scoring System
- **Individual Question Score**: 0-3 (higher score = lower risk)
- **Total Score Range**: 0-15
- **Average Score Range**: 0-3

### Risk Level Thresholds (Based on Average Score)
- **High Risk**: 0-0.5 average score
- **Moderate Risk**: 0.5-1.5 average score
- **Low-Moderate Risk**: 1.5-2.5 average score
- **Low Risk**: 2.5+ average score

### Risk Descriptions
- **High Risk**: "Your symptoms indicate a high risk of menopause-related issues. Immediate consultation with a healthcare provider is strongly recommended for proper assessment and treatment."
- **Moderate Risk**: "You are showing moderate signs of menopause-related symptoms. It is recommended to consult with a healthcare provider for proper guidance and management."
- **Low-Moderate Risk**: "You may be experiencing some menopause-related symptoms. Consider lifestyle adjustments and consult with healthcare providers if symptoms persist."
- **Low Risk**: "Your symptoms indicate a low risk of menopause-related issues. Continue maintaining a healthy lifestyle."

### Score Mapping Examples
```javascript
// Irregular periods scoring
"Yes, frequently" → 0 points (highest risk)
"Sometimes" → 1 point
"Rarely" → 2 points
"No, Never" → 3 points (lowest risk)

// Fatigue scoring
"Always tired" → 0 points (highest risk)
"Often tired" → 1 point
"Sometimes tired" → 2 points
"Rarely tired" → 3 points (lowest risk)
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Missing required answers: irregularPeriods, fatigue"
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
const useMenopauseAssessment = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const createAssessment = async (answers) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/menopause-assessment', {
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
    'irregularPeriods', 'fatigue', 'weightChanges', 'sleepQuality', 'moodSwings'
  ];
  
  const missing = required.filter(field => !answers[field]);
  return missing.length === 0 ? null : `Missing: ${missing.join(', ')}`;
};
```

### Risk Level Display Component
```javascript
const RiskLevelDisplay = ({ riskLevel, averageScore, totalScore }) => {
  const getRiskColor = (level) => {
    switch (level) {
      case 'Low Risk': return 'green';
      case 'Low-Moderate Risk': return 'light-green';
      case 'Moderate Risk': return 'orange';
      case 'High Risk': return 'red';
      default: return 'gray';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'Low Risk': return '✅';
      case 'Low-Moderate Risk': return '⚠️';
      case 'Moderate Risk': return '⚠️';
      case 'High Risk': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className={`risk-level risk-${getRiskColor(riskLevel)}`}>
      <div className="risk-header">
        <span className="risk-icon">{getRiskIcon(riskLevel)}</span>
        <h3>Risk Level: {riskLevel}</h3>
      </div>
      <div className="risk-details">
        <p>Average Score: {averageScore.toFixed(1)}/3.0</p>
        <p>Total Score: {totalScore}/15</p>
      </div>
    </div>
  );
};
```

### Progress Tracking Component
```javascript
const AssessmentProgress = ({ currentQuestion, totalQuestions, answers }) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const completedQuestions = Object.keys(answers).length;

  return (
    <div className="assessment-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="progress-text">
        Question {currentQuestion} of {totalQuestions} ({completedQuestions} answered)
      </div>
    </div>
  );
};
```

### Symptom Severity Indicator
```javascript
const SymptomSeverityIndicator = ({ symptom, value, onChange }) => {
  const options = [
    { value: 'Yes, frequently', label: 'Very Frequently', severity: 'high' },
    { value: 'Sometimes', label: 'Sometimes', severity: 'medium' },
    { value: 'Rarely', label: 'Rarely', severity: 'low' },
    { value: 'No, Never', label: 'Never', severity: 'none' }
  ];

  return (
    <div className="symptom-severity">
      <label>{symptom}</label>
      <div className="severity-options">
        {options.map((option) => (
          <button
            key={option.value}
            className={`severity-option ${value === option.value ? 'selected' : ''} severity-${option.severity}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```
