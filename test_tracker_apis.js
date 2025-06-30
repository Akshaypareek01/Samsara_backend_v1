import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000/v1';
let authToken = '';

// Comprehensive test user with all fields from the user model
const testUser = {
  name: 'Test User',
  email: 'comprehensive.testuser@example.com',
  password: 'SecurePassword123!',
  role: 'user',
  userCategory: 'Personal',
  gender: 'Male',
  mobile: '+919876543210',
  dob: '1990-05-15',
  age: '33',
  Address: '123 Test Street, Test Colony',
  city: 'Mumbai',
  pincode: '400001',
  country: 'India',
  height: '175',
  weight: '70',
  targetWeight: '65',
  bodyshape: 'Athletic',
  weeklyyogaplan: '3 times per week',
  practicetime: 'Morning 6 AM',
  focusarea: ['Weight Loss', 'Flexibility', 'Stress Relief'],
  goal: ['Lose 5 kg', 'Improve flexibility', 'Better sleep'],
  health_issues: ['Mild back pain', 'Stress'],
  howyouknowus: 'Social Media',
  PriorExperience: 'Beginner - 6 months of yoga',
  description: 'A comprehensive test user for thorough API testing with all tracker functionalities',
  achievements: ['Completed 30-day challenge', 'Improved flexibility'],
  status: true,
  active: true,
  notificationToken: 'test_notification_token_12345'
};

// Comprehensive test teacher with all fields from the user model
const testTeacher = {
  name: 'Test Teacher',
  email: 'comprehensive.testteacher@example.com',
  password: 'SecurePassword123!',
  role: 'teacher',
  teacherCategory: 'Yoga Trainer',
  teachingExperience: '5 years',
  expertise: ['Hatha Yoga', 'Vinyasa Flow', 'Meditation'],
  qualification: [
    {
      degree: 'Yoga Teacher Training',
      institution: 'International Yoga Academy',
      year: '2018'
    },
    {
      degree: 'Advanced Yoga Certification',
      institution: 'Yoga Alliance',
      year: '2020'
    }
  ],
  additional_courses: [
    {
      course: 'Anatomy for Yoga Teachers',
      institution: 'Yoga Medicine',
      year: '2019'
    }
  ],
  gender: 'Female',
  mobile: '+919876543211',
  dob: '1985-08-20',
  age: '38',
  Address: '456 Teacher Street, Teacher Colony',
  city: 'Delhi',
  pincode: '110001',
  country: 'India',
  height: '165',
  weight: '55',
  bodyshape: 'Slim',
  weeklyyogaplan: 'Daily practice',
  practicetime: 'Evening 7 PM',
  focusarea: ['Teaching', 'Advanced Asanas', 'Philosophy'],
  goal: ['Help 100 students', 'Master advanced poses', 'Write a book'],
  health_issues: [],
  howyouknowus: 'Professional Network',
  PriorExperience: 'Advanced practitioner with 10 years of experience',
  description: 'A comprehensive test teacher for thorough API testing with all tracker functionalities',
  achievements: ['Certified Yoga Teacher', 'Published articles', 'Workshop leader'],
  status: true,
  active: true,
  notificationToken: 'test_teacher_notification_token_12345'
};

// Comprehensive test corporate user with all fields from the user model
const testCorporateUser = {
  name: 'Test Corporate',
  email: 'comprehensive.testcorporate@example.com',
  password: 'SecurePassword123!',
  role: 'user',
  userCategory: 'Corporate',
  corporate_id: 'CORP001',
  company_name: 'Test Company Ltd',
  companyId: 'COMP001',
  gender: 'Female',
  mobile: '+919876543212',
  dob: '1988-12-10',
  age: '35',
  Address: '789 Corporate Street, Business District',
  city: 'Bangalore',
  pincode: '560001',
  country: 'India',
  height: '160',
  weight: '58',
  targetWeight: '55',
  bodyshape: 'Average',
  weeklyyogaplan: '2 times per week',
  practicetime: 'Lunch break 1 PM',
  focusarea: ['Stress Management', 'Posture Correction', 'Work-Life Balance'],
  goal: ['Reduce stress', 'Improve posture', 'Better work performance'],
  health_issues: ['Neck pain', 'Eye strain', 'Work stress'],
  howyouknowus: 'Company Wellness Program',
  PriorExperience: 'Beginner - No prior experience',
  description: 'A comprehensive test corporate user for thorough API testing with all tracker functionalities',
  achievements: ['Completed corporate wellness challenge'],
  status: true,
  active: true,
  notificationToken: 'test_corporate_notification_token_12345'
};

