const axios = require('axios');

// Test the mood tracker API endpoint
async function testMoodTrackerAPI() {
  const baseURL = 'http://localhost:3000/v1'; // Adjust port as needed
  
  // You'll need to replace this with a valid auth token
  const authToken = 'YOUR_AUTH_TOKEN_HERE';
  
  const testData = {
    mood: 'Normal',
    moodId: 1,
    whatWasItAbout: ['work'],
    comments: 'good'
  };

  try {
    console.log('Testing mood tracker API with data:', testData);
    
    const response = await axios.post(`${baseURL}/trackers/mood`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success! Response:', response.data);
    
    // Verify the response contains the expected fields
    if (response.data.data) {
      const moodEntry = response.data.data;
      console.log('📊 Mood Entry Details:');
      console.log('- Mood:', moodEntry.mood);
      console.log('- Mood ID:', moodEntry.moodId);
      console.log('- What Was It About:', moodEntry.whatWasItAbout);
      console.log('- Comments:', moodEntry.comments);
      console.log('- Created At:', moodEntry.createdAt);
    }
    
  } catch (error) {
    console.error('❌ Error testing mood tracker API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testMoodTrackerAPI();
