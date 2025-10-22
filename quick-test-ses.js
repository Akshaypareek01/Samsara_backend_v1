#!/usr/bin/env node

/**
 * Quick AWS SES Test
 * Simple test to verify AWS SES is working
 */

import dotenv from 'dotenv';
import { sendEmail } from './src/services/email.service.js';

dotenv.config();

const quickTest = async () => {
  console.log('🚀 Quick AWS SES Test\n');
  
  try {
    console.log('📧 Sending test email...');
    await sendEmail(
      'no-reply@samsarawellness.in',
      'Quick AWS SES Test',
      'AWS SES is working correctly!',
      '<p><strong>AWS SES is working correctly!</strong></p>'
    );
    console.log('✅ AWS SES is working perfectly!');
  } catch (error) {
    console.log('❌ AWS SES test failed:', error.message);
  }
};

quickTest().catch(console.error);
