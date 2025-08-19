# Period Cycles API Test Suite

This test suite will verify that all period cycles API endpoints are working correctly.

## Prerequisites

1. **Server Running**: Make sure your backend server is running on `http://localhost:3000`
2. **Database**: Ensure MongoDB is connected and accessible
3. **Test User**: The test uses `test@gmail.com` with OTP `1234`

## Installation

Install the required dependency:

```bash
npm install node-fetch@3.3.2
```

## Running the Tests

### Option 1: Using npm script
```bash
npm run test:period-cycles
```

### Option 2: Direct execution
```bash
node test-period-cycles.js
```

## What the Test Suite Does

The test suite will:

1. **🔐 Authenticate** - Send OTP and get JWT token
2. **🔄 Start Cycle** - Create a new period cycle
3. **📊 Get Current** - Retrieve current active cycle
4. **🔮 Get Predictions** - Fetch cycle predictions
5. **📝 Add Daily Log** - Add a sample daily log entry
6. **🔍 Get Cycle by ID** - Retrieve specific cycle details
7. **📝 Update Notes** - Update cycle notes
8. **📚 Get History** - Retrieve cycle history
9. **📈 Get Analytics** - Fetch cycle analytics
10. **✅ Complete Cycle** - Mark cycle as completed
11. **🗑️ Delete Cycle** - Clean up test data

## Expected Results

If everything is working correctly, you should see:

```
🚀 Starting Period Cycles API Test Suite
==========================================
Base URL: http://localhost:3000/v1
Test Email: test@gmail.com
Test OTP: 1234

🔐 Testing: Send Login OTP
✅ Send Login OTP - PASSED

🔑 Testing: Verify Login OTP
✅ Token obtained: eyJhbGciOiJIUzI1NiIs...
✅ User ID: 64f8a1b2c3d4e5f6a7b8c9d1
✅ Verify Login OTP - PASSED

🔄 Testing: Start New Period Cycle
✅ New cycle created: 64f8a1b2c3d4e5f6a7b8c9d2
✅ Cycle number: 1
✅ Status: Active
✅ Start New Cycle - PASSED

[... more tests ...]

📊 Test Results Summary
========================
Total Tests: 12
Passed: 12 ✅
Failed: 0 ❌
Success Rate: 100%

🎉 All tests passed! Period Cycles API is working correctly.
```

## Troubleshooting

### If Authentication Fails
- Check if the server is running
- Verify the test email exists in your database
- Check if OTP verification is working

### If API Calls Fail
- Verify the server is running on port 3000
- Check server logs for errors
- Ensure the period-cycles routes are properly registered

### If Database Errors Occur
- Check MongoDB connection
- Verify the PeriodCycle model is properly exported
- Check for any syntax errors in model files

## Test Data Cleanup

The test suite automatically cleans up after itself by deleting the test cycle. If tests fail partway through, you may need to manually clean up test data from your database.

## Customization

You can modify the test by changing:

- `BASE_URL` - Change the server URL
- `TEST_EMAIL` - Use a different test email
- `TEST_OTP` - Use a different OTP value
- Test data in individual test functions

## Next Steps

After successful tests:

1. **Frontend Integration** - Use the working API endpoints in your frontend
2. **Error Handling** - Implement proper error handling based on test results
3. **User Experience** - Build UI components for cycle tracking
4. **Production Testing** - Test with real user data and edge cases
