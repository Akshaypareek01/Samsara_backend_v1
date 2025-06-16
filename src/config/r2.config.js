import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import config from './config.js';

// Validate required environment variables
const requiredEnvVars = {
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

// Only throw error in production environment
if (missingEnvVars.length > 0 && config.env === 'production') {
  throw new Error(`Missing required R2 environment variables: ${missingEnvVars.join(', ')}`);
}

// In development, just log a warning
if (missingEnvVars.length > 0 && config.env === 'development') {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  R2 Storage is not configured. File uploads will not work.');
  console.warn('\x1b[33m%s\x1b[0m', 'Please set the following environment variables:');
  missingEnvVars.forEach(varName => {
    console.warn('\x1b[33m%s\x1b[0m', `   - ${varName}`);
  });
}

const r2Config = {
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
};

export const r2Client = new S3Client(r2Config);
export const R2_BUCKET = process.env.R2_BUCKET_NAME;

/**
 * Test the connection to R2 storage
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export const testR2Connection = async () => {
  try {
    // Skip connection test if in development and credentials are missing
    if (config.env === 'development' && missingEnvVars.length > 0) {
      console.log('⚠️  Skipping R2 connection test in development mode');
      return false;
    }

    // First validate credentials are present
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials are not properly configured');
    }

    const command = new ListBucketsCommand({});
    await r2Client.send(command);
    console.log('✅ Cloudflare R2 connection successful');
    return true;
  } catch (error) {
    let errorMessage = 'Cloudflare R2 connection failed';
    
    if (error.message.includes('credentials')) {
      errorMessage += ': Invalid or missing credentials';
    } else if (error.message.includes('endpoint')) {
      errorMessage += ': Invalid endpoint URL';
    } else if (error.message.includes('bucket')) {
      errorMessage += ': Invalid bucket configuration';
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    console.error(`❌ ${errorMessage}`);
    return false;
  }
}; 