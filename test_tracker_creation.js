import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import { 
  WeightTracker, 
  WaterTracker, 
  TemperatureTracker, 
  FatTracker, 
  BmiTracker, 
  BodyStatus, 
  StepTracker, 
  SleepTracker 
} from './src/models/index.js';
import config from './src/config/config.js';

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options);

async function testTrackerCreation() {
  try {
    console.log('Testing tracker creation for new user...');
    
    // Create a test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test.tracker@example.com',
      role: 'user',
      userCategory: 'Personal',
      active: true
    });
    
    console.log(`Created test user: ${testUser._id}`);
    
    // Check if trackers were created
    const trackers = await Promise.all([
      WeightTracker.findOne({ userId: testUser._id }),
      WaterTracker.findOne({ userId: testUser._id }),
      TemperatureTracker.findOne({ userId: testUser._id }),
      FatTracker.findOne({ userId: testUser._id }),
      BmiTracker.findOne({ userId: testUser._id }),
      BodyStatus.findOne({ userId: testUser._id }),
      StepTracker.findOne({ userId: testUser._id }),
      SleepTracker.findOne({ userId: testUser._id })
    ]);
    
    const trackerNames = ['WeightTracker', 'WaterTracker', 'TemperatureTracker', 'FatTracker', 'BmiTracker', 'BodyStatus', 'StepTracker', 'SleepTracker'];
    
    console.log('\nTracker creation results:');
    trackers.forEach((tracker, index) => {
      console.log(`${trackerNames[index]}: ${tracker ? '✅ Created' : '❌ Not created'}`);
    });
    
    // Clean up
    await User.findByIdAndDelete(testUser._id);
    await Promise.all([
      WeightTracker.deleteMany({ userId: testUser._id }),
      WaterTracker.deleteMany({ userId: testUser._id }),
      TemperatureTracker.deleteMany({ userId: testUser._id }),
      FatTracker.deleteMany({ userId: testUser._id }),
      BmiTracker.deleteMany({ userId: testUser._id }),
      BodyStatus.deleteMany({ userId: testUser._id }),
      StepTracker.deleteMany({ userId: testUser._id }),
      SleepTracker.deleteMany({ userId: testUser._id })
    ]);
    
    console.log('\nTest completed and cleaned up.');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testTrackerCreation(); 