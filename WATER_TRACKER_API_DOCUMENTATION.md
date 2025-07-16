# Water Tracker API Documentation

This document provides comprehensive API documentation for the enhanced Water Tracker functionality based on the mobile app UI requirements.

## Base URL
```
http://localhost:3000/v1/trackers
```

## Authentication
All endpoints require authentication. Include the Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Get Today's Water Data
**Get current day's water tracking information including target, intake, and timeline.**

### Endpoint
```
GET /water/today
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Example
```json
{
  "status": "success",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2025-06-15T00:00:00.000Z",
    "targetGlasses": 8,
    "targetMl": 2000,
    "intakeTimeline": [
      {
        "amountMl": 250,
        "time": "10:30 AM"
      },
      {
        "amountMl": 500,
        "time": "12:15 PM"
      },
      {
        "amountMl": 250,
        "time": "2:45 PM"
      },
      {
        "amountMl": 500,
        "time": "4:20 PM"
      }
    ],
    "totalIntake": 1500,
    "status": "Mildly dehydrated",
    "createdAt": "2025-06-15T10:30:00.000Z",
    "updatedAt": "2025-06-15T16:20:00.000Z"
  }
}
```

### Postman Collection
```json
{
  "name": "Get Today's Water Data",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{base_url}}/v1/trackers/water/today",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water", "today"]
    }
  }
}
```

---

## 2. Update Water Target/Goal
**Update the daily water intake target (default: 2000ml, 8 glasses).**

### Endpoint
```
PUT /water/target
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "targetMl": 2500,
  "targetGlasses": 10
}
```

### Validation Rules
- `targetMl`: Number between 500-5000 (required)
- `targetGlasses`: Number between 1-20 (required)

### Response Example
```json
{
  "status": "success",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2025-06-15T00:00:00.000Z",
    "targetGlasses": 10,
    "targetMl": 2500,
    "intakeTimeline": [
      {
        "amountMl": 250,
        "time": "10:30 AM"
      }
    ],
    "totalIntake": 250,
    "status": "Dehydrated",
    "updatedAt": "2025-06-15T10:30:00.000Z"
  }
}
```

### Postman Collection
```json
{
  "name": "Update Water Target",
  "request": {
    "method": "PUT",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      },
      {
        "key": "Content-Type",
        "value": "application/json",
        "type": "text"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"targetMl\": 2500,\n  \"targetGlasses\": 10\n}"
    },
    "url": {
      "raw": "{{base_url}}/v1/trackers/water/target",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water", "target"]
    }
  }
}
```

---

## 3. Add Water Intake (Quick Add)
**Add water intake entry with automatic timeline tracking.**

### Endpoint
```
POST /water
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body Examples

#### Quick Add - 250ml (Small Cup)
```json
{
  "amountMl": 250
}
```

#### Quick Add - 500ml (Medium Glass)
```json
{
  "amountMl": 500
}
```

#### Quick Add - 750ml (Large Glass)
```json
{
  "amountMl": 750
}
```

#### Custom Amount - 400ml
```json
{
  "amountMl": 400
}
```

### Response Example
```json
{
  "status": "success",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2025-06-15T00:00:00.000Z",
    "targetGlasses": 8,
    "targetMl": 2000,
    "intakeTimeline": [
      {
        "amountMl": 250,
        "time": "10:30 AM"
      },
      {
        "amountMl": 500,
        "time": "12:15 PM"
      },
      {
        "amountMl": 400,
        "time": "3:45 PM"
      }
    ],
    "totalIntake": 1150,
    "status": "Mildly dehydrated",
    "updatedAt": "2025-06-15T15:45:00.000Z"
  }
}
```

### Postman Collection
```json
{
  "name": "Add Water Intake - 250ml",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      },
      {
        "key": "Content-Type",
        "value": "application/json",
        "type": "text"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"amountMl\": 250\n}"
    },
    "url": {
      "raw": "{{base_url}}/v1/trackers/water",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water"]
    }
  }
}
```

---

## 4. Get Weekly Water Summary
**Get weekly statistics and chart data for water intake.**

### Endpoint
```
GET /water/weekly-summary?days=7
```

