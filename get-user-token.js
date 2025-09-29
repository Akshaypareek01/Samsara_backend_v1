import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './src/config/config.js';
import { User } from './src/models/user.model.js';
import { generateAuthTokens } from './src/services/token.service.js';

// Load environment variables
dotenv.config();

const TEST_USER_ID = '68da6e443f59f064bd8ce401';

async function getUserToken() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    console.log(`🔍 Looking for user: ${TEST_USER_ID}`);
    
    // Find the user
    const user = await User.findById(TEST_USER_ID);
    
    if (!user) {
      console.log('❌ User not found with ID:', TEST_USER_ID);
      return null;
    }
    
    console.log('✅ User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Generate tokens for this user
    const tokens = await generateAuthTokens(user);
    
    console.log('\n🎫 Generated tokens:');
    console.log('Access Token:', tokens.access.token);
    console.log('Refresh Token:', tokens.refresh.token);
    
    console.log('\n📋 Token Details:');
    console.log('Access Token Expires:', tokens.access.expires);
    console.log('Refresh Token Expires:', tokens.refresh.expires);
    
    console.log('\n🔧 To use in tests, set:');
    console.log(`authToken = "${tokens.access.token}"`);
    
    return tokens.access.token;
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return null;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

getUserToken();