const trackerData = {
  weight: {
    currentWeight: { value: 70, unit: 'kg' },
    goalWeight: { value: 65, unit: 'kg' },
    startingWeight: { value: 75, unit: 'kg' },
    notes: 'Test weight entry'
  },
  water: {
    targetGlasses: 8,
    targetMl: 2000,
    intakeTimeline: [
      { amountMl: 250, time: '08:00 AM' },
      { amountMl: 500, time: '12:00 PM' }
    ],
    totalIntake: 1800,
    notes: 'Test water entry'
  },
  mood: {
    mood: 'Happy',
    note: 'Test mood entry'
  },
  temperature: {
    temperature: { value: 98.6, unit: 'F' },
    notes: 'Test temperature entry'
  },
  fat: {
    age: 30,
    gender: 'Male',
    height: { value: 175, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    bodyFat: { value: 15, unit: '%' },
    goal: 12,
    notes: 'Test fat entry'
  },
  bmi: {
    age: 30,
    gender: 'Male',
    height: { value: 175, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    notes: 'Test BMI entry'
  },
  bodyStatus: {
    height: { value: 175, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    chest: { value: 95, unit: 'cm' },
    waist: { value: 80, unit: 'cm' },
    notes: 'Test body status entry'
  },
  step: {
    steps: 8500,
    goal: 10000,
    distance: { value: 6.8, unit: 'km' },
    calories: 425,
    activeTime: 45,
    notes: 'Test step entry'
  },
  sleep: {
    sleepRate: 85,
    sleepTime: 450,
    hoursSlept: 7.5,
    bedtime: '22:30',
    wakeUpTime: '06:00',
    goal: 8,
    notes: 'Test sleep entry'
  }
};

// Helper function to make authenticated requests
const makeAuthRequest = async (method, url, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testAuth = async () => {
  console.log('\n🔐 Testing Authentication with Comprehensive User...');
  
  // Register with basic fields first (including required fields)
  const basicUserData = {
    name: testUser.name,
    email: testUser.email,
    password: testUser.password,
    role: testUser.role,
    userCategory: testUser.userCategory
  };
  
  try {
    await axios.post(`${BASE_URL}/auth/register`, basicUserData);
    console.log('✅ Basic user registered successfully');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Basic user already exists, proceeding with login');
    } else {
      console.error('❌ Failed to register basic user:', error.response?.data?.message);
      throw error;
    }
  }
  
  // Login
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  
  authToken = loginResponse.data.tokens.access.token;
  console.log('✅ Login successful with basic user');
  
  // Update profile with comprehensive data
  try {
    const comprehensiveData = {
      gender: testUser.gender,
      mobile: testUser.mobile,
      dob: testUser.dob,
      age: testUser.age,
      Address: testUser.Address,
      city: testUser.city,
      pincode: testUser.pincode,
      country: testUser.country,
      height: testUser.height,
      weight: testUser.weight,
      targetWeight: testUser.targetWeight,
      bodyshape: testUser.bodyshape,
      weeklyyogaplan: testUser.weeklyyogaplan,
      practicetime: testUser.practicetime,
      focusarea: testUser.focusarea,
      goal: testUser.goal,
      health_issues: testUser.health_issues,
      howyouknowus: testUser.howyouknowus,
      PriorExperience: testUser.PriorExperience,
      description: testUser.description,
      achievements: testUser.achievements,
      status: testUser.status,
      active: testUser.active,
      notificationToken: testUser.notificationToken
    };
    
    await makeAuthRequest('PUT', '/users/me', comprehensiveData);
    console.log('✅ User profile updated with comprehensive data');
  } catch (error) {
    console.error('❌ Failed to update user profile with comprehensive data:', error.response?.data?.message);
  }
};

const testTeacherAuth = async () => {
  console.log('\n👩‍🏫 Testing Teacher Authentication...');
  
  // Register with basic fields first (including required fields)
  const basicTeacherData = {
    name: testTeacher.name,
    email: testTeacher.email,
    password: testTeacher.password,
    role: testTeacher.role,
    teacherCategory: testTeacher.teacherCategory
  };
  
  try {
    await axios.post(`${BASE_URL}/auth/register`, basicTeacherData);
    console.log('✅ Basic teacher registered successfully');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Basic teacher already exists, proceeding with login');
    } else {
      console.error('❌ Failed to register basic teacher:', error.response?.data?.message);
      throw error;
    }
  }
  
  // Login as teacher
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    email: testTeacher.email,
    password: testTeacher.password
  });
  
  const teacherAuthToken = loginResponse.data.tokens.access.token;
  console.log('✅ Teacher login successful');
  
  // Update teacher profile with comprehensive data
  try {
    const comprehensiveTeacherData = {
      teachingExperience: testTeacher.teachingExperience,
      expertise: testTeacher.expertise,
      qualification: testTeacher.qualification,
      additional_courses: testTeacher.additional_courses,
      gender: testTeacher.gender,
      mobile: testTeacher.mobile,
      dob: testTeacher.dob,
      age: testTeacher.age,
      Address: testTeacher.Address,
      city: testTeacher.city,
      pincode: testTeacher.pincode,
      country: testTeacher.country,
      height: testTeacher.height,
      weight: testTeacher.weight,
      bodyshape: testTeacher.bodyshape,
      weeklyyogaplan: testTeacher.weeklyyogaplan,
      practicetime: testTeacher.practicetime,
      focusarea: testTeacher.focusarea,
      goal: testTeacher.goal,
      health_issues: testTeacher.health_issues,
      howyouknowus: testTeacher.howyouknowus,
      PriorExperience: testTeacher.PriorExperience,
      description: testTeacher.description,
      achievements: testTeacher.achievements,
      status: testTeacher.status,
      active: testTeacher.active,
      notificationToken: testTeacher.notificationToken
    };
    
    await axios.put(`${BASE_URL}/users/me`, comprehensiveTeacherData, {
      headers: { 'Authorization': `Bearer ${teacherAuthToken}` }
    });
    console.log('✅ Teacher profile updated with comprehensive data');
  } catch (error) {
    console.error('❌ Failed to update teacher profile with comprehensive data:', error.response?.data?.message);
  }
  
  // Test teacher-specific endpoints if they exist
  try {
    const teacherProfile = await axios.get(`${BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${teacherAuthToken}` }
    });
    console.log('✅ Teacher profile retrieved:', teacherProfile.data.role);
  } catch (error) {
    console.log('ℹ️  Teacher profile endpoint not available or failed');
  }
};

