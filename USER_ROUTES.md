# User Authentication Routes

This document provides all the available routes for user registration and login in the Samsara backend.

## Base URL
```
http://localhost:3000/v1/auth
```

## Available Routes

### 1. OTP-Based Registration (Recommended)

#### Step 1: Send Registration OTP
**POST** `/send-registration-otp`

**Description:** Send OTP to user's email for registration verification.

**Request Body Examples:**

**Personal User:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "userCategory": "Personal"
}
```

**Corporate User:**
```json
{
  "email": "corporate@example.com",
  "name": "Jane Smith",
  "role": "user",
  "userCategory": "Corporate",
  "corporate_id": "CORP123456"
}
```

**Teacher:**
```json
{
  "email": "teacher@example.com",
  "name": "Mike Johnson",
  "role": "teacher",
  "teacherCategory": "Yoga Trainer"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully to your email",
  "email": "user@example.com",
  "role": "user",
  "userCategory": "Personal"
}
```

#### Step 2: Verify Registration OTP
**POST** `/verify-registration-otp`

**Description:** Verify OTP and complete user registration.

**Request Body Examples:**

**Personal User:**
```json
{
  "email": "user@example.com",
  "otp": "1234",
  "name": "John Doe",
  "role": "user",
  "userCategory": "Personal"
}
```

**Corporate User:**
```json
{
  "email": "corporate@example.com",
  "otp": "1234",
  "name": "Jane Smith",
  "role": "user",
  "userCategory": "Corporate",
  "corporate_id": "CORP123456"
}
```

**Teacher:**
```json
{
  "email": "teacher@example.com",
  "otp": "1234",
  "name": "Mike Johnson",
  "role": "teacher",
  "teacherCategory": "Yoga Trainer"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "userCategory": "Personal",
    "active": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  },
  "message": "Registration successful"
}
```

### 2. OTP-Based Login

#### Step 1: Send Login OTP
**POST** `/send-login-otp`

**Description:** Send OTP to user's email for login verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully to your email"
}
```

#### Step 2: Verify Login OTP
**POST** `/verify-login-otp`

**Description:** Verify OTP and login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "userCategory": "Personal"
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```

### 3. Traditional Password-Based Authentication

#### Register with Password
**POST** `/register`

**Description:** Register user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```

#### Login with Password
**POST** `/login`

**Description:** Login user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```

### 4. Profile Management Routes

#### Get User Profile
**GET** `/v1/users/profile`

**Headers:**
```
Authorization: Bearer <jwt_access_token>
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "userCategory": "Personal",
  "gender": "Male",
  "dob": "1990-01-01",
  "age": "33",
  "Address": "123 Main St",
  "city": "New York",
  "pincode": "10001",
  "country": "USA",
  "height": "180cm",
  "weight": "75kg",
  "targetWeight": "70kg",
  "bodyshape": "Athletic",
  "weeklyyogaplan": "3 times per week",
  "practicetime": "Morning",
  "focusarea": ["Flexibility", "Strength"],
  "goal": ["Weight Loss", "Stress Relief"],
  "health_issues": ["Back Pain"],
  "howyouknowus": "Social Media",
  "PriorExperience": "Beginner",
  "description": "Fitness enthusiast",
  "achievements": ["Completed 30-day challenge"],
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update User Profile
**PATCH** `/v1/users/profile`

**Headers:**
```
Authorization: Bearer <jwt_access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "gender": "Male",
  "dob": "1990-01-01",
  "age": "33",
  "Address": "123 Main St",
  "city": "New York",
  "pincode": "10001",
  "country": "USA",
  "height": "180cm",
  "weight": "75kg",
  "targetWeight": "70kg",
  "bodyshape": "Athletic",
  "weeklyyogaplan": "3 times per week",
  "practicetime": "Morning",
  "focusarea": ["Flexibility", "Strength"],
  "goal": ["Weight Loss", "Stress Relief"],
  "health_issues": ["Back Pain"],
  "howyouknowus": "Social Media",
  "PriorExperience": "Beginner",
  "description": "Fitness enthusiast",
  "achievements": ["Completed 30-day challenge"],
  "mobile": "1234567890"
}
```

### 5. Other Authentication Routes

#### Logout
**POST** `/logout`

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### Refresh Tokens
**POST** `/refresh-tokens`

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### Forgot Password
**POST** `/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### Reset Password
**POST** `/reset-password?token=reset_token`

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

## User Types and Requirements

### Personal User (role: 'user', userCategory: 'Personal')
- **Required:** email, name, role, userCategory
- **Optional:** All profile fields

### Corporate User (role: 'user', userCategory: 'Corporate')
- **Required:** email, name, role, userCategory, corporate_id
- **Optional:** All profile fields

### Teacher (role: 'teacher')
- **Required:** email, name, role, teacherCategory
- **Teacher Categories:** Fitness Coach, Ayurveda Specialist, Mental Health Specialist, Yoga Trainer, General Trainer
- **Optional:** All profile fields

## Error Responses

### 400 Bad Request
```json
{
  "code": 400,
  "message": "User category is required for user registration"
}
```

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Invalid or expired OTP"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Account not found. Please register first."
}
```

### 409 Conflict
```json
{
  "code": 409,
  "message": "User already exists with this email"
}
```

## Usage Examples

### Frontend Integration (JavaScript)

```javascript
// 1. Personal User Registration
const registerPersonalUser = async () => {
  // Step 1: Send OTP
  const otpResponse = await fetch('/v1/auth/send-registration-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user',
      userCategory: 'Personal'
    })
  });
  
  // Step 2: Verify OTP and register
  const registerResponse = await fetch('/v1/auth/verify-registration-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      otp: '1234', // Replace with actual OTP
      name: 'John Doe',
      role: 'user',
      userCategory: 'Personal'
    })
  });
  
  const { tokens } = await registerResponse.json();
  localStorage.setItem('accessToken', tokens.access);
};

// 2. Login
const loginUser = async () => {
  // Step 1: Send OTP
  const otpResponse = await fetch('/v1/auth/send-login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
  });
  
  // Step 2: Verify OTP and login
  const loginResponse = await fetch('/v1/auth/verify-login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: 'user@example.com', 
      otp: '1234' // Replace with actual OTP
    })
  });
  
  const { tokens } = await loginResponse.json();
  localStorage.setItem('accessToken', tokens.access);
};

// 3. Update Profile
const updateProfile = async (profileData) => {
  const response = await fetch('/v1/users/profile', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(profileData)
  });
  
  return await response.json();
};
```

### cURL Examples

```bash
# 1. Send Registration OTP
curl -X POST http://localhost:3000/v1/auth/send-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "userCategory": "Personal"
  }'

# 2. Verify Registration OTP
curl -X POST http://localhost:3000/v1/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "1234",
    "name": "John Doe",
    "role": "user",
    "userCategory": "Personal"
  }'

# 3. Send Login OTP
curl -X POST http://localhost:3000/v1/auth/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# 4. Verify Login OTP
curl -X POST http://localhost:3000/v1/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "1234"
  }'

# 5. Get Profile
curl -X GET http://localhost:3000/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 6. Update Profile
curl -X PATCH http://localhost:3000/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Updated Name",
    "gender": "Male",
    "city": "New York"
  }'
```

## Notes

1. **OTP Expiration:** OTPs expire after 10 minutes
2. **Single Use:** OTPs can only be used once
3. **JWT Tokens:** Access tokens are used for authenticated requests
4. **Profile Updates:** Users can update their profile after registration
5. **Validation:** All inputs are validated according to the schema
6. **Error Handling:** Comprehensive error responses for all scenarios 