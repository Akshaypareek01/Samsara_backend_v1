# Assessment API Testing Guide

This guide explains how to test the Menopause, Thyroid, and PCOS assessment APIs.

## Overview

The test suite covers three main assessment types:
- **Menopause Assessment**: 5 questions, 0-15 total score
- **Thyroid Assessment**: 20 questions, 0-20 total score  
- **PCOS Assessment**: 15 questions, 0-25 total score

## Files Created

1. `test_assessment_apis.js` - Main test file
2. `generate_test_token.js` - JWT token generator
3. `ASSESSMENT_API_TEST_README.md` - This guide

## Issues Fixed

### 1. Thyroid Assessment Model
- ✅ Added pre-save middleware for automatic scoring
- ✅ Added scoring methods for all 20 questions
- ✅ Added risk level calculation (Low/Moderate/High)
- ✅ Added recommendations based on risk level

### 2. PCOS Assessment Model  
- ✅ Added pre-save middleware for automatic scoring
- ✅ Added scoring methods for all 15 questions
- ✅ Added cycle length calculation
- ✅ Added risk level calculation (Low/Moderate/High)
- ✅ Added recommendations based on risk level

### 3. Menopause Assessment Model
- ✅ Already had proper scoring implementation
- ✅ No changes needed

## Setup Instructions

### 1. Install Dependencies
```bash
npm install axios jsonwebtoken
```

### 2. Configure JWT Secret
Edit `generate_test_token.js` and replace:
```javascript
const JWT_SECRET = 'your-jwt-secret-here'; // Replace with actual secret
```

### 3. Generate Test Token
```bash
node generate_test_token.js
```

### 4. Update Test Configuration
Edit `test_assessment_apis.js` and replace:
```javascript
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with generated token
```

### 5. Start Your API Server
```bash
npm start
# or
node src/index.js
```

### 6. Run Tests
```bash
node test_assessment_apis.js
```

## Test Coverage

### Each Assessment Type Tests:
1. **Get Questions** - Fetch assessment questions and options
2. **Calculate Risk Preview** - Calculate risk without saving
3. **Create Assessment** - Submit answers and create assessment
4. **Get Latest Assessment** - Retrieve most recent assessment
5. **Get Assessment History** - Get paginated history
6. **Get Assessment Statistics** - Get user statistics

### Error Cases Tested:
1. **Missing Required Fields** - Should return 400 error
2. **Invalid Answer Values** - Should return validation error
3. **No Authentication** - Should return 401 error

## Expected Test Results

### Menopause Assessment
- **Test Data Score**: ~5-7 points (Moderate Risk)
- **Questions**: 5 questions
- **Risk Levels**: High Risk, Moderate Risk, Low-Moderate Risk, Low Risk

### Thyroid Assessment  
- **Test Data Score**: ~5-7 points (Moderate Risk)
- **Questions**: 20 questions
- **Risk Levels**: Low, Moderate, High

### PCOS Assessment
- **Test Data Score**: ~8-12 points (Moderate Risk)
- **Questions**: 15 questions
- **Risk Levels**: Low risk, Moderate risk, High risk

## API Endpoints Tested

### Menopause Assessment
- `GET /api/v1/menopause-assessment/questions`
- `POST /api/v1/menopause-assessment/calculate-risk`
- `POST /api/v1/menopause-assessment`
- `GET /api/v1/menopause-assessment/latest`
- `GET /api/v1/menopause-assessment/history`
- `GET /api/v1/menopause-assessment/stats`

### Thyroid Assessment
- `GET /api/v1/thyroid-assessment/questions`
- `POST /api/v1/thyroid-assessment/calculate-risk`
- `POST /api/v1/thyroid-assessment`
- `GET /api/v1/thyroid-assessment/latest`
- `GET /api/v1/thyroid-assessment/history`
- `GET /api/v1/thyroid-assessment/stats`

### PCOS Assessment
- `GET /api/v1/pcos-assessment/questions`
- `POST /api/v1/pcos-assessment/calculate-risk`
- `POST /api/v1/pcos-assessment`
- `GET /api/v1/pcos-assessment/latest`
- `GET /api/v1/pcos-assessment/history`
- `GET /api/v1/pcos-assessment/stats`

## Scoring Systems

### Menopause Assessment (0-15 total score)
- Each question: 0-3 points (higher = lower risk)
- Average score determines risk level:
  - 0-0.5: High Risk
  - 0.5-1.5: Moderate Risk
  - 1.5-2.5: Low-Moderate Risk
  - 2.5+: Low Risk

### Thyroid Assessment (0-20 total score)
- Questions weighted 0-2 points each
- Risk levels:
  - 0-3: Low Risk
  - 4-7: Moderate Risk
  - 8+: High Risk

### PCOS Assessment (0-25 total score)
- Questions weighted 0-3 points each
- Risk levels:
  - 0-5: Low Risk
  - 6-12: Moderate Risk
  - 13+: High Risk

## Troubleshooting

### Common Issues:

1. **JWT Token Invalid**
   - Regenerate token with correct secret
   - Check token expiration

2. **Server Not Running**
   - Ensure API server is started on port 3000
   - Check for any startup errors

3. **Database Connection Issues**
   - Verify MongoDB connection
   - Check database credentials

4. **Validation Errors**
   - Check answer values match enum options
   - Ensure all required fields are provided

### Debug Mode:
Add this to see detailed request/response:
```javascript
// In test_assessment_apis.js
const makeRequest = async (method, endpoint, data = null, token = TEST_TOKEN) => {
    console.log(`🔍 Making ${method} request to ${endpoint}`);
    if (data) console.log('📤 Request data:', JSON.stringify(data, null, 2));
    // ... rest of function
};
```

## User ID Used
- **Test User ID**: `686225adf7366b36a48fa65e`
- All assessments will be created under this user
- History and stats will be specific to this user

## Next Steps

After running tests:
1. Check database for created assessments
2. Verify scoring calculations are correct
3. Test with different answer combinations
4. Add more edge case tests if needed
