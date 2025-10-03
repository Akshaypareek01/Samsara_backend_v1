import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL + '/samsara_dev');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestUser = async () => {
  try {
    await connectDB();
    
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: { type: String, default: 'user' },
      notificationToken: { type: String, default: '' }
    });
    
    const User = mongoose.model('Users', userSchema);
    
    // Check if user already exists
    const existingUser = await User.findById('686225adf7366b36a48fa65e');
    
    if (existingUser) {
      console.log('✅ User already exists:', {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        notificationToken: existingUser.notificationToken
      });
    } else {
      // Create test user
      const testUser = new User({
        _id: '686225adf7366b36a48fa65e',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        notificationToken: ''
      });
      
      await testUser.save();
      console.log('✅ Test user created:', {
        id: testUser._id,
        name: testUser.name,
        email: testUser.email
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

createTestUser();
