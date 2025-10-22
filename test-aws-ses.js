#!/usr/bin/env node

/**
 * AWS SES Email Service Test Suite
 * This script tests the email service configuration with AWS SES SMTP
 * and verifies OTP functionality end-to-end
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { sendEmail, sendResetPasswordEmail, sendVerificationEmail } from './src/services/email.service.js';
import { sendOTPEmail } from './src/services/otp.service.js';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_CONFIG = {
  verifiedEmail: 'no-reply@samsarawellness.in', // Verified email for testing
  testEmail: 'akshay96102@gmail.com', // Email to test sending to (may fail if not verified)
  serverPort: 8000,
  baseURL: 'http://localhost:8000'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`)
};

/**
 * Test 1: Environment Variables Check
 */
const testEnvironmentVariables = () => {
  log.header('Test 1: Environment Variables Check');
  
  const requiredVars = [
    'SES_SMTP_USERNAME',
    'SES_SMTP_PASSWORD', 
    'SES_SMTP_ENDPOINT',
    'SES_SMTP_PORT',
    'EMAIL_FROM'
  ];

  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log.success(`${varName}: ${varName.includes('PASSWORD') ? '***hidden***' : value}`);
    } else {
      log.error(`${varName}: Not found`);
      allPresent = false;
    }
  });

  return allPresent;
};

/**
 * Test 2: SMTP Connection Test
 */
const testSMTPConnection = async () => {
  log.header('Test 2: SMTP Connection Test');
  
  const smtpConfig = {
    host: process.env.SES_SMTP_ENDPOINT,
    port: parseInt(process.env.SES_SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SES_SMTP_USERNAME,
      pass: process.env.SES_SMTP_PASSWORD,
    },
    connectionTimeout: (parseInt(process.env.SMTP_TIMEOUT) || 7) * 1000,
    greetingTimeout: (parseInt(process.env.SMTP_TIMEOUT) || 7) * 1000,
    socketTimeout: (parseInt(process.env.SMTP_TIMEOUT) || 7) * 1000,
  };

  try {
    const transporter = nodemailer.createTransport(smtpConfig);
    await transporter.verify();
    log.success(`Connected to AWS SES: ${smtpConfig.host}:${smtpConfig.port}`);
    return true;
  } catch (error) {
    log.error(`SMTP connection failed: ${error.message}`);
    return false;
  }
};

/**
 * Test 3: Basic Email Service Test
 */
const testEmailService = async () => {
  log.header('Test 3: Basic Email Service Test');
  
  try {
    log.test(`Sending test email to: ${TEST_CONFIG.verifiedEmail}`);
    await sendEmail(
      TEST_CONFIG.verifiedEmail,
      'AWS SES Test Email',
      'This is a test email from AWS SES SMTP configuration.',
      '<p>This is a <strong>test email</strong> from AWS SES SMTP configuration.</p>'
    );
    log.success('Basic email service test passed');
    return true;
  } catch (error) {
    log.error(`Basic email service test failed: ${error.message}`);
    return false;
  }
};

/**
 * Test 4: OTP Email Service Test
 */
const testOTPEmailService = async () => {
  log.header('Test 4: OTP Email Service Test');
  
  try {
    log.test(`Sending OTP email to: ${TEST_CONFIG.verifiedEmail}`);
    await sendOTPEmail(TEST_CONFIG.verifiedEmail, '1234', 'registration');
    log.success('OTP email service test passed');
    return true;
  } catch (error) {
    log.error(`OTP email service test failed: ${error.message}`);
    return false;
  }
};

/**
 * Test 5: Password Reset Email Test
 */
const testPasswordResetEmail = async () => {
  log.header('Test 5: Password Reset Email Test');
  
  try {
    log.test(`Sending password reset email to: ${TEST_CONFIG.verifiedEmail}`);
    await sendResetPasswordEmail(TEST_CONFIG.verifiedEmail, 'test-reset-token-123');
    log.success('Password reset email test passed');
    return true;
  } catch (error) {
    log.error(`Password reset email test failed: ${error.message}`);
    return false;
  }
};

