import { CacheService, mainCache, dashboardCache, getCacheKey, invalidateAllCaches } from '../services/cache.service';

describe('Cache Service', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({ ttl: 60 }); // 1 minute TTL for tests
  });

  afterEach(() => {
    cacheService.flushAll();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values', () => {
      const key = 'test-key';
      const value = { data: 'test-value', number: 42 };

      const setResult = cacheService.set(key, value);
      expect(setResult).toBe(true);

      const retrievedValue = cacheService.get(key);
      expect(retrievedValue).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const value = cacheService.get('non-existent-key');
      expect(value).toBeUndefined();
    });

    it('should check if key exists', () => {
      const key = 'existence-test';
      
      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, 'value');
      expect(cacheService.has(key)).toBe(true);
    });

    it('should delete keys', () => {
      const key = 'delete-test';
      cacheService.set(key, 'value');
      
      expect(cacheService.has(key)).toBe(true);
      
      const deleteCount = cacheService.del(key);
      expect(deleteCount).toBe(1);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should handle multiple keys', () => {
      const keyValuePairs = [
        { key: 'key1', val: 'value1' },
        { key: 'key2', val: 'value2' },
        { key: 'key3', val: 'value3' }
      ];

      const setResult = cacheService.mset(keyValuePairs);
      expect(setResult).toBe(true);

      const values = cacheService.mget(['key1', 'key2', 'key3']);
      expect(values).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect custom TTL', (done) => {
      const key = 'ttl-test';
      const value = 'expires-soon';
      const shortTTL = 0.1; // 100ms

      cacheService.set(key, value, shortTTL);
      expect(cacheService.get(key)).toBe(value);

      setTimeout(() => {
        expect(cacheService.get(key)).toBeUndefined();
        done();
      }, 150);
    });

    it('should use default TTL when not specified', () => {
      const key = 'default-ttl-test';
      const value = 'default-ttl-value';

      cacheService.set(key, value);
      expect(cacheService.get(key)).toBe(value);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses', () => {
      const key = 'stats-test';
      const value = 'stats-value';

      // Initial stats
      let stats = cacheService.getStats();
      const initialHits = stats.hits;
      const initialMisses = stats.misses;

      // Cache miss
      cacheService.get(key);
      stats = cacheService.getStats();
      expect(stats.misses).toBe(initialMisses + 1);

      // Cache set and hit
      cacheService.set(key, value);
      cacheService.get(key);
      stats = cacheService.getStats();
      expect(stats.hits).toBe(initialHits + 1);
    });

    it('should calculate hit rate correctly', () => {
      const key = 'hit-rate-test';
      const value = 'hit-rate-value';

      // Generate some hits and misses
      cacheService.get('miss1'); // miss
      cacheService.get('miss2'); // miss
      cacheService.set(key, value);
      cacheService.get(key); // hit
      cacheService.get(key); // hit

      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(50); // 2 hits out of 4 total requests
    });

    it('should track access log', () => {
      const key = 'access-log-test';
      const value = 'access-log-value';

      cacheService.set(key, value);
      cacheService.get(key);
      cacheService.get(key);
      cacheService.get(key);

      const stats = cacheService.getStats();
      const accessEntry = stats.accessLog.find(entry => entry.key === key);
      expect(accessEntry).toBeDefined();
      expect(accessEntry?.count).toBe(3);
    });
  });

  describe('Cache-aside Pattern', () => {
    it('should implement getOrSet pattern', async () => {
      const key = 'get-or-set-test';
      const expectedValue = { computed: true, timestamp: Date.now() };
      let fetchCalled = false;

      const fetchFunction = async () => {
        fetchCalled = true;
        return expectedValue;
      };

      // First call should fetch and cache
      const result1 = await cacheService.getOrSet(key, fetchFunction);
      expect(result1).toEqual(expectedValue);
      expect(fetchCalled).toBe(true);

      // Second call should return cached value
      fetchCalled = false;
      const result2 = await cacheService.getOrSet(key, fetchFunction);
      expect(result2).toEqual(expectedValue);
      expect(fetchCalled).toBe(false);
    });

    it('should handle fetch function errors', async () => {
      const key = 'error-test';
      const fetchFunction = async () => {
        throw new Error('Fetch failed');
      };

      await expect(cacheService.getOrSet(key, fetchFunction)).rejects.toThrow('Fetch failed');
    });
  });

  describe('Pattern-based Invalidation', () => {
    it('should invalidate keys by pattern', () => {
      // Set up test data
      cacheService.set('user:1:profile', { name: 'User 1' });
      cacheService.set('user:2:profile', { name: 'User 2' });
      cacheService.set('user:1:settings', { theme: 'dark' });
      cacheService.set('product:1:details', { name: 'Product 1' });

      // Invalidate all user-related keys
      const deletedCount = cacheService.invalidatePattern('^user:');
      expect(deletedCount).toBe(3);

      // Verify user keys are gone but product key remains
      expect(cacheService.has('user:1:profile')).toBe(false);
      expect(cacheService.has('user:2:profile')).toBe(false);
      expect(cacheService.has('user:1:settings')).toBe(false);
      expect(cacheService.has('product:1:details')).toBe(true);
    });

    it('should handle complex patterns', () => {
      cacheService.set('dashboard:metrics:2024-01', { value: 1 });
      cacheService.set('dashboard:metrics:2024-02', { value: 2 });
      cacheService.set('dashboard:charts:2024-01', { value: 3 });
      cacheService.set('reports:data:2024-01', { value: 4 });

      // Invalidate only dashboard metrics
      const deletedCount = cacheService.invalidatePattern('dashboard:metrics:');
      expect(deletedCount).toBe(2);

      expect(cacheService.has('dashboard:metrics:2024-01')).toBe(false);
      expect(cacheService.has('dashboard:metrics:2024-02')).toBe(false);
      expect(cacheService.has('dashboard:charts:2024-01')).toBe(true);
      expect(cacheService.has('reports:data:2024-01')).toBe(true);
    });
  });

  describe('Cache Warming', () => {
    it('should warm up cache with multiple functions', async () => {
      const warmUpFunctions = [
        {
          key: 'warm1',
          fn: async () => ({ data: 'warm1' }),
          ttl: 300
        },
        {
          key: 'warm2',
          fn: async () => ({ data: 'warm2' }),
          ttl: 600
        }
      ];

      await cacheService.warmUp(warmUpFunctions);

      expect(cacheService.get('warm1')).toEqual({ data: 'warm1' });
      expect(cacheService.get('warm2')).toEqual({ data: 'warm2' });
    });

    it('should handle warm-up errors gracefully', async () => {
      const warmUpFunctions = [
        {
          key: 'success',
          fn: async () => ({ data: 'success' })
        },
        {
          key: 'error',
          fn: async () => {
            throw new Error('Warm-up failed');
          }
        }
      ];

      // Should not throw error
      await expect(cacheService.warmUp(warmUpFunctions)).resolves.toBeUndefined();

      // Successful warm-up should be cached
      expect(cacheService.get('success')).toEqual({ data: 'success' });
      // Failed warm-up should not be cached
      expect(cacheService.get('error')).toBeUndefined();
    });
  });
});

