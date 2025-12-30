import { testR2Connection } from './src/config/r2.config.js';
import config from './src/config/config.js';

/**
 * Test R2 storage connection and configuration
 */
const testR2 = async () => {
  console.log('🔍 Testing Cloudflare R2 Storage Connection...\n');

  // Check required environment variables
  const requiredVars = {
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  };

  console.log('📋 R2 Configuration Check:\n');
  const missingVars = [];
  const presentVars = [];

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      const displayValue = key.includes('SECRET') || key.includes('KEY') 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` 
        : value;
      console.log(`   ✅ ${key}: ${displayValue}`);
      presentVars.push(key);
    } else {
      console.log(`   ❌ ${key}: NOT SET`);
      missingVars.push(key);
    }
  });

  console.log('');

  if (missingVars.length > 0) {
    console.log('⚠️  Missing Required Variables:');
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log('');
    console.log('💡 Add these to your .env file to enable R2 storage');
    console.log('');

    if (config.env === 'development') {
      console.log('ℹ️  Development mode: App will continue without R2');
      console.log('   File uploads will not work until R2 is configured\n');
      return;
    } else {
      console.log('❌ Production mode: R2 is required');
      console.log('   Please configure R2 before deploying to production\n');
      return;
    }
  }

  // Test connection
  console.log('🔌 Testing R2 Connection...\n');
  try {
    // Add timeout to prevent hanging
    const connectionPromise = testR2Connection();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );

    const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (isConnected) {
      console.log('\n✅ R2 Storage is working correctly!');
      console.log('✅ File uploads are enabled');
      console.log('✅ All R2 operations should work\n');
    } else {
      console.log('\n❌ R2 Storage connection failed');
      console.log('⚠️  File uploads will not work');
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Verify your R2 credentials in .env');
      console.log('   2. Check your R2 endpoint URL');
      console.log('   3. Ensure your R2 bucket exists');
      console.log('   4. Verify network connectivity\n');
    }
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.error('\n⏱️  R2 Connection Timeout');
      console.error('   The connection test took too long (>10 seconds)');
      console.error('   This might indicate:');
      console.error('   - Network connectivity issues');
      console.error('   - Incorrect R2 endpoint URL');
      console.error('   - Firewall blocking the connection\n');
    } else {
      console.error('\n❌ R2 Test Error:', error.message);
      if (error.stack && config.env === 'development') {
        console.error('Stack:', error.stack);
      }
      console.log('\n⚠️  File uploads will not work until R2 is properly configured\n');
    }
  }
};

// Run test
testR2()
  .then(() => {
    console.log('✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