/**
 * Test 6: Email Verification Test
 */
const testEmailVerification = async () => {
  log.header('Test 6: Email Verification Test');
  
  try {
    log.test(`Sending verification email to: ${TEST_CONFIG.verifiedEmail}`);
    await sendVerificationEmail(TEST_CONFIG.verifiedEmail, 'test-verification-token-123');
    log.success('Email verification test passed');
    return true;
  } catch (error) {
    log.error(`Email verification test failed: ${error.message}`);
    return false;
  }
};

/**
 * Test 7: API Endpoint Test (if server is running)
 */
const testAPIEndpoints = async () => {
  log.header('Test 7: API Endpoint Test');
  
  try {
    // Test registration OTP endpoint
    log.test('Testing registration OTP API endpoint');
    const regResponse = await fetch(`${TEST_CONFIG.baseURL}/v1/auth/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CONFIG.verifiedEmail,
        name: 'Test User',
        role: 'user',
        userCategory: 'Personal'
      })
    });

    if (regResponse.ok) {
      log.success('Registration OTP API endpoint working');
    } else {
      const error = await regResponse.json();
      log.warning(`Registration OTP API returned: ${error.message}`);
    }

    // Test login OTP endpoint
    log.test('Testing login OTP API endpoint');
    const loginResponse = await fetch(`${TEST_CONFIG.baseURL}/v1/auth/send-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CONFIG.verifiedEmail
      })
    });

    if (loginResponse.ok) {
      log.success('Login OTP API endpoint working');
    } else {
      const error = await loginResponse.json();
      log.warning(`Login OTP API returned: ${error.message}`);
    }

    return true;
  } catch (error) {
    log.warning(`API endpoint test failed (server may not be running): ${error.message}`);
    return false;
  }
};

/**
 * Test 8: External Email Test (may fail if not verified)
 */
const testExternalEmail = async () => {
  log.header('Test 8: External Email Test');
  
  try {
    log.test(`Attempting to send email to: ${TEST_CONFIG.testEmail}`);
    log.warning('This test may fail if the email is not verified in AWS SES');
    
    await sendEmail(
      TEST_CONFIG.testEmail,
      'AWS SES External Test',
      'This is a test email to verify AWS SES is working.',
      '<p>This is a <strong>test email</strong> to verify AWS SES is working.</p>'
    );
    log.success('External email test passed');
    return true;
  } catch (error) {
    if (error.message.includes('not verified')) {
      log.warning(`External email test failed (expected): ${error.message}`);
      log.info('This is normal if the email address is not verified in AWS SES');
    } else {
      log.error(`External email test failed: ${error.message}`);
    }
    return false;
  }
};

/**
 * Main test runner
 */
const runTests = async () => {
  console.log(`${colors.bold}${colors.cyan}🚀 AWS SES Email Service Test Suite${colors.reset}`);
  console.log(`${colors.cyan}==========================================${colors.reset}`);
  
  const results = {
    envVars: testEnvironmentVariables(),
    smtpConnection: await testSMTPConnection(),
    emailService: await testEmailService(),
    otpService: await testOTPEmailService(),
    passwordReset: await testPasswordResetEmail(),
    emailVerification: await testEmailVerification(),
    apiEndpoints: await testAPIEndpoints(),
    externalEmail: await testExternalEmail()
  };

  // Summary
  log.header('Test Results Summary');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n${colors.bold}Results: ${passed}/${total} tests passed${colors.reset}`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
    console.log(`${test}: ${status}`);
  });

  if (passed === total) {
    log.success('\n🎉 All tests passed! AWS SES is working correctly.');
  } else if (passed >= total - 1) {
    log.warning('\n⚠️  Most tests passed. AWS SES is mostly working correctly.');
  } else {
    log.error('\n❌ Multiple tests failed. Please check your AWS SES configuration.');
  }

  console.log(`\n${colors.cyan}==========================================${colors.reset}`);
  console.log(`${colors.bold}Test completed at: ${new Date().toLocaleString()}${colors.reset}`);
};

// Run the tests
runTests().catch(console.error);
