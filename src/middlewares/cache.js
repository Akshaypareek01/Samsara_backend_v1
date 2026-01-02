import cacheService from '../services/cache.service.js';
import logger from '../config/logger.js';

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds (default: 300)
 * @param {Function} keyGenerator - Function to generate cache key from request
 * @returns {Function} Express middleware
 */
export const cache = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`;

    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return res.send(cached);
    }

    // Store original send function
    const originalSend = res.send.bind(res);

    // Override send to cache response
    res.send = function (data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, data, ttl).catch((error) => {
          logger.error(`Cache set error for key ${cacheKey}:`, error);
        });
      }
      return originalSend(data);
    };

    next();
  };
};

/**
 * Invalidate cache middleware
 * @param {string|Function} patternOrGenerator - Cache pattern or function to generate pattern
 * @returns {Function} Express middleware
 */
export const invalidateCache = (patternOrGenerator) => {
  return async (req, res, next) => {
    try {
      const pattern = typeof patternOrGenerator === 'function'
        ? patternOrGenerator(req)
        : patternOrGenerator;

      const deleted = await cacheService.invalidate(pattern);
      logger.debug(`Cache invalidated: ${pattern} (${deleted} keys)`);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
    next();
  };
};

/**
 * Generate cache key from request
 * @param {Object} req - Express request object
 * @param {string} prefix - Key prefix
 * @returns {string} Cache key
 */
export const generateCacheKey = (req, prefix = 'cache') => {
  const parts = [
    prefix,
    req.method,
    req.path,
    JSON.stringify(req.query),
    req.user?.id || 'anonymous',
  ];
  return parts.join(':');
};







