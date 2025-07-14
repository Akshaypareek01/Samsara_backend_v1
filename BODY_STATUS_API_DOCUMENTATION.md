# Body Status API Documentation

This document provides comprehensive information about the Body Status API endpoints, including request/response examples and Postman collection setup.

## Base URL
```
http://localhost:3000/v1/trackers
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get Body Status History

**Endpoint:** `GET /v1/trackers/body-status/history`

**Description:** Retrieve body status history for the authenticated user

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30, max: 365)

**Postman Request:**
```
GET {{base_url}}/v1/trackers/body-status/history?days=30
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Response Example:**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
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
    "bmi": {
      "value": 22.86,
      "category": "Normal"
    },
    "bodyFat": {
      "value": 15,
      "unit": "%"
    },
    "measurementDate": "2024-01-15T10:30:00.000Z",
    "notes": "Feeling good today",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 2. Get Body Status Entry by ID

**Endpoint:** `GET /v1/trackers/body-status/:entryId`

**Description:** Retrieve a specific body status entry by its ID

**Path Parameters:**
- `entryId` (required): The ID of the body status entry

**Postman Request:**
```
GET {{base_url}}/v1/trackers/body-status/64f8a1b2c3d4e5f6a7b8c9d0
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Response Example:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
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
  "bmi": {
    "value": 22.86,
    "category": "Normal"
  },
  "bodyFat": {
    "value": 15,
    "unit": "%"
  },
  "measurementDate": "2024-01-15T10:30:00.000Z",
  "notes": "Feeling good today",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404):**
```json
{
  "code": 404,
  "message": "Body status entry not found"
}
```

---

### 3. Create Body Status Entry

**Endpoint:** `POST /v1/trackers/body-status`

**Description:** Create a new body status entry

**Postman Request:**
```
POST {{base_url}}/v1/trackers/body-status
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Request Body Examples:**

**Minimal Required Data:**
```json
{
  "height": {
    "value": 175,
    "unit": "cm"
  },
  "weight": {
    "value": 70,
    "unit": "kg"
  }
}
```

**Complete Data:**
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
  "notes": "Feeling good today"
}
```

**Response Example:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
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
  "bmi": {
    "value": 22.86,
    "category": "Normal"
  },
  "bodyFat": {
    "value": 15,
    "unit": "%"
  },
  "measurementDate": "2024-01-15T10:30:00.000Z",
  "notes": "Feeling good today",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. Update Body Status Entry

**Endpoint:** `PUT /v1/trackers/bodyStatus/:entryId`

**Description:** Update an existing body status entry

**Postman Request:**
```
PUT {{base_url}}/v1/trackers/bodyStatus/64f8a1b2c3d4e5f6a7b8c9d0
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Request Body Example:**
```json
{
  "weight": {
    "value": 72,
    "unit": "kg"
  },
  "chest": {
    "value": 96,
    "unit": "cm"
  },
  "notes": "Updated measurements after workout"
}
```

**Response Example:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "height": {
    "value": 175,
    "unit": "cm"
  },
  "weight": {
    "value": 72,
    "unit": "kg"
  },
  "chest": {
    "value": 96,
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
  "bmi": {
    "value": 23.51,
    "category": "Normal"
  },
  "bodyFat": {
    "value": 15,
    "unit": "%"
  },
  "measurementDate": "2024-01-15T10:30:00.000Z",
  "notes": "Updated measurements after workout",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

---

### 5. Delete Body Status Entry

**Endpoint:** `DELETE /v1/trackers/bodyStatus/:entryId`

**Description:** Delete a body status entry

**Postman Request:**
```
DELETE {{base_url}}/v1/trackers/bodyStatus/64f8a1b2c3d4e5f6a7b8c9d0
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Response:** `204 No Content`

---

## Data Schema

### Body Status Entry Fields

| Field | Type | Required | Description | Units |
|-------|------|----------|-------------|-------|
| `height` | Object | Yes | Height measurement | `cm`, `ft` |
| `weight` | Object | Yes | Weight measurement | `kg`, `lbs` |
| `chest` | Object | No | Chest circumference | `cm`, `inches` |
| `waist` | Object | No | Waist circumference | `cm`, `inches` |
| `hips` | Object | No | Hip circumference | `cm`, `inches` |
| `arms` | Object | No | Arm circumference | `cm`, `inches` |
| `thighs` | Object | No | Thigh circumference | `cm`, `inches` |
| `bodyFat` | Object | No | Body fat percentage | `%` |
| `notes` | String | No | Additional notes | - |

### Measurement Object Structure

```json
{
  "value": 175,
  "unit": "cm"
}
```

### BMI Categories

- **Underweight**: < 18.5
- **Normal**: 18.5 - 24.9
- **Overweight**: 25.0 - 29.9
- **Obese**: ≥ 30.0

---

## Error Responses

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Validation error",
  "details": [
    {
      "field": "height.value",
      "message": "\"height.value\" is required"
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
  "message": "Body status entry not found"
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

## Postman Collection Setup

### Environment Variables

Create a Postman environment with these variables:

```
base_url: http://localhost:3000/v1/trackers
auth_token: <your-jwt-token>
```

### Collection Structure

1. **Get Body Status History**
   - Method: GET
   - URL: `{{base_url}}/body-status/history?days=30`

2. **Get Body Status Entry by ID**
   - Method: GET
   - URL: `{{base_url}}/body-status/{{entry_id}}`

3. **Create Body Status Entry**
   - Method: POST
   - URL: `{{base_url}}/body-status`
   - Body: Raw JSON with required fields

4. **Update Body Status Entry**
   - Method: PUT
   - URL: `{{base_url}}/bodyStatus/{{entry_id}}`
   - Body: Raw JSON with fields to update

5. **Delete Body Status Entry**
   - Method: DELETE
   - URL: `{{base_url}}/bodyStatus/{{entry_id}}`

---

## Testing Examples

### Test 1: Create Minimal Entry
```bash
curl -X POST http://localhost:3000/v1/trackers/body-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height": {
      "value": 175,
      "unit": "cm"
    },
    "weight": {
      "value": 70,
      "unit": "kg"
    }
  }'
```

### Test 2: Create Complete Entry
```bash
curl -X POST http://localhost:3000/v1/trackers/body-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Test 3: Get History
```bash
curl -X GET "http://localhost:3000/v1/trackers/body-status/history?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Get Entry by ID
```bash
curl -X GET "http://localhost:3000/v1/trackers/body-status/64f8a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. **BMI Calculation**: The system automatically calculates BMI when both height and weight are provided
2. **Unit Conversion**: The system handles unit conversions internally for BMI calculations
3. **Date Handling**: `measurementDate` defaults to current date if not provided
4. **Validation**: All measurements are validated for reasonable ranges
5. **Authentication**: All endpoints require valid JWT token
6. **Pagination**: History endpoints support date range filtering via `days` parameter
7. **Security**: Users can only access their own body status entries 