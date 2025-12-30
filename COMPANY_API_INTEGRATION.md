# Company API Integration Documentation

This document provides comprehensive API integration guide for Company Management System, including both **Main Admin APIs** (for managing companies) and **Company Dashboard APIs** (for companies to login and manage themselves).

## Table of Contents
1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Main Admin APIs](#main-admin-apis)
4. [Company Dashboard APIs](#company-dashboard-apis)
5. [Company Model Schema](#company-model-schema)
6. [Error Handling](#error-handling)
7. [Integration Examples](#integration-examples)

---

## Overview

The Company Management System provides two distinct access levels:

1. **Main Admin Dashboard**: For platform administrators to create, manage, and monitor companies
2. **Company Dashboard**: For individual companies to login, view their profile, and manage their information

### Base URL
```
Production: https://api.samsara.com/v1
Development: http://localhost:3000/v1
```

### Authentication
- **Main Admin**: Uses admin JWT tokens (same as existing admin authentication)
  - **Admin Access**: Admins have **full access** to all company APIs and can perform all CRUD operations
  - Admins can create, read, update, and delete any company
  - Use admin token in `Authorization: Bearer <admin_token>` header
- **Company**: Uses company-specific JWT tokens (separate from user/admin tokens)
  - Companies can only access their own profile via `/companies/profile` endpoint
  - For other operations, companies must use their own company ID

---

## Authentication Flow

### Company Authentication (OTP-based)

Companies use OTP-based authentication for security:

1. **Send Login OTP**: Company provides email → receives OTP via email
2. **Verify OTP**: Company provides email + OTP → receives JWT tokens
3. **Use Tokens**: Include access token in `Authorization: Bearer <token>` header

### Token Structure

Company tokens include `userType: 'company'` in the JWT payload, allowing the system to distinguish company requests from user/admin requests.

---

## Main Admin APIs

These APIs are for platform administrators to manage companies. Most endpoints require **Admin Authentication**, except company registration which is public.

**Important**: 
- **Company Registration**: Public - anyone can register a company (no auth required)
- **Admins**: Can access **ALL** company endpoints using their admin JWT token (read, update, delete any company)
- **Companies**: Can only access their own data (via profile endpoints or using their own ID)

When an admin makes a request, the system automatically grants full access to all company operations.

### 1. Create Company (Public Registration)

Create a new company in the system. **This is a public endpoint** - anyone can register a company.

**Endpoint**: `POST /v1/companies`

**Auth**: Not Required (Public)
- **Anyone**: Can register a new company without authentication
- After registration, the company can login using their email and OTP

**Request Body**:
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
    "email": "john@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true
}
```

**Note**: 
- No authentication required - this is a public registration endpoint
- All fields are optional except that `companyId` is auto-generated
- After registration, use the company's email to login via OTP

**Response** (201 Created):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "ABC12345",
  "companyName": "Acme Corporation",
  "email": "contact@acme.com",
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Notes**:
- `companyId` is auto-generated (unique 8-character alphanumeric)
- All fields except `companyId` are optional
- `status` defaults to `true` if not provided

---

### 2. Get All Companies

Retrieve all companies with pagination and filtering.

**Endpoint**: `GET /v1/companies`

**Auth**: Required (Admin)
- **Admin**: Can see all companies with full filtering and pagination
- **Company**: Cannot access this endpoint (use profile endpoint instead)

**Query Parameters**:
- `companyName` (string, optional): Filter by company name
- `email` (string, optional): Filter by email
- `domain` (string, optional): Filter by domain
- `status` (boolean, optional): Filter by status (true/false)
- `companyId` (string, optional): Filter by companyId
- `sortBy` (string, optional): Sort field (e.g., "createdAt:desc", "companyName:asc")
- `limit` (number, optional): Results per page (default: 10)
- `page` (number, optional): Page number (default: 1)

**Example Request**:
```
GET /v1/companies?status=true&sortBy=createdAt:desc&limit=20&page=1
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "companyId": "ABC12345",
      "companyName": "Acme Corporation",
      "email": "contact@acme.com",
      "status": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "totalResults": 100
}
```

---

### 3. Get Company by MongoDB ID

Get a specific company by its MongoDB `_id`.

**Endpoint**: `GET /v1/companies/:id`

**Auth**: Required (Admin or Company)
- **Admin**: Can access any company by ID
- **Company**: Can only access their own company (should use profile endpoint instead)

**Path Parameters**:
- `id` (string, required): MongoDB ObjectId

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "ABC12345",
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
    "email": "john@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "status": "fail",
  "message": "Company not found"
}
```

---

### 4. Get Company by companyId

Get a specific company by its unique `companyId`.

**Endpoint**: `GET /v1/companies/company-id/:companyId`

**Auth**: Required (Admin)

**Path Parameters**:
- `companyId` (string, required): Unique company identifier

**Example Request**:
```
GET /v1/companies/company-id/ABC12345
```

**Response**: Same as Get Company by MongoDB ID

---

### 5. Update Company

Update company information.

**Endpoint**: `PATCH /v1/companies/:id`

**Auth**: Required (Admin or Company)
- **Admin**: Can update any company
- **Company**: Can only update their own company (should use profile endpoint instead)

**Path Parameters**:
- `id` (string, required): MongoDB ObjectId

**Request Body** (all fields optional):
```json
{
  "companyName": "Acme Corporation Updated",
  "email": "newemail@acme.com",
  "status": false,
  "contactPerson1": {
    "name": "John Updated",
    "email": "john.updated@acme.com"
  }
}
```

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "ABC12345",
  "companyName": "Acme Corporation Updated",
  "email": "newemail@acme.com",
  "status": false,
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Notes**:
- Only provided fields will be updated
- `companyId` cannot be changed
- At least one field must be provided

---

### 6. Delete Company

Delete a company from the system.

**Endpoint**: `DELETE /v1/companies/:id`

**Auth**: Required (Admin only)
- **Admin**: Can delete any company
- **Company**: Cannot delete companies

**Path Parameters**:
- `id` (string, required): MongoDB ObjectId

**Response** (204 No Content)

**Note**: This is a soft delete operation. Consider setting `status: false` instead for data retention.

---

## Company Dashboard APIs

These APIs are for companies to manage their own information. All endpoints require **Company Authentication**.

### 1. Check Company Exists (Public)

Check if a company exists by companyId. This is useful for registration/login flows.

**Endpoint**: `GET /v1/companies/check/:companyId`

**Auth**: Not Required (Public)

**Path Parameters**:
- `companyId` (string, required): Company identifier to check

**Response** (200 OK):
```json
{
  "exists": true
}
```

**Use Case**: Before showing login form, verify if companyId is valid.

---

### 2. Send Login OTP

Send OTP to company email for login.

**Endpoint**: `POST /v1/companies/login/send-otp`

**Auth**: Not Required (Public)

**Request Body**:
```json
{
  "email": "contact@acme.com"
}
```

**Response** (200 OK):
```json
{
  "message": "OTP sent successfully to your email"
}
```

**Error Responses**:

404 Not Found:
```json
{
  "code": 404,
  "message": "Company not found with this email. Please contact support."
}
```

403 Forbidden:
```json
{
  "code": 403,
  "message": "Company account is inactive. Please contact support."
}
```

**Notes**:
- OTP is valid for 10 minutes (configurable)
- OTP is sent to the company's registered email
- Company must have `status: true` to receive OTP

---

### 3. Verify Login OTP

Verify OTP and receive authentication tokens.

**Endpoint**: `POST /v1/companies/login/verify-otp`

**Auth**: Not Required (Public)

**Request Body**:
```json
{
  "email": "contact@acme.com",
  "otp": "1234"
}
```

**Response** (200 OK):
```json
{
  "company": {
    "id": "507f1f77bcf86cd799439011",
    "companyId": "ABC12345",
    "companyName": "Acme Corporation",
    "email": "contact@acme.com",
    "status": true
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

**Error Responses**:

401 Unauthorized:
```json
{
  "code": 401,
  "message": "Invalid or expired OTP"
}
```

**Notes**:
- Access token expires in 30 minutes (configurable)
- Refresh token expires in 7 days (configurable)
- Use access token in `Authorization: Bearer <token>` header for subsequent requests

---

### 4. Get Company Profile

Get the authenticated company's profile information.

**Endpoint**: `GET /v1/companies/profile`

**Auth**: Required (Company)

**Headers**:
```
Authorization: Bearer <company_access_token>
```

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "companyId": "ABC12345",
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
    "email": "john@acme.com",
    "mobileNumber": "+919876543210",
    "designation": "CEO"
  },
  "contactPerson2": {
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "mobileNumber": "+919876543211",
    "designation": "HR Manager"
  },
  "status": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 5. Update Company Profile

Update the authenticated company's own information.

**Endpoint**: `PATCH /v1/companies/profile`

**Auth**: Required (Company)

**Headers**:
```
Authorization: Bearer <company_access_token>
```

**Request Body** (all fields optional, but at least one required):
```json
{
  "companyName": "Acme Corporation Updated",
  "companyLogo": "https://example.com/new-logo.png",
  "numberOfEmployees": 200,
  "contactPerson1": {
    "name": "John Updated",
    "email": "john.updated@acme.com"
  }
}
```

**Response** (200 OK): Updated company object

**Notes**:
- Companies cannot update their own `status` field (only admins can)
- `companyId` cannot be changed
- At least one field must be provided

---

### 6. Refresh Company Tokens

Refresh the company's access token using refresh token.

**Endpoint**: `POST /v1/auth/refresh-tokens`

**Auth**: Not Required (Public)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "access": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": "2024-01-15T12:00:00.000Z"
  },
  "refresh": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": "2024-01-22T10:30:00.000Z"
  }
}
```

**Note**: This uses the existing refresh-tokens endpoint which should handle company tokens.

---

## Company Model Schema

### Full Schema

```javascript
{
  companyId: String,           // Unique, auto-generated, required
  companyName: String,         // Optional
  companyLogo: String,         // Optional (URL)
  email: String,               // Optional
  domain: String,              // Optional
  numberOfEmployees: Number,   // Optional
  gstNumber: String,           // Optional
  address: String,             // Optional
  city: String,                // Optional
  pincode: String,            // Optional
  country: String,             // Optional
  contactPerson1: {            // Optional
    name: String,
    email: String,
    mobileNumber: String,
    designation: String
  },
  contactPerson2: {            // Optional
    name: String,
    email: String,
    mobileNumber: String,
    designation: String
  },
  status: Boolean,             // Default: true
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

### Field Descriptions

- **companyId**: Unique 8-character alphanumeric identifier (e.g., "ABC12345"). Auto-generated, cannot be changed.
- **companyName**: Official name of the company
- **companyLogo**: URL to company logo image
- **email**: Primary contact email (used for login)
- **domain**: Company website domain
- **numberOfEmployees**: Total number of employees
- **gstNumber**: GST registration number (India)
- **address**: Street address
- **city**: City name
- **pincode**: Postal/ZIP code
- **country**: Country name
- **contactPerson1**: Primary contact person details
- **contactPerson2**: Secondary contact person details
- **status**: Active/inactive status (false = account disabled)

---

## Error Handling

### Standard Error Response Format

```json
{
  "code": 400,
  "message": "Error message description"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Resource deleted successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions or account inactive
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Authentication Errors

**401 Unauthorized** - Missing or invalid token:
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

**403 Forbidden** - Company account inactive:
```json
{
  "code": 403,
  "message": "Company account is inactive. Please contact support."
}
```

---

## Integration Examples

### Example 1: Public Company Registration

```javascript
// 1. Register Company (Public - No auth required)
const createCompanyResponse = await fetch('https://api.samsara.com/v1/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'Acme Corporation',
    email: 'contact@acme.com',
    domain: 'acme.com',
    contactPerson1: {
      name: 'John Doe',
      email: 'john@acme.com',
      mobileNumber: '+919876543210',
      designation: 'CEO'
    }
  })
});
const company = await createCompanyResponse.json();
console.log('Company created:', company.companyId); // e.g., "ABC12345"

// 2. Company can now login using their email
// (See Example 2 for login flow)
```

### Example 1b: Admin - Manage Companies

```javascript
// 1. Admin Login
const adminLoginResponse = await fetch('https://api.samsara.com/v1/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@samsara.com',
    password: 'adminPassword123'
  })
});
const { admin, tokens } = await adminLoginResponse.json();
const adminToken = tokens.access.token;

// 2. Get All Companies
const companiesResponse = await fetch(
  'https://api.samsara.com/v1/companies?status=true&limit=10',
  {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }
);
const { results } = await companiesResponse.json();

// 3. Update any company
const updateResponse = await fetch('https://api.samsara.com/v1/companies/507f1f77bcf86cd799439011', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ status: false })
});
```

### Example 2: Company Dashboard - Login Flow

```javascript
// 1. Check if company exists (optional - for UI validation)
const checkResponse = await fetch('https://api.samsara.com/v1/companies/check/ABC12345');
const { exists } = await checkResponse.json();
if (!exists) {
  console.error('Company not found');
  return;
}

// 2. Send Login OTP
const otpResponse = await fetch('https://api.samsara.com/v1/companies/login/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'contact@acme.com'
  })
});
const otpResult = await otpResponse.json();
console.log(otpResult.message); // "OTP sent successfully to your email"

// 3. Verify OTP (after user enters OTP from email)
const verifyResponse = await fetch('https://api.samsara.com/v1/companies/login/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'contact@acme.com',
    otp: '1234' // OTP from email
  })
});
const { company, tokens } = await verifyResponse.json();

// 4. Store tokens
localStorage.setItem('companyToken', tokens.access.token);
localStorage.setItem('companyRefreshToken', tokens.refresh.token);
localStorage.setItem('companyId', company.id);

// 5. Get company profile using profile endpoint
const profileResponse = await fetch('https://api.samsara.com/v1/companies/profile', {
  headers: {
    'Authorization': `Bearer ${tokens.access.token}`
  }
});
const profile = await profileResponse.json();
```

### Example 3: Company Dashboard - Update Profile

```javascript
const companyToken = localStorage.getItem('companyToken');

// Update company profile using profile endpoint
const updateResponse = await fetch('https://api.samsara.com/v1/companies/profile', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${companyToken}`
  },
  body: JSON.stringify({
    companyName: 'Acme Corporation Updated',
    numberOfEmployees: 200,
    contactPerson1: {
      name: 'John Updated',
      email: 'john.updated@acme.com'
    }
  })
});
const updatedCompany = await updateResponse.json();
```

### Example 4: React Integration

```jsx
import { useState, useEffect } from 'react';

function CompanyLogin() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [company, setCompany] = useState(null);

  const sendOTP = async () => {
    try {
      const response = await fetch('https://api.samsara.com/v1/companies/login/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setStep('otp');
        alert('OTP sent to your email');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error sending OTP');
    }
  };

  const verifyOTP = async () => {
    try {
      const response = await fetch('https://api.samsara.com/v1/companies/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('companyToken', data.tokens.access.token);
        setCompany(data.company);
        alert('Login successful!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error verifying OTP');
    }
  };

  return (
    <div>
      {step === 'email' ? (
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Company Email"
          />
          <button onClick={sendOTP}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            maxLength="4"
          />
          <button onClick={verifyOTP}>Verify OTP</button>
        </div>
      )}
      {company && <div>Welcome, {company.companyName}!</div>}
    </div>
  );
}
```

---

## Admin Access Summary

### How Admin Access Works

The authentication middleware (`src/middlewares/auth.js`) automatically grants **full access** to all company APIs when an admin token is used. This means:

1. **Company Registration is PUBLIC** - Anyone can register a company without authentication
2. **Admins can access ALL company endpoints** using their admin JWT token (except registration which is public)
3. **No special admin routes needed** - admins use the same endpoints as companies
4. **Admins can perform all CRUD operations** on any company (read, update, delete)
5. **Profile endpoints** (`/companies/profile`) are restricted to companies only (admins should use `/companies/:id`)

### Example: Admin Accessing Company Data

```javascript
// 1. Admin logs in
const adminLogin = await fetch('https://api.samsara.com/v1/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@samsara.com',
    password: 'adminPassword'
  })
});
const { admin, tokens } = await adminLogin.json();
const adminToken = tokens.access.token;