### Query Parameters
- `days`: Number of days to look back (default: 7, max: 30)

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Example
```json
{
  "status": "success",
  "data": {
    "period": "2025-06-09 - 2025-06-15",
    "totalDays": 7,
    "dailyAverage": 1500,
    "bestDay": 2250,
    "streak": 5,
    "chartData": [
      {
        "date": "2025-06-09",
        "totalMl": 1200,
        "targetMl": 2000,
        "status": "Mildly dehydrated"
      },
      {
        "date": "2025-06-10",
        "totalMl": 1800,
        "targetMl": 2000,
        "status": "Mildly dehydrated"
      },
      {
        "date": "2025-06-11",
        "totalMl": 2100,
        "targetMl": 2000,
        "status": "Hydrated"
      },
      {
        "date": "2025-06-12",
        "totalMl": 2250,
        "targetMl": 2000,
        "status": "Hydrated"
      },
      {
        "date": "2025-06-13",
        "totalMl": 1600,
        "targetMl": 2000,
        "status": "Mildly dehydrated"
      },
      {
        "date": "2025-06-14",
        "totalMl": 1400,
        "targetMl": 2000,
        "status": "Mildly dehydrated"
      },
      {
        "date": "2025-06-15",
        "totalMl": 1500,
        "targetMl": 2000,
        "status": "Mildly dehydrated"
      }
    ],
    "summary": {
      "totalIntake": 10500,
      "averagePerDay": 1500,
      "bestDay": 2250,
      "currentStreak": 5
    }
  }
}
```

### Postman Collection
```json
{
  "name": "Get Weekly Water Summary",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{base_url}}/v1/trackers/water/weekly-summary?days=7",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water", "weekly-summary"],
      "query": [
        {
          "key": "days",
          "value": "7"
        }
      ]
    }
  }
}
```

---

## 5. Delete Water Intake Entry
**Delete a specific water intake entry from today's timeline.**

### Endpoint
```
DELETE /water/intake/:trackerId
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "amountMl": 250
}
```

### Response Example
```json
{
  "status": "success",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2025-06-15T00:00:00.000Z",
    "targetGlasses": 8,
    "targetMl": 2000,
    "intakeTimeline": [
      {
        "amountMl": 500,
        "time": "12:15 PM"
      },
      {
        "amountMl": 250,
        "time": "2:45 PM"
      },
      {
        "amountMl": 500,
        "time": "4:20 PM"
      }
    ],
    "totalIntake": 1250,
    "status": "Mildly dehydrated",
    "updatedAt": "2025-06-15T16:20:00.000Z"
  }
}
```

### Postman Collection
```json
{
  "name": "Delete Water Intake Entry",
  "request": {
    "method": "DELETE",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      },
      {
        "key": "Content-Type",
        "value": "application/json",
        "type": "text"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"amountMl\": 250\n}"
    },
    "url": {
      "raw": "{{base_url}}/v1/trackers/water/intake/64f8a1b2c3d4e5f6a7b8c9d0",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water", "intake", "64f8a1b2c3d4e5f6a7b8c9d0"]
    }
  }
}
```

---

## 6. Get Water History
**Get historical water tracking data for specified number of days.**

### Endpoint
```
GET /water/history?days=30
```

### Query Parameters
- `days`: Number of days to look back (default: 30, max: 365)

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Example
```json
{
  "status": "success",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "date": "2025-06-15T00:00:00.000Z",
      "targetGlasses": 8,
      "targetMl": 2000,
      "intakeTimeline": [
        {
          "amountMl": 250,
          "time": "10:30 AM"
        },
        {
          "amountMl": 500,
          "time": "12:15 PM"
        }
      ],
      "totalIntake": 750,
      "status": "Dehydrated",
      "createdAt": "2025-06-15T10:30:00.000Z",
      "updatedAt": "2025-06-15T12:15:00.000Z"
    }
  ]
}
```

### Postman Collection
```json
{
  "name": "Get Water History",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{base_url}}/v1/trackers/water/history?days=30",
      "host": ["{{base_url}}"],
      "path": ["v1", "trackers", "water", "history"],
      "query": [
        {
          "key": "days",
          "value": "30"
        }
      ]
    }
  }
}
```

---

## Postman Environment Variables

Create a Postman environment with these variables:

```json
{
  "name": "Water Tracker API",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "your_jwt_token_here",
      "enabled": true
    }
  ]
}
```

---

## Hydration Status Logic

The API automatically calculates hydration status based on intake percentage:

- **Hydrated**: ≥100% of target
- **Mildly dehydrated**: 75-99% of target  
- **Dehydrated**: <75% of target

---

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "targetMl",
      "message": "Target ML must be between 500 and 5000"
    }
  ]
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
  "message": "Water tracker entry not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Testing Workflow

1. **Get Today's Data**: Start by fetching today's water data
2. **Update Target**: Set your daily water intake goal
3. **Add Intake**: Add water intake entries throughout the day
4. **View Timeline**: Check your intake timeline
5. **Get Summary**: View weekly statistics and charts
6. **Delete Entry**: Remove incorrect entries if needed

This API provides all the functionality needed to build the water tracker UI shown in the mobile app design. 