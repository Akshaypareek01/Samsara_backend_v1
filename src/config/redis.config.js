import Redis from 'ioredis';
import logger from './logger.js';
import config from './config.js';

let redisClient = null;

/**
 * Initialize Redis connection
 * @returns {Promise<Redis>}
 */
export const initRedis = async () => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      return redisClient;
    }

    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      lazyConnect: false,
    };

    // Only add password if it's provided
    if (config.redis.password) {
      redisConfig.password = config.redis.password;
    }

    redisClient = new Redis(redisConfig);

    // Set up event handlers
    redisClient.on('connect', () => {
      logger.info('Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis: Connected and ready');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis: Connection error', error.message);
    });

    redisClient.on('close', () => {
      logger.warn('Redis: Connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis: Reconnecting...');
    });

    // Wait for connection to be ready, then test
    await new Promise((resolve, reject) => {
      if (redisClient.status === 'ready') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 10000);

      redisClient.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      redisClient.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Test connection
    const pingResult = await redisClient.ping();
    if (pingResult !== 'PONG') {
      throw new Error(`Unexpected PING response: ${pingResult}`);
    }

    logger.info('Redis: Successfully connected');

    return redisClient;
  } catch (error) {
    logger.error('Redis: Failed to initialize', error.message);
    if (config.env === 'development') {
      logger.error('Redis: Full error:', error);
    }
    logger.warn('Redis: Application will continue without caching. Some features may be slower.');
    // Don't throw - allow app to run without Redis
    // Caching is an optimization, not a requirement
    redisClient = null;
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null}
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis: Connection closed');
  }
};

export default redisClient;

