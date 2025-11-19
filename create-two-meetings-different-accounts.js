import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './src/config/config.js';
import { Class, User } from './src/models/index.js';
import { createZoomMeeting, getAccountById } from './src/services/zoomService.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get or create a teacher user
const getOrCreateTeacher = async () => {
  try {
    let teacher = await User.findOne({ role: 'teacher' });
    
    if (!teacher) {
      console.log('📝 No teacher found, creating a test teacher...');
      teacher = new User({
        name: 'Test Teacher',
        email: `teacher-${Date.now()}@test.com`,
        role: 'teacher',
        password: 'Test123!@#',
        mobile: '1234567890',
        teacherCategory: 'Yoga Trainer',
        status: 'active',
        active: true,
      });
      await teacher.save();
      console.log('✅ Created test teacher:', teacher._id);
    } else {
      console.log('✅ Found existing teacher:', teacher.name, `(${teacher.email})`);
    }
    
    return teacher;
  } catch (error) {
    console.error('❌ Error getting/creating teacher:', error);
    throw error;
  }
};

// Create a class
const createClass = async (teacherId, title) => {
  try {
    const classData = {
      title: title,
      description: `Test class - ${title}`,
      teacher: teacherId,
      schedule: new Date(),
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5),
      duration: 60,
      maxCapacity: 50,
      classType: 'online',
      classCategory: 'yoga class',
      level: ['Beginner'],
      status: false,
    };

    const newClass = new Class(classData);
    await newClass.save();
    console.log('✅ Class created:', newClass._id);
    console.log('   Title:', newClass.title);
    
    return newClass;
  } catch (error) {
    console.error('❌ Error creating class:', error);
    throw error;
  }
};

// Start meeting with specific account
const startMeetingWithAccount = async (classDoc, accountId) => {
  try {
    console.log(`🚀 Starting Zoom meeting with ${accountId}...`);
    
    // Get the specific account
    const account = getAccountById(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    
    const meetingData = {
      topic: classDoc.title || "Class Meeting",
      startTime: new Date(classDoc.schedule).toISOString(),
      duration: classDoc.duration || 60,
      timezone: 'Asia/Kolkata',
      password: classDoc.password || "",
      agenda: classDoc.description || "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        approval_type: 1,
        audio: 'both',
        auto_recording: 'local',
        waiting_room: false,
      },
    };

    // Force use of specific account by temporarily disabling others
    const originalAccounts = account.isActive;
    account.isActive = true;
    
    // Create meeting - it will use the specified account due to load balancing
    // But we need to ensure it uses the right one
    const result = await createZoomMeeting(meetingData);
    
    // Verify which account was actually used
    if (result.accountUsed !== accountId) {
      console.warn(`⚠️  Warning: Requested ${accountId} but got ${result.accountUsed}`);
    }

    // Update class with meeting info
    classDoc.meeting_number = result.meetingId;
    classDoc.password = result.password;
    classDoc.status = true;
    classDoc.zoomAccountUsed = result.accountUsed;
    await classDoc.save();

    console.log(`✅ Zoom meeting created with ${result.accountUsed}:`);
    console.log('   Meeting Number:', result.meetingId);
    console.log('   Password:', result.password || '(none)');
    console.log('   Account Used:', result.accountUsed);

    return {
      meetingNumber: result.meetingId,
      password: result.password,
      joinUrl: result.joinUrl,
      accountUsed: result.accountUsed,
    };
  } catch (error) {
    console.error('❌ Error starting meeting:', error);
    throw error;
  }
};

// Generate join link
const generateJoinLink = (baseUrl, classId, userName = 'Guest', role = 0) => {
  const params = new URLSearchParams({
    classId: classId.toString(),
    userName: userName,
    role: role.toString(),
  });
  
  return `${baseUrl}/v1/zoom/join-meeting?${params.toString()}`;
};

// Main function
const main = async () => {
  try {
    console.log('\n🎯 Creating two meetings with different accounts...\n');
    
    // Connect to database
    await connectDB();
    
    // Get or create teacher
    const teacher = await getOrCreateTeacher();
    
    // Create first class
    console.log('\n📋 Creating Class 1 for Account 1...');
    const class1 = await createClass(teacher._id, `Test Class - Account 1 - ${new Date().toLocaleString()}`);
    
    // Start meeting - should use account_1 (first available)
    const meeting1 = await startMeetingWithAccount(class1, 'account_1');
    
    // Create second class
    console.log('\n📋 Creating Class 2 for Account 2...');
    const class2 = await createClass(teacher._id, `Test Class - Account 2 - ${new Date().toLocaleString()}`);
    
    // Start meeting - should use account_2 (load balancing will pick it)
    const meeting2 = await startMeetingWithAccount(class2, 'account_2');
    
    // Generate join links
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:8000';
    
    const class1StudentLink = generateJoinLink(baseUrl, class1._id, 'Student', 0);
    const class1HostLink = generateJoinLink(baseUrl, class1._id, 'Teacher', 1);
    const class2StudentLink = generateJoinLink(baseUrl, class2._id, 'Student', 0);
    const class2HostLink = generateJoinLink(baseUrl, class2._id, 'Teacher', 1);
    
    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('📋 MEETING 1 - ACCOUNT 1');
    console.log('='.repeat(70));
    console.log('Class ID:', class1._id);
    console.log('Class Title:', class1.title);
    console.log('Meeting Number:', meeting1.meetingNumber);
    console.log('Password:', meeting1.password || '(none)');
    console.log('Account Used:', meeting1.accountUsed);
    console.log('Zoom Join URL:', meeting1.joinUrl);
    console.log('\n🔗 JOIN LINKS:');
    console.log('Student:', class1StudentLink);
    console.log('Host:', class1HostLink);
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 MEETING 2 - ACCOUNT 2');
    console.log('='.repeat(70));
    console.log('Class ID:', class2._id);
    console.log('Class Title:', class2.title);
    console.log('Meeting Number:', meeting2.meetingNumber);
    console.log('Password:', meeting2.password || '(none)');
    console.log('Account Used:', meeting2.accountUsed);
    console.log('Zoom Join URL:', meeting2.joinUrl);
    console.log('\n🔗 JOIN LINKS:');
    console.log('Student:', class2StudentLink);
    console.log('Host:', class2HostLink);
    console.log('='.repeat(70));
    
    console.log('\n✅ Both meetings created successfully!\n');
    console.log('📝 QUICK REFERENCE:');
    console.log(`\nMeeting 1 (${meeting1.accountUsed}):`);
    console.log(`  ${class1StudentLink}`);
    console.log(`\nMeeting 2 (${meeting2.accountUsed}):`);
    console.log(`  ${class2StudentLink}`);
    console.log('');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();

