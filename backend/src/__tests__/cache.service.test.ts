import { cacheService, reproductionCache } from '../services/cache.service';

describe('Cache Service', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  afterAll(() => {
    cacheService.destroy();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cache items', async () => {
      const testData = { test: 'data', number: 123 };
      await cacheService.set('test-key', testData);
      
      const result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should respect TTL and expire items', async () => {
      const testData = { test: 'data' };
      await cacheService.set('test-key', testData, 100); // 100ms TTL
      
      // Should exist immediately
      let result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await cacheService.set('test-key', { data: 'test' });
      
      const exists = await cacheService.has('test-key');
      expect(exists).toBe(true);
      
      const notExists = await cacheService.has('non-existent');
      expect(notExists).toBe(false);
    });

    it('should delete specific keys', async () => {
      await cacheService.set('test-key', { data: 'test' });
      
      const deleted = await cacheService.delete('test-key');
      expect(deleted).toBe(true);
      
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should invalidate keys matching pattern', async () => {
      await cacheService.set('user:1', { id: 1 });
      await cacheService.set('user:2', { id: 2 });
      await cacheService.set('product:1', { id: 1 });
      
      const deletedCount = await cacheService.invalidate('user:*');
      expect(deletedCount).toBe(2);
      
      // User keys should be gone
      expect(await cacheService.get('user:1')).toBeNull();
      expect(await cacheService.get('user:2')).toBeNull();
      
      // Product key should remain
      expect(await cacheService.get('product:1')).toEqual({ id: 1 });
    });

    it('should clear all cache', async () => {
      await cacheService.set('key1', { data: 1 });
      await cacheService.set('key2', { data: 2 });
      
      await cacheService.clear();
      
      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      await cacheService.set('key1', { data: 1 });
      await cacheService.set('key2', { data: 2 });
      
      const stats = cacheService.getStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.validItems).toBe(2);
      expect(stats.expiredItems).toBe(0);
    });

    it('should track hit/miss rates', async () => {
      await cacheService.set('existing-key', { data: 'test' });
      
      // Hit
      await cacheService.getWithTracking('existing-key');
      
      // Miss
      await cacheService.getWithTracking('non-existent-key');
      
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(50); // 1 hit out of 2 attempts
    });
  });

  describe('Reproduction Cache', () => {
    it('should cache and retrieve statistics', async () => {
      const testStats = {
        resumen: { totalPreneces: 10, prenecesActivas: 5 },
        promedios: { tasaExito: 80.5 }
      };
      
      await reproductionCache.setStatistics('test-stats', testStats);
      const result = await reproductionCache.getStatistics('test-stats');
      
      expect(result).toEqual(testStats);
    });

    it('should cache and retrieve animal lists', async () => {
      const testAnimals = [
        { id: 1, raza: 'Peruana', galpon: 'A', jaula: '1' },
        { id: 2, raza: 'Andina', galpon: 'B', jaula: '2' }
      ];
      
      await reproductionCache.setAnimalList('available-mothers', testAnimals);
      const result = await reproductionCache.getAnimalList('available-mothers');
      
      expect(result).toEqual(testAnimals);
    });

    it('should cache compatibility results', async () => {
      const compatibilityData = {
        score: 85,
        recommendations: ['Good genetic match'],
        warnings: []
      };
      
      await reproductionCache.setCompatibility(1, 2, compatibilityData);
      const result = await reproductionCache.getCompatibility(1, 2);
      
      expect(result).toEqual(compatibilityData);
    });

    it('should invalidate specific cache categories', async () => {
      await reproductionCache.setStatistics('stats1', { data: 1 });
      await reproductionCache.setAnimalList('animals1', { data: 2 });
      
      await reproductionCache.invalidateStatistics();
      
      expect(await reproductionCache.getStatistics('stats1')).toBeNull();
      expect(await reproductionCache.getAnimalList('animals1')).toEqual({ data: 2 });
    });

    it('should invalidate all reproduction cache', async () => {
      await reproductionCache.setStatistics('stats1', { data: 1 });
      await reproductionCache.setAnimalList('animals1', { data: 2 });
      await reproductionCache.setCompatibility(1, 2, { data: 3 });
      
      await reproductionCache.invalidateAll();
      
      expect(await reproductionCache.getStatistics('stats1')).toBeNull();
      expect(await reproductionCache.getAnimalList('animals1')).toBeNull();
      expect(await reproductionCache.getCompatibility(1, 2)).toBeNull();
    });
  });

  describe('Cache Performance', () => {
    it('should handle large number of cache operations efficiently', async () => {
      const startTime = Date.now();
      
      // Set 1000 items
      const setPromises = [];
      for (let i = 0; i < 1000; i++) {
        setPromises.push(cacheService.set(`key-${i}`, { id: i, data: `data-${i}` }));
      }
      await Promise.all(setPromises);
      
      // Get 1000 items
      const getPromises = [];
      for (let i = 0; i < 1000; i++) {
        getPromises.push(cacheService.get(`key-${i}`));
      }
      const results = await Promise.all(getPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
      expect(results).toHaveLength(1000);
      expect(results[0]).toEqual({ id: 0, data: 'data-0' });
    });

    it('should respect cache size limits', async () => {
      // This test would need a cache instance with a small maxSize
      // For now, we'll just verify the concept works
      const smallCache = new (require('../services/cache.service').default)({
        maxSize: 3,
        defaultTTL: 60000
      });
      
      await smallCache.set('key1', { data: 1 });
      await smallCache.set('key2', { data: 2 });
      await smallCache.set('key3', { data: 3 });
      await smallCache.set('key4', { data: 4 }); // Should evict oldest
      
      const stats = smallCache.getStats();
      expect(stats.totalItems).toBeLessThanOrEqual(3);
      
      smallCache.destroy();
    });
  });
});