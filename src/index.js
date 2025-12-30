import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import { testR2Connection } from './config/r2.config.js';
import { initRedis, closeRedis } from './config/redis.config.js';
// Import all models to ensure they are registered
import './models/index.js';

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Connected to MongoDB');

    // Initialize Redis connection
    try {
      await initRedis();
    } catch (error) {
      if (config.env === 'production') {
        logger.error('Redis initialization error:', error.message);
        process.exit(1);
      } else {
        logger.warn('Redis initialization error (development mode):', error.message);
      }
    }

    // Test R2 connection (non-blocking)
    // Don't block startup if R2 test fails - actual uploads will test the real connection
    try {
      const r2Connected = await testR2Connection();
      if (r2Connected) {
        logger.info('R2: Storage ready for file uploads');
      } else if (config.env === 'production') {
        logger.error('R2: Connection test failed. File uploads may not work.');
        logger.error('R2: Please verify your R2 configuration in .env file');
        // Don't exit in production - let it try on actual upload
      } else {
        logger.warn('R2: Connection test inconclusive. Uploads will be tested on first attempt.');
      }
    } catch (error) {
      // Never block startup due to R2 test failure
      if (config.env === 'production') {
        logger.warn('R2: Connection test error (production):', error.message);
        logger.warn('R2: App will continue - uploads will be tested on first attempt');
      } else {
        logger.warn('R2: Connection test error (development):', error.message);
        logger.warn('R2: App will continue - uploads will be tested on first attempt');
      }
    }

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

const exitHandler = async () => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      await closeRedis();
      process.exit(1);
    });
  } else {
    await closeRedis();
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
  await closeRedis();
});
