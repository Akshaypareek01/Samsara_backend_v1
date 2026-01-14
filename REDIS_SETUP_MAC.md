# Redis Setup for Mac - Quick Guide

## ✅ Current Status

**Redis is already installed and running on your Mac!**

- **Version**: Redis 8.2.2
- **Status**: ✅ Running (verified with `redis-cli ping`)
- **Location**: `/opt/homebrew/bin/redis-server`

## 🔧 Environment Variables (.env)

Add these lines to your `.env` file:

```env
# Redis Configuration (Optional - app works without it)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**Note**: 
- `REDIS_PASSWORD` can be left empty for local development
- The app will work **without Redis** - it gracefully falls back to direct database queries
- Redis is an optimization, not a requirement

## 🧪 Test Redis Connection

Run the test script:

```bash
npm run test:redis
```

Or directly:
```bash
node test-redis-connection.js
```

This will test:
1. ✅ Redis connection initialization
2. ✅ Connection status
3. ✅ PING command
4. ✅ Cache service availability
5. ✅ SET/GET operations
6. ✅ Cache-aside pattern (getOrSet)

## 🚀 Start/Stop Redis

### Check if Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Start Redis (if not running):
```bash
# Using Homebrew service
brew services start redis

# Or manually
redis-server
```

### Stop Redis:
```bash
# Using Homebrew service
brew services stop redis

# Or manually (if running in foreground)
# Press Ctrl+C
```

### Check Redis status:
```bash
brew services list | grep redis
```

## 🔍 Verify Redis is Working

### Quick Test:
```bash
redis-cli ping
# Expected: PONG
```

### Test with your app:
```bash
npm run test:redis
```

### Check Redis info:
```bash
redis-cli info server
```

## 🛡️ Graceful Fallback

The application is designed to work **with or without Redis**:

- ✅ **If Redis is available**: Uses caching for better performance
- ✅ **If Redis is unavailable**: Falls back to direct database queries
- ✅ **No errors**: App continues to function normally
- ✅ **Logs warnings**: You'll see warnings if Redis is not available

### How it works:

1. **On startup**: Tries to connect to Redis
   - If successful: Logs "Redis: Successfully connected"
   - If failed: Logs warning and continues without Redis

2. **During runtime**: Cache service checks availability
   - If Redis available: Uses cache
   - If Redis unavailable: Returns `null` and falls back to database

3. **No breaking changes**: All cache operations are optional

## 📊 Monitor Redis

### Check Redis connection in your app logs:
```
Redis: Connected and ready
Redis: Successfully connected
```

### Check Redis stats:
```bash
redis-cli info stats
```

### Monitor Redis in real-time:
```bash
redis-cli monitor
```

## 🔧 Troubleshooting

### Redis not connecting?

1. **Check if Redis is running:**
   ```bash
   redis-cli ping
   ```

2. **Check Redis port:**
   ```bash
   lsof -i :6379
   ```

3. **Check your .env file:**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Restart Redis:**
   ```bash
   brew services restart redis
   ```

### App works without Redis?

✅ **This is normal!** The app is designed to work without Redis. You'll just get:
- Slightly slower responses (no caching)
- More database queries
- But everything still works perfectly

### Want to disable Redis temporarily?

Just stop Redis:
```bash
brew services stop redis
```

The app will continue working without it.

## 📝 Quick Reference

| Command | Description |
|---------|-------------|
| `redis-cli ping` | Test if Redis is running |
| `brew services start redis` | Start Redis |
| `brew services stop redis` | Stop Redis |
| `brew services restart redis` | Restart Redis |
| `npm run test:redis` | Test Redis connection |
| `redis-cli monitor` | Monitor Redis commands |

## ✅ Verification Checklist

- [x] Redis installed (✅ Already installed)
- [x] Redis running (✅ Verified with ping)
- [ ] `.env` file updated with Redis config
- [ ] Run `npm run test:redis` to verify connection
- [ ] Start your app and check logs for "Redis: Successfully connected"

## 🎯 Next Steps

1. Add Redis config to your `.env` file
2. Run `npm run test:redis` to verify
3. Start your app - Redis will connect automatically
4. Monitor logs to confirm Redis is working

That's it! Your app is ready to use Redis for caching. 🚀