describe('Specialized Cache Services', () => {
  afterEach(() => {
    invalidateAllCaches();
  });

  describe('Dashboard Cache Service', () => {
    it('should cache dashboard metrics', async () => {
      // Mock the metrics service
      jest.doMock('../services/dashboard/metrics.service', () => ({
        getDashboardMetrics: jest.fn().mockResolvedValue({
          reproductiveStats: { activePregnancies: 5 }
        })
      }));

      const filters = { dateFrom: '2024-01-01', dateTo: '2024-12-31' };
      
      // First call should fetch from service
      const result1 = await dashboardCache.getDashboardMetrics(filters);
      expect(result1).toHaveProperty('reproductiveStats');

      // Second call should return cached result
      const result2 = await dashboardCache.getDashboardMetrics(filters);
      expect(result2).toEqual(result1);
    });

    it('should invalidate dashboard cache', () => {
      dashboardCache.set('dashboard:test', { data: 'test' });
      expect(dashboardCache.has('dashboard:test')).toBe(true);

      dashboardCache.invalidateDashboardCache();
      expect(dashboardCache.has('dashboard:test')).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = getCacheKey('prefix', 'part1', 'part2', { filter: 'value' });
      const key2 = getCacheKey('prefix', 'part1', 'part2', { filter: 'value' });
      
      expect(key1).toBe(key2);
      expect(key1).toContain('prefix');
      expect(key1).toContain('part1');
      expect(key1).toContain('part2');
    });

    it('should handle different data types in keys', () => {
      const key = getCacheKey('test', 123, 'true', { nested: { value: 'test' } });
      
      expect(typeof key).toBe('string');
      expect(key).toContain('test');
      expect(key).toContain('123');
      expect(key).toContain('true');
    });
  });

  describe('Global Cache Operations', () => {
    it('should invalidate all caches', () => {
      mainCache.set('main:test', 'value');
      dashboardCache.set('dashboard:test', 'value');

      expect(mainCache.has('main:test')).toBe(true);
      expect(dashboardCache.has('dashboard:test')).toBe(true);

      invalidateAllCaches();

      expect(mainCache.has('main:test')).toBe(false);
      expect(dashboardCache.has('dashboard:test')).toBe(false);
    });
  });
});

describe('Cache Performance', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    cacheService.flushAll();
  });

  it('should handle large number of keys efficiently', () => {
    const startTime = Date.now();
    const keyCount = 1000;

    // Set many keys
    for (let i = 0; i < keyCount; i++) {
      cacheService.set(`key${i}`, { data: `value${i}`, index: i });
    }

    // Get many keys
    for (let i = 0; i < keyCount; i++) {
      const value = cacheService.get(`key${i}`);
      expect(value).toEqual({ data: `value${i}`, index: i });
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  it('should maintain performance with frequent access', () => {
    const key = 'performance-test';
    const value = { data: 'performance-value' };
    
    cacheService.set(key, value);

    const startTime = Date.now();
    const accessCount = 10000;

    // Access the same key many times
    for (let i = 0; i < accessCount; i++) {
      const result = cacheService.get(key);
      expect(result).toEqual(value);
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Should handle frequent access efficiently
    expect(executionTime).toBeLessThan(100); // 100ms for 10k accesses
  });
});