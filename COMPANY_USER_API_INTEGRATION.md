# Company User API Integration

Frontend integration guide for `company-users` APIs.

## Base URL

```bash
http://localhost:8000/v1/company-users
```

If your local backend runs on a different port, replace `8000` accordingly.

## Auth

All endpoints require bearer token.

```http
Authorization: Bearer <access_token>
```

---

## Data Model

`CompanyUser` fields returned by backend:

```json
{
  "id": "67d1f5d6e17f0e5af2fca111",
  "companyId": "67d1f4b8e17f0e5af2fca000",
  "fullName": "Rohit Sharma",
  "email": "rohit@acme.com",
  "level": "beginner",
  "status": true,
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-04-01T10:00:00.000Z"
}
```

### Field Rules

- `companyId`: Mongo ObjectId of company (required on create)
- `fullName`: string (required on create)
- `email`: valid email (required on create, stored lowercase)
- `level`: one of `beginner | intermediate | advanced`
- `status`: boolean (optional, defaults to `true`)

---

## Endpoints

### 1) Create Company User

- **Method:** `POST`
- **URL:** `/v1/company-users`

Request body:

```json
{
  "companyId": "67d1f4b8e17f0e5af2fca000",
  "fullName": "Rohit Sharma",
  "email": "rohit@acme.com",
  "level": "beginner",
  "status": true
}
```

Success:
- `201 Created` -> returns created object

Known errors:
- `404` -> `Company not found`
- `409` -> `Email already exists for this company`
- `400` -> validation issues

---

### 2) List Company Users (global list + filters)

- **Method:** `GET`
- **URL:** `/v1/company-users`

Query params:
- `companyId` (Mongo ObjectId)
- `companyKey` (business companyId string)
- `level` (`beginner|intermediate|advanced`)
- `status` (`true|false`)
- `search` (matches `fullName` or `email`)
- `sortBy` (example: `createdAt:desc`)
- `limit` (integer)
- `page` (integer)
- `populate` (optional)

Example:

```http
GET /v1/company-users?companyKey=ACME001&level=intermediate&status=true&search=rohit&sortBy=createdAt:desc&limit=10&page=1
```

Success:
- `200 OK` with paginated result:

```json
{
  "results": [],
  "page": 1,
  "limit": 10,
  "totalPages": 0,
  "totalResults": 0
}
```

---

### 3) List Users of One Company

- **Method:** `GET`
- **URL:** `/v1/company-users/by-company/:companyId`

`companyId` can be either:
- Mongo `_id` (24-char hex), or
- business `companyId` string (example `ACME001`)

Query params:
- `level`, `status`, `search`, `sortBy`, `limit`, `page`, `populate`

Example:

```http
GET /v1/company-users/by-company/ACME001?status=true&limit=20&page=1
```

Known errors:
- `404` -> `Company not found`

---

### 4) Get Company User by ID

- **Method:** `GET`
- **URL:** `/v1/company-users/:id`

Success:
- `200 OK` -> single user object

Not found:
- `404` -> 

```json
{
  "status": "fail",
  "message": "Company user not found"
}
```

---

### 5) Update Company User

- **Method:** `PATCH`
- **URL:** `/v1/company-users/:id`

Body can include one or more fields:

```json
{
  "fullName": "Rohit S.",
  "level": "advanced",
  "status": false
}
```

Known errors:
- `404` -> `Company user not found`
- `404` -> `Company not found` (if changing `companyId`)
- `409` -> `Email already exists for this company`
- `400` -> empty body or invalid fields

---

### 6) Delete Company User

- **Method:** `DELETE`
- **URL:** `/v1/company-users/:id`

Success:
- `204 No Content`

Known errors:
- `404` -> `Company user not found`

---

## Frontend Ready Snippets

## Axios Client

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/v1',
});

export const setAuthToken = (token) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};
```

## Company User API Service

```js
import { api } from './api';

export const companyUserApi = {
  create: (payload) => api.post('/company-users', payload),

  list: (params) => api.get('/company-users', { params }),

  listByCompany: (companyRef, params) => api.get(`/company-users/by-company/${companyRef}`, { params }),

  getById: (id) => api.get(`/company-users/${id}`),

  update: (id, payload) => api.patch(`/company-users/${id}`, payload),

  remove: (id) => api.delete(`/company-users/${id}`),
};
```

## Example React Usage

```js
const loadCompanyUsers = async () => {
  const { data } = await companyUserApi.listByCompany('ACME001', {
    status: true,
    limit: 10,
    page: 1,
    sortBy: 'createdAt:desc',
  });
  setRows(data.results);
  setMeta({
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    totalResults: data.totalResults,
  });
};
```

---

## Integration Notes

- For company-scoped screens, prefer `/by-company/:companyId` to avoid repeating `companyId` in query.
- `status` should be sent as boolean (`true/false`) from frontend.
- Use debounce for `search` input (300-500ms).
- Handle `409` explicitly on create/update email field and show user-friendly toast.
- Save both Mongo `_id` and business `companyId` in frontend state when possible.
