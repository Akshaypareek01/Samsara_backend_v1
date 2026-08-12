import cacheService from '../services/cache.service.js';
import logger from '../config/logger.js';

/**
 * Redis store for express-rate-limit v5.
 *
 * The default memory store keeps counters in the Node process, so every deploy
 * or PM2 restart hands attackers a fresh budget, and counters are not shared if
 * the app is ever scaled past one instance.
 *
 * Written against the v5 store interface (incr/decrement/resetKey) rather than
 * pulling in `rate-limit-redis`, which targets v6+ and would force a major
 * upgrade of express-rate-limit across every limiter at once.
 *
 * Falls back to allowing the request when Redis is unavailable — a cache outage
 * must not take authentication down.
 */
class RedisRateLimitStore {
  /**
   * @param {object} [options]
   * @param {number} [options.windowMs=900000] - Window length in ms.
   * @param {string} [options.prefix='rl:'] - Key prefix.
   */
  constructor({ windowMs = 15 * 60 * 1000, prefix = 'rl:' } = {}) {
    this.windowMs = windowMs;
    this.prefix = prefix;
  }

  /**
   * express-rate-limit calls this so the store can inherit the limiter window.
   * @param {number} windowMs
   */
  init(windowMs) {
    if (typeof windowMs === 'number' && windowMs > 0) {
      this.windowMs = windowMs;
    }
  }

  /**
   * Increment the counter for a key.
   * @param {string} key
   * @param {(err: Error|null, hits?: number, resetTime?: Date) => void} cb
   */
  async incr(key, cb) {
    const redisKey = `${this.prefix}${key}`;
    try {
      if (!cacheService.isAvailable()) {
        // Redis down: do not block traffic, but make it visible.
        return cb(null, 0, new Date(Date.now() + this.windowMs));
      }

      const hits = await cacheService.increment(redisKey, 1);
      if (hits === 1) {
        await cacheService.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }
      return cb(null, hits, new Date(Date.now() + this.windowMs));
    } catch (error) {
      logger.error(`Rate limit store incr failed for ${redisKey}: ${error.message}`);
      return cb(null, 0, new Date(Date.now() + this.windowMs));
    }
  }

  /**
   * Roll back a hit (used with skipSuccessfulRequests).
   * @param {string} key
   */
  async decrement(key) {
    try {
      if (!cacheService.isAvailable()) return;
      await cacheService.decrement(`${this.prefix}${key}`, 1);
    } catch (error) {
      logger.error(`Rate limit store decrement failed: ${error.message}`);
    }
  }

  /**
   * Clear a key.
   * @param {string} key
   */
  async resetKey(key) {
    try {
      if (!cacheService.isAvailable()) return;
      await cacheService.del(`${this.prefix}${key}`);
    } catch (error) {
      logger.error(`Rate limit store resetKey failed: ${error.message}`);
    }
  }
}

export default RedisRateLimitStore;
