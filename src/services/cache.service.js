import logger from '../config/logger.js';
import { getRedisClient } from '../config/redis.config.js';

/**
 * Cache service for Redis operations
 */
class CacheService {
  /**
   * Get Redis client
   * @returns {Redis|null}
   */
  getClient() {
    return getRedisClient();
  }

  /**
   * Check if Redis is available
   * @returns {boolean}
   */
  isAvailable() {
    const client = this.getClient();
    return client && client.status === 'ready';
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const client = this.getClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600)
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = 3600) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      const serialized = JSON.stringify(value);
      await client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async del(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} - Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const client = this.getClient();
      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await client.del(...keys);
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>}
   */
  async expire(key, ttl) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment value
   * @param {string} key - Cache key
   * @param {number} increment - Increment amount (default: 1)
   * @returns {Promise<number>} - New value
   */
  async increment(key, increment = 1) {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const client = this.getClient();
      return await client.incrby(key, increment);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement value
   * @param {string} key - Cache key
   * @param {number} decrement - Decrement amount (default: 1)
   * @returns {Promise<number>} - New value
   */
  async decrement(key, decrement = 1) {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const client = this.getClient();
      return await client.decrby(key, decrement);
    } catch (error) {
      logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not in cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttl);
    }
    return data;
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Key pattern
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidate(pattern) {
    return this.delPattern(pattern);
  }
}

export default new CacheService();