// 2. Admin can now access ALL company endpoints
// Get all companies
const companies = await fetch('https://api.samsara.com/v1/companies', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Get specific company
const company = await fetch('https://api.samsara.com/v1/companies/507f1f77bcf86cd799439011', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Note: Company registration is PUBLIC (no auth needed)
// But admins can also create companies if needed
const newCompany = await fetch('https://api.samsara.com/v1/companies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // No Authorization header needed - public endpoint
  },
  body: JSON.stringify({
    companyName: 'New Company',
    email: 'contact@newcompany.com'
  })
});

// Update any company
const updated = await fetch('https://api.samsara.com/v1/companies/507f1f77bcf86cd799439011', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ companyName: 'Updated Name' })
});

// Delete any company
await fetch('https://api.samsara.com/v1/companies/507f1f77bcf86cd799439011', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

## Implementation Notes

### Additional Endpoints (Optional)

The following endpoints may be useful but are not currently implemented:

1. **POST /v1/companies/logout** - Logout and invalidate tokens
2. **POST /v1/companies/refresh-tokens** - Refresh company tokens (can use existing `/v1/auth/refresh-tokens`)

### Security Considerations

1. **OTP Expiration**: OTPs expire after 10 minutes (configurable in OTP service)
2. **Token Expiration**: 
   - Access tokens: 30 minutes
   - Refresh tokens: 7 days
3. **Account Status**: Companies with `status: false` cannot login
4. **Email Verification**: Consider adding email verification during company creation

### Best Practices

1. **Token Storage**: Store tokens securely (httpOnly cookies recommended for web)
2. **Token Refresh**: Implement automatic token refresh before expiration
3. **Error Handling**: Always handle 401/403 errors and redirect to login
4. **Loading States**: Show loading indicators during API calls
5. **Validation**: Validate companyId format before API calls

---

## API Endpoints Summary

### Main Admin APIs (Admin Auth Required)

| Method | Endpoint | Public Access | Admin Access | Company Access |
|--------|----------|---------------|--------------|----------------|
| POST | `/v1/companies` | ✅ Public registration | ✅ Full access | ✅ Can register |
| GET | `/v1/companies` | ❌ Not allowed | ✅ Full access (all companies) | ❌ Not allowed |
| GET | `/v1/companies/:id` | ❌ Not allowed | ✅ Full access (any company) | ⚠️ Own company only |
| GET | `/v1/companies/company-id/:companyId` | ❌ Not allowed | ✅ Full access (any company) | ⚠️ Own company only |
| PATCH | `/v1/companies/:id` | ❌ Not allowed | ✅ Full access (any company) | ⚠️ Own company only |
| DELETE | `/v1/companies/:id` | ❌ Not allowed | ✅ Full access | ❌ Not allowed |

**Legend:**
- ✅ **Full access**: Can perform operation on any company
- ⚠️ **Own company only**: Can only access/update their own company data
- ❌ **Not allowed**: Cannot perform this operation

### Company Dashboard APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/companies/check/:companyId` | None | Check if company exists |
| POST | `/v1/companies/login/send-otp` | None | Send login OTP |
| POST | `/v1/companies/login/verify-otp` | None | Verify OTP and get tokens |
| GET | `/v1/companies/profile` | Company | Get authenticated company profile |
| PATCH | `/v1/companies/profile` | Company | Update authenticated company profile |

---

## Support

For integration support or questions:
- Check existing code in `src/controllers/company.controllers.js`
- Review validation rules in `src/validations/company.validation.js`
- See service implementation in `src/services/company.service.js`

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0

