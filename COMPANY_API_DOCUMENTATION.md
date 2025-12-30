# Company API Documentation

Complete API documentation for Company CRUD operations. This document provides all endpoints, request/response formats, and examples for frontend integration.

## Base URL

```
http://localhost:3000/v1/company
```

**Note:** All endpoints are prefixed with `/v1/company` since the router is mounted at `/company` in the main routes file.

## Authentication

All endpoints (except `checkCompanyExists` and login endpoints) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Company Login:** Companies authenticate using email and OTP (One-Time Password). After successful login, you'll receive access and refresh tokens that should be used for authenticated requests.

---

## API Endpoints

### 1. Send Login OTP

Send a one-time password (OTP) to the company's registered email address for login.

**Endpoint:** `POST /v1/company/login/send-otp`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "contact@acme.com"
}
```

**Response:** `200 OK`

```json
{
  "message": "OTP sent successfully to your email"
}
```

**Error Responses:**

- `404 Not Found` - Company not found with this email
```json
{
  "statusCode": 404,
  "message": "Company not found with this email. Please contact support."
}
```

- `403 Forbidden` - Company account is inactive
```json
{
  "statusCode": 403,
  "message": "Company account is inactive. Please contact support."
}
```

- `400 Bad Request` - Validation error
```json
{
  "statusCode": 400,
  "message": "\"email\" must be a valid email"
}
```

**Note:** The OTP is valid for 10 minutes. For testing purposes, if the email is `test@gmail.com`, the OTP will always be `1234`.

---

### 2. Verify Login OTP

Verify the OTP and login to the company account. Returns company details and authentication tokens.

**Endpoint:** `POST /v1/company/login/verify-otp`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "contact@acme.com",
  "otp": "1234"
}
```

**Response:** `200 OK`

