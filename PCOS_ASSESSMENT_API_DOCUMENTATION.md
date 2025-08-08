# PCOS/PCOD Assessment API Documentation

This document describes the **PCOS/PCOD Assessment** API endpoints for comprehensive PCOS risk assessment and management.

---

## 1. Overview

- **Purpose:** Allow users to take PCOS/PCOD risk assessments with 15 comprehensive questions.
- **Scoring System:** Based on medical scoring criteria with risk levels (Low, Moderate, High).
- **Authentication:** Most endpoints require JWT token authentication.
- **Real-time Scoring:** Risk scores and recommendations are calculated automatically.
- **Models Used:** `PcosAssessment` (user answers/results)

---

## 2. API Endpoints

### 2.1 Get Assessment Questions
- **GET** `/v1/pcos-assessment/questions`
- **Headers:** None required (public endpoint)
- **Response:** Array of 15 questions with options and scoring information
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
      // ... 13 more questions
    ]
  }
}
```

### 2.2 Create Assessment
- **POST** `/v1/pcos-assessment/`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "answers": {
    "lastCycleDate": "2024-01-15T00:00:00.000Z",
    "cycleRegularity": "Irregular",
    "periodDuration": "5-7 days",
    "menstrualFlow": "Heavy",
    "bloodColor": "Bright red",
    "facialHair": "No",
    "weightGain": "Yes",
    "foodCravings": "Sugar and chocolate cravings",
    "hormonalMedications": "No",
    "periodPain": "Bearable",
    "facialAcne": "Yes",
    "lowLibido": "No",
    "hairLoss": "Normal",
    "darkSkinPatches": "No",
    "difficultyConceiving": "Other"
  }
}
```
- **Response:**
```json
{
  "status": "success",
  "message": "PCOS assessment created successfully",
  "data": {
    "assessment": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "userId": "64a1b2c3d4e5f6a7b8c9d0e2",
      "assessmentDate": "2024-01-20T10:30:00.000Z",
      "answers": { /* all answers */ },
      "scores": {
        "cycleIrregularityScore": 2,
        "periodDurationScore": 1,
        "menstrualFlowScore": 2,
        "bloodColorScore": 0,
        "facialHairScore": 0,
        "weightGainScore": 2,
        "foodCravingsScore": 1,
        "hormonalMedicationsScore": 0,
        "periodPainScore": 1,
        "facialAcneScore": 2,
        "lowLibidoScore": 0,
        "hairLossScore": 0,
        "darkSkinPatchesScore": 0,
        "difficultyConceivingScore": 0
      },
      "totalScore": 11,
      "riskLevel": "High risk",
      "riskDescription": "Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.",
      "recommendations": [
        "Urgent gynecologist consultation",
        "Complete hormone workup",
        "Ultrasound examination",
        "Blood tests (AMH, LH/FSH, insulin, TSH, testosterone)",
        "Lifestyle and dietary changes",
        "Regular follow-up appointments"
      ],
      "cycleLength": 35,
      "isCompleted": true
    },
    "summary": {
      "totalScore": 11,
      "riskLevel": "High risk",
      "riskDescription": "Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.",
      "recommendations": [ /* array of recommendations */ ],
      "cycleLength": 35
    }
  }
}
```

### 2.3 Get Latest Assessment
- **GET** `/v1/pcos-assessment/latest`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Latest assessment for the authenticated user (same format as create response)

### 2.4 Get Assessment History
- **GET** `/v1/pcos-assessment/history?page=1&limit=10&riskLevel=High%20risk`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `riskLevel` (optional): Filter by risk level ("Low risk", "Moderate risk", "High risk")
- **Response:**
```json
{
  "status": "success",
  "data": {
    "results": [ /* array of assessments */ ],
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "totalResults": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2.5 Get Assessment by ID
- **GET** `/v1/pcos-assessment/:assessmentId`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `assessmentId` - MongoDB ObjectId
- **Response:** Specific assessment details (same format as create response)

### 2.6 Update Assessment (Reassessment)
- **PUT** `/v1/pcos-assessment/:assessmentId`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `assessmentId` - MongoDB ObjectId
- **Body:** Same as create assessment
- **Response:** Updated assessment (same format as create response)

### 2.7 Submit Reassessment (New Assessment)
- **POST** `/v1/pcos-assessment/reassessment`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Same as create assessment
- **Response:** New assessment (same format as create response)

### 2.8 Calculate Risk Level (Without Saving)
- **POST** `/v1/pcos-assessment/calculate-risk`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Same as create assessment
- **Response:**
```json
{
  "status": "success",
  "data": {
    "scores": { /* individual scores */ },
    "totalScore": 8,
    "riskLevel": "Moderate risk",
    "riskDescription": "Your symptoms indicate a moderate risk of PCOS/PCOD. Consider consulting a healthcare provider.",
    "recommendations": [ /* array of recommendations */ ]
  }
}
```

### 2.9 Get Assessment Statistics
- **GET** `/v1/pcos-assessment/stats`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "status": "success",
  "data": {
    "totalAssessments": 5,
    "averageScore": 7.2,
    "latestAssessment": "2024-01-20T10:30:00.000Z",
    "riskLevelDistribution": {
      "Low risk": 1,
      "Moderate risk": 2,
      "High risk": 2
    }
  }
}
```

### 2.10 Delete Assessment
- **DELETE** `/v1/pcos-assessment/:assessmentId`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `assessmentId` - MongoDB ObjectId
- **Response:**
```json
{
  "status": "success",
  "message": "Assessment deleted successfully"
}
```

---

## 3. Scoring System