const testCorporateAuth = async () => {
  console.log('\n🏢 Testing Corporate User Authentication...');
  
  // Register with basic fields first (including required fields)
  const basicCorporateData = {
    name: testCorporateUser.name,
    email: testCorporateUser.email,
    password: testCorporateUser.password,
    role: testCorporateUser.role,
    userCategory: testCorporateUser.userCategory,
    corporate_id: testCorporateUser.corporate_id
  };
  
  try {
    await axios.post(`${BASE_URL}/auth/register`, basicCorporateData);
    console.log('✅ Basic corporate user registered successfully');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Basic corporate user already exists, proceeding with login');
    } else {
      console.error('❌ Failed to register basic corporate user:', error.response?.data?.message);
      throw error;
    }
  }
  
  // Login as corporate user
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    email: testCorporateUser.email,
    password: testCorporateUser.password
  });
  
  const corporateAuthToken = loginResponse.data.tokens.access.token;
  console.log('✅ Corporate user login successful');
  
  // Update corporate user profile with comprehensive data
  try {
    const comprehensiveCorporateData = {
      company_name: testCorporateUser.company_name,
      companyId: testCorporateUser.companyId,
      gender: testCorporateUser.gender,
      mobile: testCorporateUser.mobile,
      dob: testCorporateUser.dob,
      age: testCorporateUser.age,
      Address: testCorporateUser.Address,
      city: testCorporateUser.city,
      pincode: testCorporateUser.pincode,
      country: testCorporateUser.country,
      height: testCorporateUser.height,
      weight: testCorporateUser.weight,
      targetWeight: testCorporateUser.targetWeight,
      bodyshape: testCorporateUser.bodyshape,
      weeklyyogaplan: testCorporateUser.weeklyyogaplan,
      practicetime: testCorporateUser.practicetime,
      focusarea: testCorporateUser.focusarea,
      goal: testCorporateUser.goal,
      health_issues: testCorporateUser.health_issues,
      howyouknowus: testCorporateUser.howyouknowus,
      PriorExperience: testCorporateUser.PriorExperience,
      description: testCorporateUser.description,
      achievements: testCorporateUser.achievements,
      status: testCorporateUser.status,
      active: testCorporateUser.active,
      notificationToken: testCorporateUser.notificationToken
    };
    
    await axios.put(`${BASE_URL}/users/me`, comprehensiveCorporateData, {
      headers: { 'Authorization': `Bearer ${corporateAuthToken}` }
    });
    console.log('✅ Corporate user profile updated with comprehensive data');
  } catch (error) {
    console.error('❌ Failed to update corporate user profile with comprehensive data:', error.response?.data?.message);
  }
  
  // Test corporate user-specific endpoints if they exist
  try {
    const corporateProfile = await axios.get(`${BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${corporateAuthToken}` }
    });
    console.log('✅ Corporate user profile retrieved:', corporateProfile.data.userCategory);
    console.log(`   Corporate ID: ${corporateProfile.data.corporate_id}`);
    console.log(`   Company: ${corporateProfile.data.company_name}`);
  } catch (error) {
    console.log('ℹ️  Corporate user profile endpoint not available or failed');
  }
};

