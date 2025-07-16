/**
 * Test script for profile image update API
 * Run with: node test-profile-image-api.js
 */

const testProfileImageAPI = async () => {
  const baseURL = 'http://localhost:3000/v1'; // Adjust port as needed
  const testImageURL = 'https://example.com/test-image.jpg';
  
  console.log('Testing Profile Image Update API...\n');
  
  // Test cases
  const testCases = [
    {
      name: 'Valid image URL',
      data: { profileImage: testImageURL },
      expectedStatus: 200
    },
    {
      name: 'Missing image URL',
      data: {},
      expectedStatus: 400
    },
    {
      name: 'Invalid URL format',
      data: { profileImage: 'not-a-valid-url' },
      expectedStatus: 400
    },
    {
      name: 'Empty image URL',
      data: { profileImage: '' },
      expectedStatus: 400
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Data:`, testCase.data);
    
    try {
      const response = await fetch(`${baseURL}/users/profile/image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, result);
      console.log(`Expected: ${testCase.expectedStatus}`);
      console.log(`Test ${response.status === testCase.expectedStatus ? 'PASSED' : 'FAILED'}`);
      console.log('---\n');
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log('---\n');
    }
  }
};

// Run test
testProfileImageAPI(); 