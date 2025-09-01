import jwt from 'jsonwebtoken';

// Configuration - using a test secret for development
const JWT_SECRET = 'test-jwt-secret-for-development-only';
const USER_ID = '686225adf7366b36a48fa65e';

// Generate test token
const generateTestToken = () => {
  const payload = {
    sub: USER_ID, // Use 'sub' instead of 'id' for passport-jwt
    type: 'access', // Add token type for passport-jwt
    email: 'test@example.com',
    role: 'user',
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  console.log('🔑 Generated Test JWT Token:');
  console.log(token);
  console.log('\n📋 Token Details:');
  console.log(`User ID: ${USER_ID}`);
  console.log(`Expires: 24 hours from now`);
  console.log('\n💡 Copy this token and replace the TEST_TOKEN in test_assessment_apis.js');

  return token;
};

// Verify token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token is valid');
    console.log('Decoded payload:', decoded);
    return decoded;
  } catch (error) {
    console.log('❌ Token is invalid:', error.message);
    return null;
  }
};

// Always run when file is executed
const token = generateTestToken();
console.log('\n🔍 Verifying token...');
verifyToken(token);

export { generateTestToken, verifyToken };
