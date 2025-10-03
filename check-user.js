import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkUser = async () => {
  try {
    await connectDB();
    
    const User = mongoose.model('Users', new mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
      email: String,
      notificationToken: String
    }));
    
    const userId = '686225adf7366b36a48fa65e';
    const user = await User.findById(userId);
    
    if (user) {
      console.log('✅ User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        notificationToken: user.notificationToken
      });
    } else {
      console.log('❌ User not found with ID:', userId);
      
      // Let's see what users exist
      const users = await User.find({}).limit(5).select('_id name email');
      console.log('📋 Available users:', users);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

checkUser();