```json
{
  "company": {
    "id": "507f1f77bcf86cd799439011",
    "companyId": "A1B2C3D4",
    "companyName": "Acme Corporation",
    "companyLogo": "https://example.com/logo.png",
    "email": "contact@acme.com",
    "domain": "acme.com",
    "numberOfEmployees": 150,
    "gstNumber": "29ABCDE1234F1Z5",
    "address": "123 Business Street",
    "city": "Mumbai",
    "pincode": "400001",
    "country": "India",
    "contactPerson1": {
      "name": "John Doe",
      "email": "john.doe@acme.com",
      "mobileNumber": "+919876543210",
      "designation": "CEO"
    },
    "contactPerson2": {
      "name": "Jane Smith",
      "email": "jane.smith@acme.com",
      "mobileNumber": "+919876543211",
      "designation": "HR Manager"
    },
    "status": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-01-15T11:30:00.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-01-22T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- `404 Not Found` - Company not found
```json
{
  "statusCode": 404,
  "message": "Company not found with this email. Please contact support."
}
```

- `403 Forbidden` - Company account is inactive
```json
{
  "statusCode": 403,
  "message": "Company account is inactive. Please contact support."
}
```

- `401 Unauthorized` - Invalid or expired OTP
```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP"
}
```

- `400 Bad Request` - Validation error
```json
{
  "statusCode": 400,
  "message": "\"otp\" must be a 4-digit number"
}
```

**Note:** 
- Use the `access.token` in the Authorization header for subsequent authenticated requests
- The access token expires after the configured time (default: typically 30 minutes)
- Use the `refresh.token` to get a new access token when it expires
- Store both tokens securely on the client side

---

### 3. Create Company

Create a new company. A unique `companyId` will be automatically generated.

**Endpoint:** `POST /v1/company`

**Authentication:** Required

**Request Body:**

```json
{
  "companyName": "Acme Corporation",
  "companyLogo": "https://example.com/logo.png",
  "email": "contact@acme.com",
  "domain": "acme.com",
  "numberOfEmployees": 150,
  "gstNumber": "29ABCDE1234F1Z5",
  "address": "123 Business Street",
  "city": "Mumbai",
  "pincode": "400001",
  "country": "India",
  "contactPerson1": {
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane.smith@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true
}
```

**All fields are optional** except that at least one field must be provided.

**Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "A1B2C3D4",
  "companyName": "Acme Corporation",
  "companyLogo": "https://example.com/logo.png",
  "email": "contact@acme.com",
  "domain": "acme.com",
  "numberOfEmployees": 150,
  "gstNumber": "29ABCDE1234F1Z5",
  "address": "123 Business Street",
  "city": "Mumbai",
  "pincode": "400001",
  "country": "India",
  "contactPerson1": {
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane.smith@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
```json
{
  "statusCode": 400,
  "message": "\"email\" must be a valid email"
}
```

- `401 Unauthorized` - Missing or invalid token
```json
{
  "statusCode": 401,
  "message": "Please authenticate"
}
```

---

### 4. Get All Companies

Retrieve all companies with pagination and filtering support.

**Endpoint:** `GET /v1/company`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `companyName` | string | Filter by company name | `?companyName=Acme` |
| `email` | string | Filter by email | `?email=contact@acme.com` |
| `domain` | string | Filter by domain | `?domain=acme.com` |
| `status` | boolean | Filter by status | `?status=true` |
| `companyId` | string | Filter by companyId | `?companyId=A1B2C3D4` |
| `sortBy` | string | Sort field and order | `?sortBy=createdAt:desc` |
| `limit` | number | Results per page (default: 10) | `?limit=20` |
| `page` | number | Page number (default: 1) | `?page=2` |

**Example Request:**

```
GET /v1/company?status=true&limit=10&page=1&sortBy=createdAt:desc
```

**Response:** `200 OK`

```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "companyId": "A1B2C3D4",
      "companyName": "Acme Corporation",
      "companyLogo": "https://example.com/logo.png",
      "email": "contact@acme.com",
      "domain": "acme.com",
      "numberOfEmployees": 150,
      "gstNumber": "29ABCDE1234F1Z5",
      "address": "123 Business Street",
      "city": "Mumbai",
      "pincode": "400001",
      "country": "India",
      "contactPerson1": {
        "name": "John Doe",
        "email": "john.doe@acme.com",
        "mobileNumber": "+919876543210",
        "designation": "CEO"
      },
      "contactPerson2": {
        "name": "Jane Smith",
        "email": "jane.smith@acme.com",
        "mobileNumber": "+919876543211",
        "designation": "HR Manager"
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

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid query parameters

---

### 5. Get Company by MongoDB ID

Retrieve a specific company by its MongoDB `_id`.

**Endpoint:** `GET /v1/company/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB ObjectId (24 hex characters) |

**Example Request:**

```
GET /v1/company/507f1f77bcf86cd799439011
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "A1B2C3D4",
  "companyName": "Acme Corporation",
  "companyLogo": "https://example.com/logo.png",
  "email": "contact@acme.com",
  "domain": "acme.com",
  "numberOfEmployees": 150,
  "gstNumber": "29ABCDE1234F1Z5",
  "address": "123 Business Street",
  "city": "Mumbai",
  "pincode": "400001",
  "country": "India",
  "contactPerson1": {
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane.smith@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Company not found
```json
{
  "status": "fail",
  "message": "Company not found"
}
```

- `400 Bad Request` - Invalid ObjectId format
```json
{
  "statusCode": 400,
  "message": "\"id\" must be a valid mongo id"
}
```

---

### 6. Get Company by companyId

Retrieve a specific company by its unique `companyId` (not MongoDB `_id`).

**Endpoint:** `GET /v1/company/company-id/:companyId`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | string | Unique company identifier (e.g., "A1B2C3D4") |

**Example Request:**

```
GET /v1/company/company-id/A1B2C3D4
```

**Response:** `200 OK`

Same format as "Get Company by MongoDB ID" above.

**Error Responses:**

- `404 Not Found` - Company not found
```json
{
  "status": "fail",
  "message": "Company not found"
}
```

---

### 7. Check Company Exists

Check if a company exists by `companyId`. This endpoint does not require authentication.

**Endpoint:** `GET /v1/company/check/:companyId`

**Authentication:** Not required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | string | Unique company identifier |

**Example Request:**

```
GET /v1/company/check/A1B2C3D4
```

**Response:** `200 OK`

```json
{
  "exists": true
}
```

or

```json
{
  "exists": false
}
```

---

### 8. Update Company

Update an existing company by MongoDB `_id`. Only provided fields will be updated.

**Endpoint:** `PATCH /v1/company/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB ObjectId |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "companyName": "Acme Corporation Updated",
  "numberOfEmployees": 200,
  "status": false,
  "contactPerson1": {
    "name": "John Doe Updated",
    "email": "john.updated@acme.com"
  }
}
```

**Example Request:**

```
PATCH /v1/company/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "companyName": "Acme Corporation Updated",
  "numberOfEmployees": 200
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "A1B2C3D4",
  "companyName": "Acme Corporation Updated",
  "companyLogo": "https://example.com/logo.png",
  "email": "contact@acme.com",
  "domain": "acme.com",
  "numberOfEmployees": 200,
  "gstNumber": "29ABCDE1234F1Z5",
  "address": "123 Business Street",
  "city": "Mumbai",
  "pincode": "400001",
  "country": "India",
  "contactPerson1": {
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane.smith@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Company not found
```json
{
  "statusCode": 404,
  "message": "Company not found"
}
```

- `400 Bad Request` - Validation error or empty body
```json
{
  "statusCode": 400,
  "message": "\"body\" must contain at least 1 key"
}
```

---

### 9. Delete Company

Delete a company by MongoDB `_id`.

**Endpoint:** `DELETE /v1/company/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB ObjectId |

**Example Request:**

```
DELETE /v1/company/507f1f77bcf86cd799439011
```

**Response:** `204 No Content`

No response body.

**Error Responses:**

- `404 Not Found` - Company not found
```json
{
  "statusCode": 404,
  "message": "Company not found"
}
```

---

## Data Model

### Company Object

```typescript
interface Company {
  id: string;                    // MongoDB ObjectId
  companyId: string;             // Unique auto-generated identifier (e.g., "A1B2C3D4")
  companyName?: string;
  companyLogo?: string;          // URL to logo image
  email?: string;                // Valid email format
  domain?: string;
  numberOfEmployees?: number;   // Integer, >= 0
  gstNumber?: string;
  address?: string;
  city?: string;
  pincode?: string;
  country?: string;
  contactPerson1?: {
    name?: string;
    email?: string;              // Valid email format
    mobileNumber?: string;
    designation?: string;
  };
  contactPerson2?: {
    name?: string;
    email?: string;              // Valid email format
    mobileNumber?: string;
    designation?: string;
  };
  status?: boolean;              // Default: true
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

---

## Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)

```javascript
const API_BASE_URL = 'http://localhost:3000/v1/company';
const token = 'your_jwt_token_here';

// Create Company
async function createCompany(companyData) {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(companyData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Get All Companies
async function getAllCompanies(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Get Company by ID
async function getCompanyById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 404) {
    return null;
  }
  
  return await response.json();
}

// Update Company
async function updateCompany(id, updateData) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Delete Company
async function deleteCompany(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message);
  }
}

// Send Login OTP
async function sendCompanyLoginOTP(email) {
  const response = await fetch(`${API_BASE_URL}/login/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Verify Login OTP and Login
async function verifyCompanyLoginOTP(email, otp) {
  const response = await fetch(`${API_BASE_URL}/login/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, otp })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
  // Store tokens for future requests
  localStorage.setItem('companyToken', data.tokens.access.token);
  localStorage.setItem('companyRefreshToken', data.tokens.refresh.token);
  
  return data;
}

// Check Company Exists (No auth required)
async function checkCompanyExists(companyId) {
  const response = await fetch(`${API_BASE_URL}/check/${companyId}`);
  const data = await response.json();
  return data.exists;
}
```

### React Example - Company Login

```jsx
import { useState } from 'react';

function CompanyLogin() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/v1/company/login/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/v1/company/login/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      // Store tokens
      localStorage.setItem('companyToken', data.tokens.access.token);
      localStorage.setItem('companyRefreshToken', data.tokens.refresh.token);
      setCompany(data.company);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (company) {
    return (
      <div>
        <h1>Welcome, {company.companyName}!</h1>
        <p>You are successfully logged in.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Company Login</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {step === 'email' ? (
        <form onSubmit={handleSendOTP}>
          <input
            type="email"
            placeholder="Enter company email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <p>OTP sent to {email}</p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={4}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" onClick={() => setStep('email')}>
            Change Email
          </button>
        </form>
      )}
    </div>
  );
}
```

### React Example - Company List

```jsx
import { useState, useEffect } from 'react';

function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/v1/company', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('companyToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Companies</h1>
      {companies.map(company => (
        <div key={company.id}>
          <h2>{company.companyName}</h2>
          <p>ID: {company.companyId}</p>
          <p>Email: {company.email}</p>
        </div>
      ))}
    </div>
  );
}
```

### Axios Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/company',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Company API methods
export const companyAPI = {
  // Authentication
  sendLoginOTP: (email) => api.post('/login/send-otp', { email }),
  verifyLoginOTP: (email, otp) => api.post('/login/verify-otp', { email, otp }),
  
  // CRUD operations
  create: (data) => api.post('/', data),
  getAll: (params) => api.get('/', { params }),
  getById: (id) => api.get(`/${id}`),
  getByCompanyId: (companyId) => api.get(`/company-id/${companyId}`),
  checkExists: (companyId) => api.get(`/check/${companyId}`),
  update: (id, data) => api.patch(`/${id}`, data),
  delete: (id) => api.delete(`/${id}`)
};
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "statusCode": 400,
  "message": "Error message here"
}
```

