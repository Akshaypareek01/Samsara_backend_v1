# Question Master API Guide

This document describes the **Question Master** API endpoints for admin management of Prakriti and Vikriti assessment questions and options.

---

## 1. Overview

- **Purpose:** Allow admins to create, update, delete, and manage questions/options for dosha assessments.
- **Models Used:**
  - `QuestionMaster` (stores questions and options for both Prakriti and Vikriti)

---

## 2. API Endpoints

### 2.1 Create Question
- **POST** `/v1/questionMaster/questions`
- **Body:**
```json
{
  "assessmentType": "Prakriti", // or "Vikriti"
  "questionText": "How would you describe your body frame?",
  "options": [
    { "text": "Thin, light, with prominent joints and veins", "dosha": "Vata", "description": "Typical Vata characteristic" },
    { "text": "Medium build with good muscle tone", "dosha": "Pitta", "description": "Typical Pitta characteristic" },
    { "text": "Solid, heavy with well-developed body", "dosha": "Kapha", "description": "Typical Kapha characteristic" }
  ],
  "order": 1,
  "isActive": true
}
```
- **Response:** Created question object

### 2.2 Get All Questions
- **GET** `/v1/questionMaster/questions`
- **Query:** `assessmentType` (optional), `isActive` (optional)
- **Response:** Array of questions

### 2.3 Get Question by ID
- **GET** `/v1/questionMaster/questions/:questionId`
- **Response:** Question object

### 2.4 Update Question
- **PATCH** `/v1/questionMaster/questions/:questionId`
- **Body:** (any updatable fields)
```json
{
  "questionText": "Updated text",
  "options": [ ... ],
  "order": 2,
  "isActive": false
}
```
- **Response:** Updated question object

### 2.5 Delete Question
- **DELETE** `/v1/questionMaster/questions/:questionId`
- **Response:** 204 No Content

### 2.6 Toggle Question Status
- **PATCH** `/v1/questionMaster/questions/:questionId/toggle`
- **Response:** Updated question object (isActive toggled)

### 2.7 Get Questions for Assessment Type
- **GET** `/v1/questionMaster/questions/:assessmentType`
- **Params:** `assessmentType` = Prakriti | Vikriti
- **Response:** Array of questions for that type

---

## 3. Postman Usage Guide

### 3.1 Authentication
- **If endpoints are protected:**
  - Obtain admin JWT token via login endpoint
  - Add `Authorization: Bearer <token>` header to all requests

### 3.2 Example Workflow

#### 1. Create a Question
- **POST** `/v1/questionMaster/questions`
- **Body:** (see above)

#### 2. Get All Questions
- **GET** `/v1/questionMaster/questions?assessmentType=Prakriti&isActive=true`

#### 3. Update a Question
- **PATCH** `/v1/questionMaster/questions/<questionId>`
- **Body:** `{ "questionText": "New text" }`

#### 4. Delete a Question
- **DELETE** `/v1/questionMaster/questions/<questionId>`

#### 5. Toggle Question Status
- **PATCH** `/v1/questionMaster/questions/<questionId>/toggle`

---

## 4. Data Model Reference

### QuestionMaster
```js
{
  assessmentType: 'Prakriti' | 'Vikriti',
  questionText: String,
  options: [
    { text: String, dosha: 'Vata'|'Pitta'|'Kapha', description: String }
  ],
  order: Number,
  isActive: Boolean
}
```

---

## 5. Notes
- **Validation:**
  - `assessmentType` must be 'Prakriti' or 'Vikriti'
  - `questionText` is required
  - Each option must have a valid `dosha` ('Vata', 'Pitta', 'Kapha')
- **Admin only:** These endpoints are for question management, not for user assessment flow.

---

**Ready to use in Postman!**
- Import these endpoints, set your admin auth token, and manage your dosha assessment questions. 