const testDashboard = async () => {
  console.log('\n📊 Testing Dashboard...');
  const dashboard = await makeAuthRequest('GET', '/trackers/dashboard');
  console.log('✅ Dashboard data retrieved:', Object.keys(dashboard));
};

const testUserProfile = async () => {
  console.log('\n👤 Testing User Profile Retrieval...');
  
  try {
    const profile = await makeAuthRequest('GET', '/users/me');
    console.log('✅ User profile retrieved successfully');
    console.log('📋 Profile details:');
    console.log(`   Name: ${profile.name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   User Category: ${profile.userCategory}`);
    console.log(`   Gender: ${profile.gender}`);
    console.log(`   Mobile: ${profile.mobile}`);
    console.log(`   Age: ${profile.age}`);
    console.log(`   City: ${profile.city}`);
    console.log(`   Height: ${profile.height}`);
    console.log(`   Weight: ${profile.weight}`);
    console.log(`   Target Weight: ${profile.targetWeight}`);
    console.log(`   Body Shape: ${profile.bodyshape}`);
    console.log(`   Focus Areas: ${profile.focusarea?.join(', ')}`);
    console.log(`   Goals: ${profile.goal?.join(', ')}`);
    console.log(`   Health Issues: ${profile.health_issues?.join(', ')}`);
    console.log(`   Achievements: ${profile.achievements?.join(', ')}`);
    console.log(`   Status: ${profile.status}`);
    console.log(`   Active: ${profile.active}`);
  } catch (error) {
    console.error('❌ Failed to retrieve user profile:', error.response?.data?.message);
  }
};

