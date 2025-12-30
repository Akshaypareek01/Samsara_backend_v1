# Trainer API Integration Documentation

This document provides comprehensive API integration guide for Trainer Management System, designed for **Admin Panel Integration**. All endpoints require authentication and are accessible to authenticated admin users.

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Trainer Model Schema](#trainer-model-schema)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Admin Panel Integration Examples](#admin-panel-integration-examples)
7. [Quick Reference](#quick-reference)

---

## Overview

The Trainer Management System provides complete CRUD operations for managing trainers in the platform. All operations require admin authentication.

### Base URL
```
Production: https://api.samsara.com/v1
Development: http://localhost:3000/v1
```

### API Base Path
All trainer endpoints are prefixed with `/v1/trainers`

---

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Note**: Use admin JWT tokens for all trainer management operations.

---

## Trainer Model Schema

### Trainer Fields

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | Trainer's full name | Trimmed |
| `title` | string | Yes | Trainer's professional title | Trimmed |
| `bio` | string | Yes | Trainer's biography | Max 2000 characters (~400 words), trimmed |
| `specialistIn` | enum | Yes | Specialization area | See enum values below |
| `typeOfTraining` | string | Yes | Types of training offered | Trimmed |
| `duration` | string | Yes | Training session duration | Trimmed |
| `images` | array | No | Array of trainer images | Each image has `key` and `path` |
| `profilePhoto` | object | No | Trainer profile photo | Object with `key` and `path` (can be null) |
| `status` | boolean | No | Active/Inactive status | Default: `true` |
| `createdAt` | date | Auto | Creation timestamp | Auto-generated |
| `updatedAt` | date | Auto | Last update timestamp | Auto-generated |

### Specialist In Enum Values

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

### Image Object Structure

```json
{
  "key": "trainer-images/trainer-id-image-1.jpg",
  "path": "https://cdn.example.com/trainer-images/trainer-id-image-1.jpg"
}
```

---

## API Endpoints

### 1. Create Trainer

Create a new trainer in the system.

**Endpoint**: `POST /v1/trainers`

**Authentication**: Required (Admin)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**Request Body**:
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
      "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-2.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-2.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile.jpg",
    "path": "https://cdn.example.com/trainer-profile/john-doe-profile.jpg"
  },
  "status": true
}
```

**Required Fields**:
- `name` (string)
- `title` (string)
- `bio` (string, max 2000 characters)
- `specialistIn` (enum - see values above)
- `typeOfTraining` (string)
- `duration` (string)

**Optional Fields**:
- `images` (array of image objects)
- `profilePhoto` (image object, can be null)
- `status` (boolean, default: true)

**Response** (201 Created):
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
      "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-2.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-2.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile.jpg",
    "path": "https://cdn.example.com/trainer-profile/john-doe-profile.jpg"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request` - Validation error (missing required fields, invalid enum value, bio too long)
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 2. Get All Trainers

Retrieve a paginated list of trainers with optional filtering and sorting.

**Endpoint**: `GET /v1/trainers`

**Authentication**: Required (Admin)

**Request Headers**:
```
Authorization: Bearer <admin_token>
```

**Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `name` | string | Filter by trainer name (partial match) | `?name=John` |
| `specialistIn` | string | Filter by specialist type (exact match) | `?specialistIn=Yoga` |
| `typeOfTraining` | string | Filter by training type (partial match) | `?typeOfTraining=Group` |
| `status` | boolean | Filter by status | `?status=true` |
| `page` | number | Page number (default: 1) | `?page=1` |
| `limit` | number | Items per page (default: 10) | `?limit=20` |
| `sortBy` | string | Sort field and order | `?sortBy=createdAt:desc` |

**Sort By Format**: `field:order` where order is `asc` or `desc`
- Examples: `createdAt:desc`, `name:asc`, `updatedAt:desc`

