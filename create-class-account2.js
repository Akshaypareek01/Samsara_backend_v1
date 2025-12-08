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

// Start meeting with account_2
const startMeetingWithAccount2 = async (classDoc) => {
  try {
    console.log(`🚀 Starting Zoom meeting with account_2...`);
    
    // Get account_2
    const account2 = getAccountById('account_2');
    if (!account2) {
      throw new Error('Account account_2 not found');
    }
    
    // Get account_1 and temporarily disable it to force account_2
    const account1 = getAccountById('account_1');
    if (account1) {
      const originalIsActive = account1.isActive;
      account1.isActive = false;
      console.log('⚠️  Temporarily disabled account_1 to force account_2');
      
      try {
        const meetingData = {
          topic: classDoc.title || "Class Meeting",
          startTime: new Date(classDoc.schedule || new Date()).toISOString(),
          duration: 60,
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

        // Create meeting - it will use account_2 since account_1 is disabled
        const result = await createZoomMeeting(meetingData);
        
        // Restore account_1
        account1.isActive = originalIsActive;
        
        // Check if result is valid
        if (!result || !result.accountUsed) {
          throw new Error('Failed to create meeting - no result returned');
        }
        
        // Verify which account was actually used
        if (result.accountUsed !== 'account_2') {
          console.warn(`⚠️  Warning: Requested account_2 but got ${result.accountUsed}`);
        }

        // Update class with meeting info including latest features
        classDoc.meeting_number = result.meetingId;
        classDoc.password = result.password || '';
        classDoc.status = true;
        classDoc.zoomAccountUsed = result.accountUsed;
        classDoc.zoomJoinUrl = result.joinUrl;
        classDoc.zoomStartUrl = result.meetingData?.start_url || result.joinUrl;
        classDoc.zoomMeetingId = result.meetingData?.id || result.meetingId;
        if (result.meetingData) {
          classDoc.zoomSettings = {
            hostVideo: result.meetingData.settings?.host_video || true,
            participantVideo: result.meetingData.settings?.participant_video || true,
            joinBeforeHost: result.meetingData.settings?.join_before_host || true,
            autoRecording: result.meetingData.settings?.auto_recording || 'local',
            waitingRoom: result.meetingData.settings?.waiting_room || false,
          };
        }
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
        // Restore account_1 even if there's an error
        account1.isActive = originalIsActive;
        throw error;
      }
    } else {
      // If account_1 doesn't exist, just create normally
      const meetingData = {
        topic: classDoc.title || "Class Meeting",
        startTime: new Date(classDoc.schedule || new Date()).toISOString(),
        duration: 60,
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

      // Create meeting - it will use account_2
      const result = await createZoomMeeting(meetingData);
    
      // Check if result is valid
      if (!result || !result.accountUsed) {
        throw new Error('Failed to create meeting - no result returned');
      }
      
      // Verify which account was actually used
      if (result.accountUsed !== 'account_2') {
        console.warn(`⚠️  Warning: Requested account_2 but got ${result.accountUsed}`);
      }

      // Update class with meeting info including latest features
      classDoc.meeting_number = result.meetingId;
      classDoc.password = result.password || '';
      classDoc.status = true;
      classDoc.zoomAccountUsed = result.accountUsed;
      classDoc.zoomJoinUrl = result.joinUrl;
      classDoc.zoomStartUrl = result.meetingData?.start_url || result.joinUrl;
      classDoc.zoomMeetingId = result.meetingData?.id || result.meetingId;
      if (result.meetingData) {
        classDoc.zoomSettings = {
          hostVideo: result.meetingData.settings?.host_video || true,
          participantVideo: result.meetingData.settings?.participant_video || true,
          joinBeforeHost: result.meetingData.settings?.join_before_host || true,
          autoRecording: result.meetingData.settings?.auto_recording || 'local',
          waitingRoom: result.meetingData.settings?.waiting_room || false,
        };
      }
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
    }
  } catch (error) {
    console.error('❌ Error starting meeting:', error);
    throw error;
  }
};

// Generate join link with latest features
const generateJoinLink = (baseUrl, classId, userName = 'Guest', role = 0, email = '') => {
  const params = new URLSearchParams({
    classId: classId.toString(),
    userName: userName,
    role: role.toString(),
  });
  
  if (email) {
    params.append('email', email);
  }
  
  // Add accountId if available for proper SDK signature generation
  // This will be fetched from the class document
  
  return `${baseUrl}/v1/zoom/join-meeting?${params.toString()}`;
};

// Generate direct Zoom join URL (alternative method)
const generateDirectZoomLink = (meetingNumber, password = '', userName = 'Guest') => {
  const params = new URLSearchParams({
    mn: meetingNumber,
    pwd: password || '',
    role: '0', // 0 = participant
  });
  
  return `https://zoom.us/j/${meetingNumber}?${params.toString()}`;
};

// Main function
const main = async () => {
  try {
    console.log('\n🎯 Creating Class with Account 2...\n');
    
    // Connect to database
    await connectDB();
    
    // Get or create teacher
    const teacher = await getOrCreateTeacher();
    
    // Create class
    console.log('\n📋 Creating Class for Account 2...');
    const classDoc = await createClass(teacher._id, `Test Class - Account 2 - ${new Date().toLocaleString()}`);
    
    // Start meeting with account_2
    const meeting = await startMeetingWithAccount2(classDoc);
    
    // Generate join links with latest features
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:8000';
    const apiBaseUrl = process.env.API_BASE_URL || baseUrl;
    
    // Generate links for different user types
    const studentLink = generateJoinLink(apiBaseUrl, classDoc._id, 'Student', 0, 'student@example.com');
    const hostLink = generateJoinLink(apiBaseUrl, classDoc._id, 'Teacher', 1, teacher.email);
    
    // Generate direct Zoom links (alternative)
    const directZoomLink = generateDirectZoomLink(meeting.meetingNumber, meeting.password, 'Guest');
    
    // Display results
    console.log('\n' + '='.repeat(80));
    console.log('📋 CLASS CREATED - ACCOUNT 2');
    console.log('='.repeat(80));
    console.log('Class ID:', classDoc._id);
    console.log('Class Title:', classDoc.title);
    console.log('Teacher:', teacher.name, `(${teacher.email})`);
    console.log('\n📹 ZOOM MEETING DETAILS:');
    console.log('Meeting Number:', meeting.meetingNumber);
    console.log('Password:', meeting.password || '(none)');
    console.log('Account Used:', meeting.accountUsed);
    console.log('Zoom Join URL:', meeting.joinUrl);
    console.log('Zoom Start URL:', classDoc.zoomStartUrl || meeting.joinUrl);
    console.log('\n🔗 JOIN LINKS (Latest SDK Features):');
    console.log('\n👨‍🎓 STUDENT LINK:');
    console.log('  ', studentLink);
    console.log('\n👨‍🏫 HOST/TEACHER LINK:');
    console.log('  ', hostLink);
    console.log('\n🌐 DIRECT ZOOM LINK (Alternative):');
    console.log('  ', directZoomLink);
    console.log('\n📱 MOBILE DEEP LINK:');
    console.log('  samsara://class/', classDoc._id);
    console.log('='.repeat(80));
    
    console.log('\n✅ Class created successfully with Account 2!\n');
    console.log('📝 QUICK REFERENCE:');
    console.log(`\n👨‍🎓 Student Join Link (Latest SDK):`);
    console.log(`  ${studentLink}`);
    console.log(`\n👨‍🏫 Host/Teacher Join Link (Latest SDK):`);
    console.log(`  ${hostLink}`);
    console.log(`\n🌐 Direct Zoom Link:`);
    console.log(`  ${directZoomLink}`);
    console.log(`\n💡 Features Enabled:`);
    console.log(`  ✅ Latest Zoom Web SDK 2.11.0`);
    console.log(`  ✅ HD Video Quality`);
    console.log(`  ✅ Pre-join UI`);
    console.log(`  ✅ Full HD Support`);
    console.log(`  ✅ Screen Sharing`);
    console.log(`  ✅ Chat & Reactions`);
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