const testUserProfileUpdate = async () => {
  console.log('\n✏️  Testing User Profile Update...');
  
  try {
    const updateData = {
      name: 'Updated Comprehensive Test User',
      age: '34',
      height: '176',
      weight: '71',
      targetWeight: '66',
      bodyshape: 'Athletic',
      focusarea: ['Weight Loss', 'Flexibility', 'Stress Relief', 'Muscle Building'],
      goal: ['Lose 5 kg', 'Improve flexibility', 'Better sleep', 'Build muscle'],
      health_issues: ['Mild back pain', 'Stress', 'Knee discomfort'],
      achievements: ['Completed 30-day challenge', 'Improved flexibility', 'Lost 2 kg'],
      description: 'Updated comprehensive test user description for thorough API testing'
    };
    
    const updatedProfile = await makeAuthRequest('PUT', '/users/me', updateData);
    console.log('✅ User profile updated successfully');
    console.log('📋 Updated profile details:');
    console.log(`   Name: ${updatedProfile.name}`);
    console.log(`   Age: ${updatedProfile.age}`);
    console.log(`   Height: ${updatedProfile.height}`);
    console.log(`   Weight: ${updatedProfile.weight}`);
    console.log(`   Target Weight: ${updatedProfile.targetWeight}`);
    console.log(`   Body Shape: ${updatedProfile.bodyshape}`);
    console.log(`   Focus Areas: ${updatedProfile.focusarea?.join(', ')}`);
    console.log(`   Goals: ${updatedProfile.goal?.join(', ')}`);
    console.log(`   Health Issues: ${updatedProfile.health_issues?.join(', ')}`);
    console.log(`   Achievements: ${updatedProfile.achievements?.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to update user profile:', error.response?.data?.message);
  }
};

const testAddEntries = async () => {
  console.log('\n➕ Testing Add Entries...');
  
  for (const [trackerType, data] of Object.entries(trackerData)) {
    try {
      const entry = await makeAuthRequest('POST', `/trackers/${trackerType}`, data);
      console.log(`✅ ${trackerType} entry added:`, entry.id);
    } catch (error) {
      console.error(`❌ Failed to add ${trackerType} entry:`, error.response?.data?.message);
    }
  }
};

const testHistoryEndpoints = async () => {
  console.log('\n📈 Testing History Endpoints...');
  
  const trackerTypes = ['weight', 'water', 'mood', 'temperature', 'fat', 'bmi', 'body-status', 'step', 'sleep'];
  
  for (const trackerType of trackerTypes) {
    try {
      const history = await makeAuthRequest('GET', `/trackers/${trackerType}/history?days=7`);
      console.log(`✅ ${trackerType} history retrieved: ${history.length} entries`);
    } catch (error) {
      console.error(`❌ Failed to get ${trackerType} history:`, error.response?.data?.message);
    }
  }
};

const testUpdateEntry = async () => {
  console.log('\n✏️  Testing Update Entry...');
  
  try {
    // Get a weight entry to update
    const history = await makeAuthRequest('GET', '/trackers/weight/history?days=1');
    if (history.length > 0) {
      const entryId = history[0].id;
      const updateData = { notes: 'Updated test entry' };
      
      const updated = await makeAuthRequest('PUT', `/trackers/weight/${entryId}`, updateData);
      console.log('✅ Entry updated successfully:', updated.id);
    } else {
      console.log('ℹ️  No entries to update');
    }
  } catch (error) {
    console.error('❌ Failed to update entry:', error.response?.data?.message);
  }
};

const testDeleteEntry = async () => {
  console.log('\n🗑️  Testing Delete Entry...');
  
  try {
    // Get a mood entry to delete
    const history = await makeAuthRequest('GET', '/trackers/mood/history?days=1');
    if (history.length > 0) {
      const entryId = history[0].id;
      
      await makeAuthRequest('DELETE', `/trackers/mood/${entryId}`);
      console.log('✅ Entry deleted successfully');
    } else {
      console.log('ℹ️  No entries to delete');
    }
  } catch (error) {
    console.error('❌ Failed to delete entry:', error.response?.data?.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Tracker API Tests...');
  
  try {
    await testAuth();
    await testTeacherAuth();
    await testCorporateAuth();
    await testDashboard();
    await testUserProfile();
    await testUserProfileUpdate();
    await testAddEntries();
    await testHistoryEndpoints();
    await testUpdateEntry();
    await testDeleteEntry();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
runTests();
export {
  runTests,
  testAuth,
  testTeacherAuth,
  testCorporateAuth,
  testDashboard,
  testUserProfile,
  testUserProfileUpdate,
  testAddEntries,
  testHistoryEndpoints,
  testUpdateEntry,
  testDeleteEntry
}; 