### 3.1 Question Scoring
- **Q1 (Last Cycle Date):** Used to calculate cycle length
- **Q2 (Cycle Regularity):** Regular = 0 pts, Irregular = 2 pts
- **Q3 (Period Duration):** 1-2 days = 1 pt, 3-5 days = 0 pts, 5-7 days = 1 pt, 7+ days = 2 pts
- **Q4 (Menstrual Flow):** Normal = 0 pts, Scanty = 1 pt, Heavy = 2 pts
- **Q5 (Blood Color):** Bright red = 0 pts, Brown-Blackish = 1 pt, Initially brown then red = 1 pt
- **Q6 (Facial Hair):** Yes = 3 pts, No = 0 pts
- **Q7 (Weight Gain):** Yes = 2 pts, No = 0 pts
- **Q8 (Food Cravings):** Sugar/carb cravings = 1 pt, others = 0 pts
- **Q9 (Hormonal Medications):** Yes = 2 pts, No = 0 pts
- **Q10 (Period Pain):** Absent = 0 pts, Bearable = 1 pt, Unbearable = 2 pts
- **Q11 (Facial Acne):** Yes = 2 pts, No = 0 pts
- **Q12 (Low Libido):** Yes = 1 pt, No = 0 pts
- **Q13 (Hair Loss):** Excess = 2 pts, Normal/Absent = 0 pts
- **Q14 (Dark Skin Patches):** Yes = 3 pts, No = 0 pts
- **Q15 (Difficulty Conceiving):** Never conceived = 3 pts, Conceived once then failure = 2 pts, Second conception failed = 1 pt, Other = 0 pts

### 3.2 Risk Level Classification
- **0-4 points:** Low risk - Lifestyle observation
- **5-9 points:** Moderate risk - Recommend ultrasound + blood test (AMH, LH/FSH, insulin, TSH)
- **≥10 points:** High risk - Strong PCOS/PCOD suspicion → Gynaec consult & complete hormone workup

---

## 4. Error Responses

### 4.1 Validation Errors
```json
{
  "status": "error",
  "message": "Missing required answers: lastCycleDate, cycleRegularity",
  "statusCode": 400
}
```

### 4.2 Authentication Errors
```json
{
  "status": "error",
  "message": "Please authenticate",
  "statusCode": 401
}
```

### 4.3 Not Found Errors
```json
{
  "status": "error",
  "message": "Assessment not found",
  "statusCode": 404
}
```

---

## 5. Usage Examples

### 5.1 Complete Assessment Flow
1. **Get Questions:** `GET /v1/pcos-assessment/questions`
2. **Submit Assessment:** `POST /v1/pcos-assessment/` with answers
3. **View Results:** Response includes risk level and recommendations
4. **Track Progress:** Use `/latest` and `/history` endpoints

### 5.2 Reassessment Flow
1. **Calculate Risk:** `POST /v1/pcos-assessment/calculate-risk` (preview)
2. **Submit Reassessment:** `POST /v1/pcos-assessment/reassessment`
3. **Compare Results:** Use `/history` to see progression

### 5.3 Monitoring Flow
1. **Get Stats:** `GET /v1/pcos-assessment/stats`
2. **View History:** `GET /v1/pcos-assessment/history`
3. **Track Changes:** Compare scores over time

---

## 6. Data Models

### 6.1 PcosAssessment Schema
```javascript
{
  userId: ObjectId (ref: 'Users'),
  assessmentDate: Date,
  answers: {
    lastCycleDate: Date,
    cycleRegularity: String (enum),
    periodDuration: String (enum),
    menstrualFlow: String (enum),
    bloodColor: String (enum),
    facialHair: String (enum),
    weightGain: String (enum),
    foodCravings: String,
    hormonalMedications: String (enum),
    periodPain: String (enum),
    facialAcne: String (enum),
    lowLibido: String (enum),
    hairLoss: String (enum),
    darkSkinPatches: String (enum),
    difficultyConceiving: String (enum)
  },
  scores: {
    cycleIrregularityScore: Number,
    periodDurationScore: Number,
    menstrualFlowScore: Number,
    bloodColorScore: Number,
    facialHairScore: Number,
    weightGainScore: Number,
    foodCravingsScore: Number,
    hormonalMedicationsScore: Number,
    periodPainScore: Number,
    facialAcneScore: Number,
    lowLibidoScore: Number,
    hairLossScore: Number,
    darkSkinPatchesScore: Number,
    difficultyConceivingScore: Number
  },
  totalScore: Number,
  riskLevel: String (enum: 'Low risk', 'Moderate risk', 'High risk'),
  riskDescription: String,
  recommendations: [String],
  cycleLength: Number,
  isCompleted: Boolean,
  timestamps: true
}
```

---

## 7. Security Considerations

- All endpoints (except `/questions`) require JWT authentication
- Users can only access their own assessments
- Input validation prevents malicious data
- Rate limiting should be applied to prevent abuse
- Sensitive health data should be encrypted in transit and at rest

---

## 8. Testing

### 8.1 Sample Test Data
```json
{
  "answers": {
    "lastCycleDate": "2024-01-01T00:00:00.000Z",
    "cycleRegularity": "Irregular",
    "periodDuration": "7+ days",
    "menstrualFlow": "Heavy",
    "bloodColor": "Brown-Blackish",
    "facialHair": "Yes",
    "weightGain": "Yes",
    "foodCravings": "Sugar and chocolate cravings",
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
**Expected Result:** High risk (score: 20+)

---

This API provides a comprehensive PCOS/PCOD assessment system with proper scoring, risk classification, and user management capabilities.
