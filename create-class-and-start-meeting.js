import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './src/config/config.js';
import { Class, User } from './src/models/index.js';
import { createZoomMeeting } from './src/services/zoomService.js';

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
    // Try to find an existing teacher
    let teacher = await User.findOne({ role: 'teacher' });
    
    if (!teacher) {
      console.log('📝 No teacher found, creating a test teacher...');
      teacher = new User({
        name: 'Test Teacher',
        email: `teacher-${Date.now()}@test.com`, // Unique email
        role: 'teacher',
        password: 'Test123!@#', // Will be hashed automatically by pre-save hook
        mobile: '1234567890',
        teacherCategory: 'Yoga Trainer', // Required for teacher role
        status: 'active',
        active: true,
      });
      await teacher.save();
      console.log('✅ Created test teacher:', teacher._id);
      console.log('   Email:', teacher.email);
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
const createClass = async (teacherId) => {
  try {
    const classData = {
      title: `Test Class - ${new Date().toLocaleString()}`,
      description: 'This is a test class created by the script',
      teacher: teacherId,
      schedule: new Date(),
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5),
      duration: 60,
      maxCapacity: 50,
      classType: 'online',
      classCategory: 'yoga class',
      level: ['Beginner'],
      status: false, // Will be set to true when meeting is created
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

// Start the meeting (create Zoom meeting)
const startMeeting = async (classDoc) => {
  try {
    console.log('🚀 Starting Zoom meeting...');
    
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

    // Create Zoom meeting using the centralized service
    const result = await createZoomMeeting(meetingData);

    // Update class with meeting info
    classDoc.meeting_number = result.meetingId;
    classDoc.password = result.password;
    classDoc.status = true;
    classDoc.zoomAccountUsed = result.accountUsed;
    await classDoc.save();

    console.log('✅ Zoom meeting created successfully!');
    console.log('   Meeting Number:', result.meetingId);
    console.log('   Password:', result.password || '(none)');
    console.log('   Account Used:', result.accountUsed);
    console.log('   Join URL:', result.joinUrl);

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
    console.log('\n🎯 Starting class creation and meeting setup...\n');
    
    // Connect to database
    await connectDB();
    
    // Get or create teacher
    const teacher = await getOrCreateTeacher();
    
    // Create class
    const classDoc = await createClass(teacher._id);
    
    // Start meeting
    const meetingInfo = await startMeeting(classDoc);
    
    // Generate join links
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const studentJoinLink = generateJoinLink(baseUrl, classDoc._id, 'Student', 0);
    const hostJoinLink = generateJoinLink(baseUrl, classDoc._id, 'Teacher', 1);
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📋 CLASS & MEETING DETAILS');
    console.log('='.repeat(60));
    console.log('Class ID:', classDoc._id);
    console.log('Class Title:', classDoc.title);
    console.log('Teacher:', teacher.name, `(${teacher.email})`);
    console.log('\n📹 ZOOM MEETING INFO');
    console.log('Meeting Number:', meetingInfo.meetingNumber);
    console.log('Password:', meetingInfo.password || '(none)');
    console.log('Account Used:', meetingInfo.accountUsed);
    console.log('Zoom Join URL:', meetingInfo.joinUrl);
    console.log('\n🔗 JOIN LINKS');
    console.log('Student Join Link:', studentJoinLink);
    console.log('Host Join Link:', hostJoinLink);
    console.log('='.repeat(60));
    console.log('\n✅ All done! You can now use the join links above.\n');
    
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

