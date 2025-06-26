# OTP-Based Authentication System

This document describes the OTP-based authentication system implemented in the Samsara backend.

## Overview

The system provides two authentication flows:
1. **Traditional Password-based Authentication** - Email + Password
2. **OTP-based Authentication** - Email + OTP (4-digit code sent via email)

## User Types and Registration Requirements

### User Registration (Role: 'user')
- **Personal Users**: Email, name, userCategory: 'Personal'
- **Corporate Users**: Email, name, userCategory: 'Corporate', corporate_id

### Teacher Registration (Role: 'teacher')
- **Teachers**: Email, name, teacherCategory (Fitness Coach, Ayurveda Specialist, Mental Health Specialist, Yoga Trainer, General Trainer)

## Authentication Flow

### OTP-Based Registration Flow

1. **Send Registration OTP**
   - User provides email, name, role, and role-specific details
   - System checks if user already exists
   - If not, sends 4-digit OTP to email
   - OTP expires in 10 minutes

2. **Verify Registration OTP**
   - User provides email, OTP, and role-specific details
   - System verifies OTP
   - If valid, creates user account and returns JWT tokens
   - User is marked as active (email verified)

3. **Complete Profile** (Optional)
   - User can update additional profile details using JWT token
   - All user fields can be updated via profile endpoint

### OTP-Based Login Flow

1. **Send Login OTP**
   - User provides email
   - System checks if account exists
   - If exists, sends 4-digit OTP to email
   - If not exists, returns error suggesting registration

2. **Verify Login OTP**
   - User provides email and OTP
   - System verifies OTP
   - If valid, returns JWT tokens for authentication

## API Endpoints

### Registration Endpoints

#### POST `/v1/auth/send-registration-otp`
Send OTP for registration.

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

#### POST `/v1/auth/verify-registration-otp`
Verify OTP and complete registration.

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
    "active": true
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  },
  "message": "Registration successful"
}
```

### Login Endpoints

#### POST `/v1/auth/send-login-otp`
Send OTP for login.

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

#### POST `/v1/auth/verify-login-otp`
Verify OTP and login.

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

### Profile Management

#### GET `/v1/users/profile`
Get current user's profile.

**Headers:**
```
Authorization: Bearer <jwt_access_token>
```

#### PATCH `/v1/users/profile`
Update current user's profile.

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
  "userCategory": "Personal",
  "corporate_id": "CORP123456"
}
```

## Database Models

### OTP Model
```javascript
{
  email: String (required, indexed),
  otp: String (required, 4 digits),
  type: String (enum: 'registration', 'login'),
  isUsed: Boolean (default: false),
  expiresAt: Date (required, auto-delete after expiry),
  timestamps: true
}
```

### User Model
The user model includes all the fields from the original model plus:
- `role`: String (enum: 'user', 'teacher')
- `userCategory`: String (enum: 'Personal', 'Corporate') - for users only
- `teacherCategory`: String (enum: teacher categories) - for teachers only
- `corporate_id`: String - for corporate users only
- `active`: Boolean (default: false, set to true after OTP verification)

## Registration Requirements

### For Users (role: 'user')
- **Required**: email, name, userCategory
- **Conditional**: corporate_id (required if userCategory is 'Corporate')

### For Teachers (role: 'teacher')
- **Required**: email, name, teacherCategory
- **Teacher Categories**: Fitness Coach, Ayurveda Specialist, Mental Health Specialist, Yoga Trainer, General Trainer

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Single Use**: OTPs can only be used once
3. **Auto-cleanup**: Expired OTPs are automatically deleted from database
4. **Email Validation**: OTPs are sent to verified email addresses
5. **JWT Tokens**: Secure authentication tokens for API access
6. **Role-based Validation**: Different validation rules for users and teachers

## Error Handling

### Common Error Responses

**Account Not Found (404):**
```json
{
  "code": 404,
  "message": "Account not found. Please register first."
}
```

**Invalid OTP (401):**
```json
{
  "code": 401,
  "message": "Invalid or expired OTP"
}
```

**User Already Exists (409):**
```json
{
  "code": 409,
  "message": "User already exists with this email"
}
```

**Missing Required Fields (400):**
```json
{
  "code": 400,
  "message": "User category is required for user registration"
}
```

## Environment Variables

Make sure these environment variables are set for email functionality:

```env
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_email_username
SMTP_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourdomain.com
```

## Usage Examples

### Frontend Integration

1. **Personal User Registration:**
   ```javascript
   // Step 1: Send OTP
   const response = await fetch('/v1/auth/send-registration-otp', {
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
       otp: '1234',
       name: 'John Doe',
       role: 'user',
       userCategory: 'Personal'
     })
   });
   
   const { tokens } = await registerResponse.json();
   localStorage.setItem('accessToken', tokens.access);
   ```

2. **Corporate User Registration:**
   ```javascript
   // Step 1: Send OTP
   const response = await fetch('/v1/auth/send-registration-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       email: 'corporate@example.com',
       name: 'Jane Smith',
       role: 'user',
       userCategory: 'Corporate',
       corporate_id: 'CORP123456'
     })
   });
   
   // Step 2: Verify OTP and register
   const registerResponse = await fetch('/v1/auth/verify-registration-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       email: 'corporate@example.com',
       otp: '1234',
       name: 'Jane Smith',
       role: 'user',
       userCategory: 'Corporate',
       corporate_id: 'CORP123456'
     })
   });
   ```

3. **Teacher Registration:**
   ```javascript
   // Step 1: Send OTP
   const response = await fetch('/v1/auth/send-registration-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       email: 'teacher@example.com',
       name: 'Mike Johnson',
       role: 'teacher',
       teacherCategory: 'Yoga Trainer'
     })
   });
   
   // Step 2: Verify OTP and register
   const registerResponse = await fetch('/v1/auth/verify-registration-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       email: 'teacher@example.com',
       otp: '1234',
       name: 'Mike Johnson',
       role: 'teacher',
       teacherCategory: 'Yoga Trainer'
     })
   });
   ```

4. **Login Flow:**
   ```javascript
   // Step 1: Send OTP
   const response = await fetch('/v1/auth/send-login-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'user@example.com' })
   });
   
   // Step 2: Verify OTP and login
   const loginResponse = await fetch('/v1/auth/verify-login-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'user@example.com', otp: '1234' })
   });
   
   const { tokens } = await loginResponse.json();
   localStorage.setItem('accessToken', tokens.access);
   ```

5. **Update Profile:**
   ```javascript
   const updateResponse = await fetch('/v1/users/profile', {
     method: 'PATCH',
     headers: { 
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
     },
     body: JSON.stringify(profileData)
   });
   ```

## Testing

The system includes comprehensive validation for:
- Email format validation
- OTP format validation (4 digits)
- Required field validation based on role
- Role validation (user/teacher)
- User category validation (Personal/Corporate)
- Teacher category validation
- Corporate ID validation for corporate users

All endpoints include proper error handling and validation responses. 