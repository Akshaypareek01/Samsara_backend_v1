# Trainer API Documentation

Complete API documentation for Trainer CRUD operations. This document provides all endpoints, request/response formats, and examples for frontend integration.

## Base URL

```
http://localhost:3000/v1/trainers
```

**Note:** All endpoints are prefixed with `/v1/trainers` since the router is mounted at `/trainers` in the main routes file.

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Specialist In Enum Values

The `specialistIn` field accepts one of the following values:

- `Mental Health`
- `Fitness`
- `Yoga`
- `Pilates`
- `Strength Training`
- `Cardio`
- `Weight Loss`
- `Weight Gain`
- `Nutrition`
- `Ayurveda`
- `Meditation`
- `Wellness`
- `Rehabilitation`
- `Sports Training`
- `Dance Fitness`
- `HIIT`
- `CrossFit`
- `Bodybuilding`
- `General Training`

---

## API Endpoints

### 1. Create Trainer

Create a new trainer.

**Endpoint:** `POST /v1/trainers`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "John Doe",
  "title": "Certified Yoga Instructor",
  "bio": "John has over 10 years of experience in yoga and meditation. He specializes in Hatha and Vinyasa yoga styles, helping students achieve physical and mental wellness through mindful practice. His approach combines traditional yoga techniques with modern wellness principles.",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions",
  "duration": "60 minutes per session",
  "images": [
    {
      "key": "trainer-images/john-doe-1.jpg",
      "path": "https://example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-2.jpg",
      "path": "https://example.com/trainer-images/john-doe-2.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile.jpg",
    "path": "https://example.com/trainer-profile/john-doe-profile.jpg"
  },
  "status": true
}
```

**Required Fields:**
- `name` (string)
- `title` (string)
- `bio` (string, max 2000 characters - approximately 400 words)
- `specialistIn` (enum - see values above)
- `typeOfTraining` (string)
- `duration` (string)

**Optional Fields:**
- `images` (array of objects with `key` and `path`)
- `profilePhoto` (object with `key` and `path`)
- `status` (boolean, default: true)

**Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "title": "Certified Yoga Instructor",
  "bio": "John has over 10 years of experience in yoga and meditation...",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions",
  "duration": "60 minutes per session",
  "images": [
    {
      "key": "trainer-images/john-doe-1.jpg",
      "path": "https://example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-2.jpg",
      "path": "https://example.com/trainer-images/john-doe-2.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile.jpg",
    "path": "https://example.com/trainer-profile/john-doe-profile.jpg"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 2. Get All Trainers

Get a paginated list of trainers with optional filtering.

**Endpoint:** `GET /v1/trainers`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `name` | string | Filter by trainer name | `?name=John` |
| `specialistIn` | string | Filter by specialist type | `?specialistIn=Yoga` |
| `typeOfTraining` | string | Filter by training type | `?typeOfTraining=Group Classes` |
| `status` | boolean | Filter by status | `?status=true` |
| `page` | number | Page number (default: 1) | `?page=1` |
| `limit` | number | Items per page (default: 10) | `?limit=20` |
| `sortBy` | string | Sort field and order | `?sortBy=createdAt:desc` |

**Example Request:**

```
GET /v1/trainers?specialistIn=Yoga&page=1&limit=10&sortBy=createdAt:desc
```

**Response:** `200 OK`

```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "title": "Certified Yoga Instructor",
      "bio": "John has over 10 years of experience...",
      "specialistIn": "Yoga",
      "typeOfTraining": "Group Classes, One-on-One Sessions",
      "duration": "60 minutes per session",
      "images": [...],
      "profilePhoto": {...},
      "status": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

---

### 3. Get Trainer by ID

Get a specific trainer by their MongoDB ID.

