import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import config from './config.js';
import logger from './logger.js';

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
  logger.warn('R2 Storage is not configured. File uploads will not work.');
  logger.warn('Please set the following environment variables:');
  missingEnvVars.forEach((varName) => {
    logger.warn(`   - ${varName}`);
  });
}

const r2Config = {
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  // Reduce retry attempts for faster failure detection
  maxAttempts: 2,
  // Force path style for R2 compatibility
  forcePathStyle: true,
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
      logger.warn('Skipping R2 connection test in development mode (missing credentials)');
      return false;
    }

    // First validate credentials are present
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials are not properly configured');
    }

    if (!process.env.R2_BUCKET_NAME) {
      throw new Error('R2 bucket name is not configured');
    }

    logger.info('R2: Testing connection...');

    // Use HeadBucketCommand to test access to the specific bucket
    // This is more reliable than ListBucketsCommand for R2
    const command = new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME,
    });

    // Shorter timeout for faster failure detection
    const connectionPromise = r2Client.send(command);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);
    
    logger.info('R2: Successfully connected');
    return true;
  } catch (error) {
    // In development, if it's a timeout, just warn and continue
    // The actual upload will work if credentials are correct
    if (error.message.includes('timeout')) {
      if (config.env === 'development') {
        logger.warn('R2: Connection test timed out (this is OK in dev - uploads may still work)');
        logger.warn('R2: Will test connection on first actual upload attempt');
        // Return true in dev mode to not block startup
        // Actual uploads will fail if there's a real issue
        return true;
      } else {
        logger.error('R2: Connection timeout - check network/endpoint');
        return false;
      }
    }

    let errorMessage = 'R2 connection failed';

    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      errorMessage = 'R2 bucket not found - check bucket name';
      logger.error(errorMessage);
    } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
      errorMessage = 'R2 access denied - check credentials and permissions';
      logger.error(errorMessage);
    } else if (error.message.includes('credentials')) {
      errorMessage += ': Invalid or missing credentials';
      logger.error(errorMessage);
    } else if (error.message.includes('endpoint')) {
      errorMessage += ': Invalid endpoint URL';
      logger.error(errorMessage);
    } else if (error.$metadata?.httpStatusCode) {
      errorMessage += `: HTTP ${error.$metadata.httpStatusCode} - ${error.message}`;
      logger.error(errorMessage);
    } else {
      errorMessage += `: ${error.message}`;
      logger.error(errorMessage);
    }

    return false;
  }
};
