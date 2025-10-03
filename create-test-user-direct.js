import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
      userCategory: String,
      notificationToken: { type: String, default: '' },
      active: { type: Boolean, default: true }
    });
    
    const User = mongoose.model('Users', userSchema);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    
    if (existingUser) {
      console.log('✅ User already exists:', {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        notificationToken: existingUser.notificationToken
      });
      return existingUser;
    } else {
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 12);
      const testUser = new User({
        name: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'user',
        userCategory: 'Personal',
        notificationToken: '',
        active: true
      });
      
      await testUser.save();
      console.log('✅ Test user created:', {
        id: testUser._id,
        name: testUser.name,
        email: testUser.email
      });
      return testUser;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestUser();
