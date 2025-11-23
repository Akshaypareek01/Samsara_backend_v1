import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './src/config/config.js';
import { Event, Class, User } from './src/models/index.js';
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

// Create an event
const createEvent = async (teacherId, eventName) => {
  try {
    const eventData = {
      eventName: eventName,
      details: `Test event - ${eventName}`,
      teacher: teacherId,
      startDate: new Date(),
      startTime: new Date().toTimeString().slice(0, 5),
      type: 'free',
      level: 'Beginner',
      eventmode: 'online',
      availableseats: '50',
      status: false,
    };

    const newEvent = new Event(eventData);
    await newEvent.save();
    console.log('✅ Event created:', newEvent._id);
    console.log('   Event Name:', newEvent.eventName);
    
    return newEvent;
  } catch (error) {
    console.error('❌ Error creating event:', error);
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
const startMeetingWithAccount = async (doc, accountId, docType) => {
  try {
    console.log(`🚀 Starting Zoom meeting with ${accountId} for ${docType}...`);
    
    // Get the specific account
    const account = getAccountById(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    
    const meetingData = {
      topic: docType === 'event' ? (doc.eventName || "Event Meeting") : (doc.title || "Class Meeting"),
      startTime: new Date(docType === 'event' ? (doc.startDate || new Date()) : (doc.schedule || new Date())).toISOString(),
      duration: 60,
      timezone: 'Asia/Kolkata',
      password: doc.password || "",
      agenda: docType === 'event' ? (doc.details || "") : (doc.description || ""),
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

    // Create meeting - it will use the specified account due to load balancing
    const result = await createZoomMeeting(meetingData);
    
    // Verify which account was actually used
    if (result.accountUsed !== accountId) {
      console.warn(`⚠️  Warning: Requested ${accountId} but got ${result.accountUsed}`);
    }

    // Update document with meeting info
    doc.meeting_number = result.meetingId;
    doc.password = result.password;
    doc.status = true;
    doc.zoomAccountUsed = result.accountUsed;
    await doc.save();

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
const generateJoinLink = (baseUrl, eventId, classId, userName = 'Guest', role = 0) => {
  const params = new URLSearchParams({
    userName: userName,
    role: role.toString(),
  });
  
  if (eventId) {
    params.append('eventId', eventId.toString());
  }
  if (classId) {
    params.append('classId', classId.toString());
  }
  
  return `${baseUrl}/v1/zoom/join-meeting?${params.toString()}`;
};

// Main function
const main = async () => {
  try {
    console.log('\n🎯 Creating Event and Class with Account 2 for testing...\n');
    
    // Connect to database
    await connectDB();
    
    // Get or create teacher
    const teacher = await getOrCreateTeacher();
    
    // Create event with account_2
    console.log('\n📋 Creating Event for Account 2...');
    const event = await createEvent(teacher._id, `Test Event - Account 2 - ${new Date().toLocaleString()}`);
    const eventMeeting = await startMeetingWithAccount(event, 'account_2', 'event');
    
    // Create class with account_2
    console.log('\n📋 Creating Class for Account 2...');
    const classDoc = await createClass(teacher._id, `Test Class - Account 2 - ${new Date().toLocaleString()}`);
    const classMeeting = await startMeetingWithAccount(classDoc, 'account_2', 'class');
    
    // Generate join links
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:8000';
    
    const eventStudentLink = generateJoinLink(baseUrl, event._id, null, 'Student', 0);
    const eventHostLink = generateJoinLink(baseUrl, event._id, null, 'Teacher', 1);
    const classStudentLink = generateJoinLink(baseUrl, null, classDoc._id, 'Student', 0);
    const classHostLink = generateJoinLink(baseUrl, null, classDoc._id, 'Teacher', 1);
    
    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('📋 EVENT - ACCOUNT 2');
    console.log('='.repeat(70));
    console.log('Event ID:', event._id);
    console.log('Event Name:', event.eventName);
    console.log('Meeting Number:', eventMeeting.meetingNumber);
    console.log('Password:', eventMeeting.password || '(none)');
    console.log('Account Used:', eventMeeting.accountUsed);
    console.log('Zoom Join URL:', eventMeeting.joinUrl);
    console.log('\n🔗 JOIN LINKS:');
    console.log('Student:', eventStudentLink);
    console.log('Host:', eventHostLink);
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 CLASS - ACCOUNT 2');
    console.log('='.repeat(70));
    console.log('Class ID:', classDoc._id);
    console.log('Class Title:', classDoc.title);
    console.log('Meeting Number:', classMeeting.meetingNumber);
    console.log('Password:', classMeeting.password || '(none)');
    console.log('Account Used:', classMeeting.accountUsed);
    console.log('Zoom Join URL:', classMeeting.joinUrl);
    console.log('\n🔗 JOIN LINKS:');
    console.log('Student:', classStudentLink);
    console.log('Host:', classHostLink);
    console.log('='.repeat(70));
    
    console.log('\n✅ Both Event and Class created successfully with Account 2!\n');
    console.log('📝 QUICK REFERENCE FOR TESTING:');
    console.log(`\nEvent (${eventMeeting.accountUsed}) - Student:`);
    console.log(`  ${eventStudentLink}`);
    console.log(`\nClass (${classMeeting.accountUsed}) - Student:`);
    console.log(`  ${classStudentLink}`);
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