**Endpoint:** `GET /v1/trainers/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trainer MongoDB ID |

**Example Request:**

```
GET /v1/trainers/507f1f77bcf86cd799439011
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "title": "Certified Yoga Instructor",
  "bio": "John has over 10 years of experience...",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions",
  "duration": "60 minutes per session",
  "images": [
    {
      "key": "trainer-images/john-doe-1.jpg",
      "path": "https://example.com/trainer-images/john-doe-1.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile.jpg",
    "path": "https://example.com/trainer-profile/john-doe-profile.jpg"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 4. Update Trainer

Update a trainer's information. All fields are optional, but at least one field must be provided.

**Endpoint:** `PATCH /v1/trainers/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trainer MongoDB ID |

**Request Body:**

```json
{
  "name": "John Doe Updated",
  "title": "Senior Certified Yoga Instructor",
  "bio": "Updated bio text...",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions, Workshops",
  "duration": "60-90 minutes per session",
  "status": true
}
```

**All fields are optional**, but at least one field must be provided.

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe Updated",
  "title": "Senior Certified Yoga Instructor",
  "bio": "Updated bio text...",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions, Workshops",
  "duration": "60-90 minutes per session",
  "images": [...],
  "profilePhoto": {...},
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or no fields provided
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 5. Delete Trainer

Delete a trainer by ID.

**Endpoint:** `DELETE /v1/trainers/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trainer MongoDB ID |

**Example Request:**

```
DELETE /v1/trainers/507f1f77bcf86cd799439011
```

**Response:** `204 No Content`

**Error Responses:**

- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 6. Add Image to Trainer

Add an image to a trainer's images array.

**Endpoint:** `POST /v1/trainers/:id/images`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trainer MongoDB ID |

**Request Body:**

```json
{
  "key": "trainer-images/john-doe-new.jpg",
  "path": "https://example.com/trainer-images/john-doe-new.jpg"
}
```

**Required Fields:**
- `key` (string)
- `path` (string)

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Image added successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "images": [
      {
        "key": "trainer-images/john-doe-1.jpg",
        "path": "https://example.com/trainer-images/john-doe-1.jpg"
      },
      {
        "key": "trainer-images/john-doe-new.jpg",
        "path": "https://example.com/trainer-images/john-doe-new.jpg"
      }
    ],
    ...
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing key or path
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 7. Remove Image from Trainer

Remove an image from a trainer's images array by index.

**Endpoint:** `DELETE /v1/trainers/:id/images/:imageIndex`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trainer MongoDB ID |
| `imageIndex` | number | Index of the image in the images array (0-based) |

**Example Request:**

```
DELETE /v1/trainers/507f1f77bcf86cd799439011/images/0
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Image removed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "images": [
      {
        "key": "trainer-images/john-doe-2.jpg",
        "path": "https://example.com/trainer-images/john-doe-2.jpg"
      }
    ],
    ...
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid image index
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 8. Update Trainer Profile Photo

Update a trainer's profile photo.

**Endpoint:** `PATCH /v1/trainers/:id/profile-photo`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Trainer MongoDB ID |

**Request Body:**

```json
{
  "key": "trainer-profile/john-doe-profile-updated.jpg",
  "path": "https://example.com/trainer-profile/john-doe-profile-updated.jpg"
}
```

**Required Fields:**
- `key` (string)
- `path` (string)

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Profile photo updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "profilePhoto": {
      "key": "trainer-profile/john-doe-profile-updated.jpg",
      "path": "https://example.com/trainer-profile/john-doe-profile-updated.jpg"
    },
    ...
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing key or path
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

## Frontend Integration Examples

### React/JavaScript Example

```javascript
// Create a trainer
const createTrainer = async (trainerData) => {
  const response = await fetch('http://localhost:3000/v1/trainers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(trainerData)
  });
  return response.json();
};

// Get all trainers with filters
const getTrainers = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:3000/v1/trainers?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Update trainer
const updateTrainer = async (trainerId, updateData) => {
  const response = await fetch(`http://localhost:3000/v1/trainers/${trainerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

// Add image to trainer
const addTrainerImage = async (trainerId, imageData) => {
  const response = await fetch(`http://localhost:3000/v1/trainers/${trainerId}/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(imageData)
  });
  return response.json();
};
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "status": "fail",
  "message": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (for delete operations)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **Bio Field**: The bio field has a maximum length of 2000 characters, which is approximately 400 words.

2. **Images Array**: The images array can contain multiple image objects. Each image object must have both `key` and `path` fields.

3. **Profile Photo**: The profile photo is a single object (not an array) with `key` and `path` fields. It can be null initially.

4. **Status Field**: The status field defaults to `true` if not provided. Use this to enable/disable trainers without deleting them.

5. **Pagination**: When fetching all trainers, use the `page` and `limit` query parameters for pagination. The response includes pagination metadata.

6. **Sorting**: Use the `sortBy` query parameter with format `field:order` (e.g., `createdAt:desc`, `name:asc`).




