/**
 * Test script for custom session API to verify user data includes profileImage
 * Run with: node test-custom-session-api.js
 */

const testCustomSessionAPI = async () => {
  const baseURL = 'http://localhost:3000/v1'; // Adjust port as needed
  const teacherId = '6868f7814d18790474561a8d'; // Replace with actual teacher ID
  
  console.log('Testing Custom Session API for Teacher Sessions...\n');
  
  try {
    // Test the teacher sessions endpoint
    const response = await fetch(`${baseURL}/custom-sessions/teacher/${teacherId}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token if needed
      }
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    // Check if user data includes profileImage
    if (result && result.length > 0) {
      const firstSession = result[0];
      console.log('\n=== Session Data Analysis ===');
      console.log('Session ID:', firstSession._id);
      
      if (firstSession.user) {
        console.log('\n=== User Data ===');
        console.log('User ID:', firstSession.user._id);
        console.log('Name:', firstSession.user.name);
        console.log('Email:', firstSession.user.email);
        console.log('Profile Image:', firstSession.user.profileImage);
        console.log('About Me:', firstSession.user.AboutMe);
        console.log('Mobile:', firstSession.user.mobile);
        console.log('Gender:', firstSession.user.gender);
        console.log('City:', firstSession.user.city);
        console.log('Status:', firstSession.user.status);
        console.log('Active:', firstSession.user.active);
        console.log('User Category:', firstSession.user.userCategory);
        
        // Check if profileImage is present
        if (firstSession.user.profileImage) {
          console.log('✅ Profile Image is included in response');
        } else {
          console.log('❌ Profile Image is missing from response');
        }
      } else {
        console.log('❌ No user data found in session');
      }
      
      if (firstSession.teacher) {
        console.log('\n=== Teacher Data ===');
        console.log('Teacher ID:', firstSession.teacher._id);
        console.log('Name:', firstSession.teacher.name);
        console.log('Email:', firstSession.teacher.email);
        console.log('Profile Image:', firstSession.teacher.profileImage);
        console.log('About Me:', firstSession.teacher.AboutMe);
        console.log('Teacher Category:', firstSession.teacher.teacherCategory);
        console.log('Expertise:', firstSession.teacher.expertise);
      }
    } else {
      console.log('No sessions found for this teacher');
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Run test
testCustomSessionAPI(); 