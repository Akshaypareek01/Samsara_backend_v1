import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import { testR2Connection } from './config/r2.config.js';

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Connected to MongoDB');

    // Test R2 connection
    try {
      const r2Connected = await testR2Connection();
      if (!r2Connected && config.env === 'production') {
        logger.error('Failed to connect to R2 storage. File uploads will not work in production.');
        logger.error('Please check your R2 configuration in .env file');
      }
    } catch (error) {
      if (config.env === 'production') {
        logger.error('R2 configuration error:', error.message);
        process.exit(1);
      } else {
        logger.warn('R2 configuration error (development mode):', error.message);
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

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
