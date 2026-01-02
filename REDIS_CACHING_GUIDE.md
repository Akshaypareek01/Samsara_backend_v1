# Redis Caching Implementation Guide

## Overview

Redis has been integrated into the Samsara backend for improved performance and optimization. This guide explains how to use Redis caching throughout the application.

## Setup

### Environment Variables

Add these to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional, leave empty for local development
REDIS_DB=0
```

For Docker, Redis is automatically configured via `docker-compose.yml`.

### Starting Redis

**Local Development:**
```bash
# Using Docker
docker-compose up redis

# Or install Redis locally
brew install redis  # macOS
redis-server
```

**Production:**
Redis is included in `docker-compose.prod.yml` and starts automatically.

## Usage Examples

### 1. Using Cache Service Directly

```javascript
import cacheService from '../services/cache.service.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';

// Get user profile with caching
const getUserProfile = async (userId) => {
  const cacheKey = CacheKeys.userProfile(userId);
  
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      // Fetch from database if not in cache
      return await User.findById(userId).populate('membership');
    },
    CacheTTL.USER_PROFILE
  );
};

// Invalidate cache when user updates profile
const updateUserProfile = async (userId, data) => {
  const user = await User.findByIdAndUpdate(userId, data, { new: true });
  
  // Invalidate cache
  await cacheService.del(CacheKeys.userProfile(userId));
  await cacheService.del(CacheKeys.user(userId));
  
  return user;
};
```

### 2. Using Cache Middleware

```javascript
import { cache, invalidateCache } from '../middlewares/cache.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';

// Cache GET requests
router.get(
  '/profile',
  cache(CacheTTL.USER_PROFILE, (req) => CacheKeys.userProfile(req.user.id)),
  getProfile
);

// Invalidate cache on update
router.put(
  '/profile',
  invalidateCache((req) => `user:profile:${req.user.id}`),
  updateProfile
);
```

### 3. Period Cycle Caching Example

```javascript
// In periodCycle.controller.js
import cacheService from '../services/cache.service.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';

const getCurrentPeriodCycle = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const cacheKey = CacheKeys.currentPeriodCycle(userId);
  
  const cycle = await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await periodCycleService.getCurrentCycle(userId);
    },
    CacheTTL.PERIOD_CYCLE
  );
  
  res.send(cycle);
});

const startPeriodCycle = catchAsync(async (req, res) => {
  const cycle = await periodCycleService.startCycle(req.user.id, req.body);
  
  // Invalidate related caches
  await cacheService.del(CacheKeys.currentPeriodCycle(req.user.id));
  await cacheService.invalidate(`period:${req.user.id}:*`);
  
  res.send(cycle);
});
```

### 4. Class List Caching Example

```javascript
// In class.controller.js
const getClasses = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['trainer', 'date', 'status']);
  const cacheKey = CacheKeys.classList(filter);
  
  const result = await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await classService.queryClasses(filter, options);
    },
    CacheTTL.CLASS_LIST
  );
  
  res.send(result);
});
```

### 5. Membership Plans Caching

```javascript
// In membership.controller.js
const getMembershipPlans = catchAsync(async (req, res) => {
  const cacheKey = CacheKeys.membershipPlans();
  
  const plans = await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await MembershipPlan.find({ isActive: true });
    },
    CacheTTL.MEMBERSHIP_PLANS // 1 hour
  );
  
  res.send(plans);
});
```

## Cache Key Patterns

Use consistent key patterns for easy invalidation:

- `user:{userId}` - User data
- `user:profile:{userId}` - User profile
- `period:current:{userId}` - Current period cycle
- `class:list:{filters}` - Class listings
- `membership:active:{userId}` - Active membership
- `diet:latest:{userId}` - Latest diet generation

## Cache Invalidation Strategies

### 1. On Update/Delete
```javascript
// Always invalidate related caches when data changes
await cacheService.del(CacheKeys.userProfile(userId));
await cacheService.del(CacheKeys.user(userId));
```

### 2. Pattern-Based Invalidation
```javascript
// Invalidate all user-related caches
await cacheService.invalidate(`user:${userId}:*`);

// Invalidate all period-related caches
await cacheService.invalidate(`period:${userId}:*`);
```

### 3. Time-Based Expiration
Use appropriate TTL values:
- **SHORT (60s)**: Frequently changing data (notifications, real-time stats)
- **MEDIUM (300s)**: Moderately changing data (period cycles, mood)
- **LONG (1800s)**: Slowly changing data (user profiles, assessments)
- **VERY_LONG (3600s)**: Rarely changing data (membership plans, trainers)

## Best Practices

1. **Cache Read-Heavy Operations**: Focus on frequently accessed, rarely changed data
2. **Set Appropriate TTLs**: Balance freshness vs. performance
3. **Invalidate on Writes**: Always invalidate related caches when data changes
4. **Use Consistent Keys**: Follow the patterns in `cacheKeys.js`
5. **Handle Cache Failures Gracefully**: Cache service returns `null` if Redis is unavailable
6. **Monitor Cache Hit Rates**: Track which caches are most effective

## Performance Benefits

- **Reduced Database Load**: Frequently accessed data served from memory
- **Faster Response Times**: Sub-millisecond cache retrieval
- **Better Scalability**: Handle more concurrent requests
- **Cost Efficiency**: Reduce database query costs

## Monitoring

Check Redis connection status in logs:
- `Redis: Connected and ready` - Success
- `Redis: Connection error` - Connection issues

## Testing

The cache service gracefully handles Redis unavailability:
- Returns `null` on cache misses or errors
- Falls back to database queries
- App continues to function without Redis

## Common Use Cases

1. **User Profiles**: Cache for 30 minutes
2. **Period Cycles**: Cache for 5 minutes
3. **Class Lists**: Cache for 5 minutes
4. **Membership Plans**: Cache for 1 hour
5. **Trainer Lists**: Cache for 10 minutes
6. **Diet Generations**: Cache for 30 minutes
7. **Assessments**: Cache for 30 minutes

## Troubleshooting

**Redis not connecting:**
- Check Redis is running: `redis-cli ping`
- Verify environment variables
- Check Docker container: `docker ps | grep redis`

**Cache not working:**
- Verify Redis connection in logs
- Check cache keys are consistent
- Ensure TTL values are set correctly