Common HTTP Status Codes:

- `200` - Success
- `201` - Created
- `204` - No Content (Delete success)
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **companyId vs id**: 
   - `id` is the MongoDB `_id` (24 hex characters)
   - `companyId` is a unique auto-generated string identifier (e.g., "A1B2C3D4")

2. **Pagination**: The `getAllCompanies` endpoint supports pagination. Default limit is 10, default page is 1.

3. **Filtering**: You can filter companies by any field in the query parameters.

4. **Sorting**: Use `sortBy` parameter with format `field:order` (e.g., `createdAt:desc`, `companyName:asc`).

5. **Partial Updates**: The update endpoint (PATCH) only updates provided fields. Other fields remain unchanged.

6. **Validation**: All email fields are validated for proper email format. URLs (like `companyLogo`) are validated for proper URI format.

7. **Company Login**: Companies authenticate using email and OTP. The login flow consists of two steps:
   - First, send OTP to company email using `/login/send-otp`
   - Then, verify OTP and login using `/login/verify-otp`
   - Upon successful login, you'll receive access and refresh tokens
   - Use the access token in the Authorization header for authenticated requests

8. **Token Management**: 
   - Access tokens are used for API authentication
   - Refresh tokens can be used to obtain new access tokens when they expire
   - Store tokens securely on the client side (localStorage, secure cookies, etc.)
   - Tokens are automatically validated by the authentication middleware