**Example Requests**:
```
# Get all active yoga trainers, sorted by creation date
GET /v1/trainers?specialistIn=Yoga&status=true&sortBy=createdAt:desc&page=1&limit=10

# Search trainers by name
GET /v1/trainers?name=John&page=1&limit=20

# Get all trainers with pagination
GET /v1/trainers?page=1&limit=25&sortBy=name:asc
```

**Response** (200 OK):
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
      "images": [
        {
          "key": "trainer-images/john-doe-1.jpg",
          "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
        }
      ],
      "profilePhoto": {
        "key": "trainer-profile/john-doe-profile.jpg",
        "path": "https://cdn.example.com/trainer-profile/john-doe-profile.jpg"
      },
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

**Pagination Response Fields**:
- `results` - Array of trainer objects
- `page` - Current page number
- `limit` - Items per page
- `totalPages` - Total number of pages
- `totalResults` - Total number of trainers matching the filter

---

### 3. Get Trainer by ID

Get a specific trainer by their MongoDB ID.

**Endpoint**: `GET /v1/trainers/:id`

**Authentication**: Required (Admin)

**Request Headers**:
```
Authorization: Bearer <admin_token>
```

**Path Parameters**:
- `id` (string, required) - Trainer MongoDB ObjectId

**Example Request**:
```
GET /v1/trainers/507f1f77bcf86cd799439011
```

**Response** (200 OK):
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
      "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-2.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-2.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile.jpg",
    "path": "https://cdn.example.com/trainer-profile/john-doe-profile.jpg"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid ID format

---

### 4. Update Trainer

Update a trainer's information. All fields are optional, but at least one field must be provided.

**Endpoint**: `PATCH /v1/trainers/:id`

**Authentication**: Required (Admin)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**Path Parameters**:
- `id` (string, required) - Trainer MongoDB ObjectId

**Request Body** (all fields optional, but at least one required):
```json
{
  "name": "John Doe Updated",
  "title": "Senior Certified Yoga Instructor",
  "bio": "Updated bio text with more details about experience and certifications...",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions, Workshops",
  "duration": "60-90 minutes per session",
  "images": [
    {
      "key": "trainer-images/john-doe-1.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-new.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-new.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile-updated.jpg",
    "path": "https://cdn.example.com/trainer-profile/john-doe-profile-updated.jpg"
  },
  "status": true
}
```

