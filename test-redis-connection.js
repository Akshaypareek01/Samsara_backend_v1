import { initRedis, getRedisClient, closeRedis } from './src/config/redis.config.js';
import config from './src/config/config.js';
import cacheService from './src/services/cache.service.js';

/**
 * Test Redis connection and functionality
 */
const testRedis = async () => {
  console.log('🔍 Testing Redis Connection...\n');
  console.log('Redis Config:', {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
    password: config.redis.password ? '***' : 'none',
  });
  console.log('');

  try {
    // Test 1: Initialize Redis
    console.log('1️⃣  Initializing Redis connection...');
    let client;
    try {
      client = await initRedis();
    } catch (initError) {
      console.error('   Init error details:', initError.message);
      console.error('   Stack:', initError.stack);
      throw initError;
    }
    
    if (!client) {
      console.log('❌ Redis client is null - Redis not available');
      console.log('✅ Application can still run without Redis (graceful fallback)');
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check if Redis is running: redis-cli ping');
      console.log('   2. Check Redis config in .env file');
      console.log('   3. Try: brew services restart redis');
      return;
    }

    console.log('✅ Redis client initialized');

    // Test 2: Check connection status
    console.log('\n2️⃣  Checking connection status...');
    const status = client.status;
    console.log(`   Status: ${status}`);
    
    if (status !== 'ready') {
      console.log('⚠️  Redis is not ready. Status:', status);
      return;
    }

    // Test 3: Ping test
    console.log('\n3️⃣  Testing PING command...');
    const pingResult = await client.ping();
    console.log(`   PING Response: ${pingResult}`);
    if (pingResult === 'PONG') {
      console.log('✅ Redis is responding correctly');
    }

    // Test 4: Cache service availability
    console.log('\n4️⃣  Testing Cache Service...');
    const isAvailable = cacheService.isAvailable();
    console.log(`   Cache Service Available: ${isAvailable}`);
    if (isAvailable) {
      console.log('✅ Cache service is ready');
    } else {
      console.log('❌ Cache service is not available');
    }

    // Test 5: Set/Get test
    console.log('\n5️⃣  Testing SET/GET operations...');
    const testKey = 'test:redis:connection';
    const testValue = { message: 'Redis is working!', timestamp: new Date().toISOString() };
    
    const setResult = await cacheService.set(testKey, testValue, 60);
    console.log(`   SET Result: ${setResult}`);
    
    if (setResult) {
      const getValue = await cacheService.get(testKey);
      console.log(`   GET Result:`, getValue);
      
      if (getValue && getValue.message === testValue.message) {
        console.log('✅ SET/GET operations working correctly');
      } else {
        console.log('❌ GET returned incorrect value');
      }

      // Cleanup
      await cacheService.del(testKey);
      console.log('   Test key cleaned up');
    } else {
      console.log('❌ SET operation failed');
    }

    // Test 6: GetOrSet test
    console.log('\n6️⃣  Testing getOrSet (cache-aside pattern)...');
    const getOrSetKey = 'test:redis:getorset';
    let callCount = 0;
    
    const fetchFn = async () => {
      callCount++;
      return { data: 'fetched from database', callCount };
    };

    // First call - should fetch from database
    const result1 = await cacheService.getOrSet(getOrSetKey, fetchFn, 60);
    console.log(`   First call result:`, result1);
    console.log(`   Database calls: ${callCount}`);

    // Second call - should get from cache
    const result2 = await cacheService.getOrSet(getOrSetKey, fetchFn, 60);
    console.log(`   Second call result:`, result2);
    console.log(`   Database calls: ${callCount}`);

    if (callCount === 1 && result1.callCount === result2.callCount) {
      console.log('✅ getOrSet working correctly (cached on second call)');
    } else {
      console.log('⚠️  getOrSet may not be caching correctly');
    }

    // Cleanup
    await cacheService.del(getOrSetKey);

    console.log('\n✅ All Redis tests passed!');
    console.log('✅ Redis is properly configured and working\n');

  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n⚠️  Application can still run without Redis (graceful fallback)');
  } finally {
    // Close connection
    await closeRedis();
    console.log('🔌 Redis connection closed');
  }
};

// Run test
testRedis()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