**Note**: 
- You can update any combination of fields
- To replace the entire `images` array, send the complete new array
- To update `profilePhoto`, send the complete object (or `null` to clear it)

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe Updated",
  "title": "Senior Certified Yoga Instructor",
  "bio": "Updated bio text with more details...",
  "specialistIn": "Yoga",
  "typeOfTraining": "Group Classes, One-on-One Sessions, Workshops",
  "duration": "60-90 minutes per session",
  "images": [
    {
      "key": "trainer-images/john-doe-1.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
    },
    {
      "key": "trainer-images/john-doe-new.jpg",
      "path": "https://cdn.example.com/trainer-images/john-doe-new.jpg"
    }
  ],
  "profilePhoto": {
    "key": "trainer-profile/john-doe-profile-updated.jpg",
    "path": "https://cdn.example.com/trainer-profile/john-doe-profile-updated.jpg"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request` - Validation error or no fields provided
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 5. Delete Trainer

Delete a trainer by ID. This is a permanent deletion.

**Endpoint**: `DELETE /v1/trainers/:id`

**Authentication**: Required (Admin)

**Request Headers**:
```
Authorization: Bearer <admin_token>
```

**Path Parameters**:
- `id` (string, required) - Trainer MongoDB ObjectId

**Example Request**:
```
DELETE /v1/trainers/507f1f77bcf86cd799439011
```

**Response** (204 No Content):
- No response body

**Error Responses**:
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid ID format

**Note**: Consider using the `status` field to disable trainers instead of deleting them, if you want to preserve historical data.

---

### 6. Add Image to Trainer

Add a new image to a trainer's images array.

**Endpoint**: `POST /v1/trainers/:id/images`

**Authentication**: Required (Admin)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**Path Parameters**:
- `id` (string, required) - Trainer MongoDB ObjectId

**Request Body**:
```json
{
  "key": "trainer-images/john-doe-new-image.jpg",
  "path": "https://cdn.example.com/trainer-images/john-doe-new-image.jpg"
}
```

**Required Fields**:
- `key` (string) - Image storage key/path
- `path` (string) - Full URL to the image

**Response** (201 Created):
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
        "path": "https://cdn.example.com/trainer-images/john-doe-1.jpg"
      },
      {
        "key": "trainer-images/john-doe-2.jpg",
        "path": "https://cdn.example.com/trainer-images/john-doe-2.jpg"
      },
      {
        "key": "trainer-images/john-doe-new-image.jpg",
        "path": "https://cdn.example.com/trainer-images/john-doe-new-image.jpg"
      }
    ],
    "profilePhoto": {...},
    "status": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing key or path
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

---

### 7. Remove Image from Trainer

Remove an image from a trainer's images array by index.

**Endpoint**: `DELETE /v1/trainers/:id/images/:imageIndex`

**Authentication**: Required (Admin)

**Request Headers**:
```
Authorization: Bearer <admin_token>
```

**Path Parameters**:
- `id` (string, required) - Trainer MongoDB ObjectId
- `imageIndex` (number, required) - Zero-based index of the image in the images array

**Example Request**:
```
DELETE /v1/trainers/507f1f77bcf86cd799439011/images/0
```

**Response** (200 OK):
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
        "path": "https://cdn.example.com/trainer-images/john-doe-2.jpg"
      }
    ],
    "profilePhoto": {...},
    "status": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:20:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid image index (out of range or not a number)
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

**Note**: The image index is 0-based. Make sure to get the current images array first to know the correct index.

---

### 8. Update Trainer Profile Photo

Update or set a trainer's profile photo.

**Endpoint**: `PATCH /v1/trainers/:id/profile-photo`

**Authentication**: Required (Admin)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**Path Parameters**:
- `id` (string, required) - Trainer MongoDB ObjectId

**Request Body**:
```json
{
  "key": "trainer-profile/john-doe-profile-updated.jpg",
  "path": "https://cdn.example.com/trainer-profile/john-doe-profile-updated.jpg"
}
```

**Required Fields**:
- `key` (string) - Image storage key/path
- `path` (string) - Full URL to the image

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Profile photo updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "title": "Certified Yoga Instructor",
    "bio": "...",
    "specialistIn": "Yoga",
    "typeOfTraining": "Group Classes, One-on-One Sessions",
    "duration": "60 minutes per session",
    "images": [...],
    "profilePhoto": {
      "key": "trainer-profile/john-doe-profile-updated.jpg",
      "path": "https://cdn.example.com/trainer-profile/john-doe-profile-updated.jpg"
    },
    "status": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:25:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing key or path
- `404 Not Found` - Trainer not found
- `401 Unauthorized` - Missing or invalid token

**Note**: To clear the profile photo, use the update trainer endpoint with `profilePhoto: null`.

---

## Error Handling

All endpoints follow a consistent error response format:

### Error Response Format

```json
{
  "status": "fail",
  "message": "Error message here"
}
```

### Common HTTP Status Codes

| Status Code | Description | When It Occurs |
|-------------|-------------|----------------|
| `200` | OK | Successful GET, PATCH requests |
| `201` | Created | Successful POST requests |
| `204` | No Content | Successful DELETE requests |
| `400` | Bad Request | Validation errors, missing required fields, invalid data |
| `401` | Unauthorized | Missing or invalid authentication token |
| `404` | Not Found | Trainer not found, invalid ID |
| `500` | Internal Server Error | Server-side errors |

### Validation Error Example

```json
{
  "status": "fail",
  "message": "Validation error: 'bio' length must be less than or equal to 2000 characters long"
}
```

---

## Admin Panel Integration Examples

### React/TypeScript Example

```typescript
// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/v1';
const API_TOKEN = localStorage.getItem('admin_token');

// API Client
class TrainerAPI {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string, token: string | null) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/trainers${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Get all trainers with filters
  async getTrainers(filters: {
    name?: string;
    specialistIn?: string;
    typeOfTraining?: string;
    status?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    return this.request<{
      results: Trainer[];
      page: number;
      limit: number;
      totalPages: number;
      totalResults: number;
    }>(queryString ? `?${queryString}` : '');
  }

  // Get trainer by ID
  async getTrainerById(id: string) {
    return this.request<Trainer>(`/${id}`);
  }

  // Create trainer
  async createTrainer(trainerData: CreateTrainerDTO) {
    return this.request<Trainer>('', {
      method: 'POST',
      body: JSON.stringify(trainerData),
    });
  }

  // Update trainer
  async updateTrainer(id: string, updateData: Partial<CreateTrainerDTO>) {
    return this.request<Trainer>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Delete trainer
  async deleteTrainer(id: string) {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Add image to trainer
  async addTrainerImage(id: string, image: { key: string; path: string }) {
    return this.request<{ status: string; message: string; data: Trainer }>(
      `/${id}/images`,
      {
        method: 'POST',
        body: JSON.stringify(image),
      }
    );
  }

  // Remove image from trainer
  async removeTrainerImage(id: string, imageIndex: number) {
    return this.request<{ status: string; message: string; data: Trainer }>(
      `/${id}/images/${imageIndex}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Update profile photo
  async updateProfilePhoto(id: string, photo: { key: string; path: string }) {
    return this.request<{ status: string; message: string; data: Trainer }>(
      `/${id}/profile-photo`,
      {
        method: 'PATCH',
        body: JSON.stringify(photo),
      }
    );
  }
}

// Types
interface Trainer {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialistIn: string;
  typeOfTraining: string;
  duration: string;
  images: Array<{ key: string; path: string }>;
  profilePhoto: { key: string; path: string } | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateTrainerDTO {
  name: string;
  title: string;
  bio: string;
  specialistIn: string;
  typeOfTraining: string;
  duration: string;
  images?: Array<{ key: string; path: string }>;
  profilePhoto?: { key: string; path: string } | null;
  status?: boolean;
}

// Usage
const trainerAPI = new TrainerAPI(API_BASE_URL, API_TOKEN);

// Example: Get all active yoga trainers
const trainers = await trainerAPI.getTrainers({
  specialistIn: 'Yoga',
  status: true,
  page: 1,
  limit: 20,
  sortBy: 'createdAt:desc',
});

// Example: Create a new trainer
const newTrainer = await trainerAPI.createTrainer({
  name: 'Jane Smith',
  title: 'Certified Fitness Trainer',
  bio: 'Jane has 8 years of experience...',
  specialistIn: 'Fitness',
  typeOfTraining: 'Personal Training, Group Classes',
  duration: '45-60 minutes',
  status: true,
});
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

export const useTrainers = (filters = {}) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalResults: 0,
  });

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const response = await trainerAPI.getTrainers(filters);
        setTrainers(response.results);
        setPagination({
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          totalResults: response.totalResults,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trainers');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, [JSON.stringify(filters)]);

  return { trainers, loading, error, pagination };
};

// Usage in component
const TrainerList = () => {
  const [filters, setFilters] = useState({
    status: true,
    page: 1,
    limit: 20,
  });
  const { trainers, loading, error, pagination } = useTrainers(filters);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {trainers.map((trainer) => (
        <div key={trainer.id}>
          <h3>{trainer.name}</h3>
          <p>{trainer.title}</p>
        </div>
      ))}
    </div>
  );
};
```

### JavaScript/Fetch Example

```javascript
// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');
  const baseURL = 'http://localhost:3000/v1';
  
  const response = await fetch(`${baseURL}/trainers${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Get all trainers
async function getTrainers(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  return apiCall(queryString ? `?${queryString}` : '');
}

// Create trainer
async function createTrainer(trainerData) {
  return apiCall('', {
    method: 'POST',
    body: JSON.stringify(trainerData),
  });
}

// Update trainer
async function updateTrainer(id, updateData) {
  return apiCall(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
}

// Delete trainer
async function deleteTrainer(id) {
  return apiCall(`/${id}`, {
    method: 'DELETE',
  });
}

// Add image
async function addTrainerImage(id, image) {
  return apiCall(`/${id}/images`, {
    method: 'POST',
    body: JSON.stringify(image),
  });
}

// Remove image
async function removeTrainerImage(id, imageIndex) {
  return apiCall(`/${id}/images/${imageIndex}`, {
    method: 'DELETE',
  });
}

// Update profile photo
async function updateProfilePhoto(id, photo) {
  return apiCall(`/${id}/profile-photo`, {
    method: 'PATCH',
    body: JSON.stringify(photo),
  });
}
```

---

## Quick Reference

### Endpoint Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/v1/trainers` | Create a new trainer | Yes |
| `GET` | `/v1/trainers` | Get all trainers (paginated) | Yes |
| `GET` | `/v1/trainers/:id` | Get trainer by ID | Yes |
| `PATCH` | `/v1/trainers/:id` | Update trainer | Yes |
| `DELETE` | `/v1/trainers/:id` | Delete trainer | Yes |
| `POST` | `/v1/trainers/:id/images` | Add image to trainer | Yes |
| `DELETE` | `/v1/trainers/:id/images/:imageIndex` | Remove image from trainer | Yes |
| `PATCH` | `/v1/trainers/:id/profile-photo` | Update profile photo | Yes |

### Specialist In Options

```
Mental Health, Fitness, Yoga, Pilates, Strength Training, Cardio,
Weight Loss, Weight Gain, Nutrition, Ayurveda, Meditation, Wellness,
Rehabilitation, Sports Training, Dance Fitness, HIIT, CrossFit,
Bodybuilding, General Training
```

### Common Filter Combinations

```javascript
// Get active trainers
{ status: true }

// Get yoga trainers
{ specialistIn: 'Yoga', status: true }

// Search by name
{ name: 'John' }

// Pagination
{ page: 1, limit: 20, sortBy: 'createdAt:desc' }
```

### Important Notes

1. **Bio Field**: Maximum 2000 characters (~400 words)
2. **Images Array**: Can contain multiple images, each with `key` and `path`
3. **Profile Photo**: Single object (not array) with `key` and `path`, can be null
4. **Status Field**: Defaults to `true`. Use to enable/disable without deletion
5. **Pagination**: Default page size is 10, can be customized with `limit` parameter
6. **Sorting**: Use `sortBy=field:order` format (e.g., `createdAt:desc`, `name:asc`)
7. **Image Index**: Zero-based when removing images (0 = first image)
8. **Update Operations**: All fields optional in PATCH, but at least one required

---

## Integration Checklist

- [ ] Set up API base URL (development/production)
- [ ] Implement authentication token storage and retrieval
- [ ] Create API client/service class
- [ ] Implement error handling
- [ ] Create trainer list view with pagination
- [ ] Create trainer detail view
- [ ] Create trainer form (create/edit)
- [ ] Implement image upload and management
- [ ] Add filtering and search functionality
- [ ] Add sorting options
- [ ] Implement status toggle (active/inactive)
- [ ] Add validation for required fields
- [ ] Handle API errors gracefully
- [ ] Add loading states
- [ ] Test all CRUD operations

---

**Last Updated**: 2024-01-15
**API Version**: v1

