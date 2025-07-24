// Basic in-memory cache service for reproduction module

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000, // Maximum number of cached items
      cleanupInterval: 60 * 1000, // Cleanup every minute
      ...config
    };
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }

  // Get item from cache
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Set item in cache
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, item);
  }

  // Check if key exists and is not expired
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete specific key
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  // Invalidate keys matching pattern
  async invalidate(pattern: string): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems: validCount,
      expiredItems: expiredCount,
      maxSize: this.config.maxSize,
      hitRate: this.getHitRate()
    };
  }

  // Get cache hit rate (simplified implementation)
  private hitRate = { hits: 0, misses: 0 };
  
  private getHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total > 0 ? (this.hitRate.hits / total) * 100 : 0;
  }

  // Track cache hit
  private trackHit(): void {
    this.hitRate.hits++;
  }

  // Track cache miss
  private trackMiss(): void {
    this.hitRate.misses++;
  }

  // Enhanced get method with hit/miss tracking
  async getWithTracking<T>(key: string): Promise<T | null> {
    const result = await this.get<T>(key);
    
    if (result !== null) {
      this.trackHit();
    } else {
      this.trackMiss();
    }
    
    return result;
  }

  // Evict oldest items when cache is full
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Start cleanup timer to remove expired items
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Cleanup expired items
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (process.env.NODE_ENV === 'development' && keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired items`);
    }
  }

  // Stop cleanup timer
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// Cache configuration for reproduction module
export const reproductionCacheConfig = {
  statistics: {
    ttl: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'reproduction:stats'
  },
  animalLists: {
    ttl: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'reproduction:animals'
  },
  compatibility: {
    ttl: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'reproduction:compatibility'
  },
  pregnancies: {
    ttl: 2 * 60 * 1000, // 2 minutes
    keyPrefix: 'reproduction:pregnancies'
  },
  litters: {
    ttl: 2 * 60 * 1000, // 2 minutes
    keyPrefix: 'reproduction:litters'
  }
};

// Create singleton cache instance
export const cacheService = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 500,
  cleanupInterval: 60 * 1000 // 1 minute
});

// Helper functions for reproduction-specific caching
export const reproductionCache = {
  // Statistics caching
  async getStatistics(key: string) {
    return cacheService.getWithTracking(`${reproductionCacheConfig.statistics.keyPrefix}:${key}`);
  },

  async setStatistics(key: string, data: any) {
    return cacheService.set(
      `${reproductionCacheConfig.statistics.keyPrefix}:${key}`,
      data,
      reproductionCacheConfig.statistics.ttl
    );
  },

  // Animal lists caching
  async getAnimalList(key: string) {
    return cacheService.getWithTracking(`${reproductionCacheConfig.animalLists.keyPrefix}:${key}`);
  },

  async setAnimalList(key: string, data: any) {
    return cacheService.set(
      `${reproductionCacheConfig.animalLists.keyPrefix}:${key}`,
      data,
      reproductionCacheConfig.animalLists.ttl
    );
  },

  // Compatibility caching
  async getCompatibility(madreId: number, padreId: number) {
    const key = `${reproductionCacheConfig.compatibility.keyPrefix}:${madreId}-${padreId}`;
    return cacheService.getWithTracking(key);
  },

  async setCompatibility(madreId: number, padreId: number, data: any) {
    const key = `${reproductionCacheConfig.compatibility.keyPrefix}:${madreId}-${padreId}`;
    return cacheService.set(key, data, reproductionCacheConfig.compatibility.ttl);
  },

  // Pregnancies caching
  async getPregnancies(filters: string) {
    return cacheService.getWithTracking(`${reproductionCacheConfig.pregnancies.keyPrefix}:${filters}`);
  },

  async setPregnancies(filters: string, data: any) {
    return cacheService.set(
      `${reproductionCacheConfig.pregnancies.keyPrefix}:${filters}`,
      data,
      reproductionCacheConfig.pregnancies.ttl
    );
  },

  // Litters caching
  async getLitters(filters: string) {
    return cacheService.getWithTracking(`${reproductionCacheConfig.litters.keyPrefix}:${filters}`);
  },

  async setLitters(filters: string, data: any) {
    return cacheService.set(
      `${reproductionCacheConfig.litters.keyPrefix}:${filters}`,
      data,
      reproductionCacheConfig.litters.ttl
    );
  },

  // Invalidation helpers
  async invalidateStatistics() {
    return cacheService.invalidate(`${reproductionCacheConfig.statistics.keyPrefix}:*`);
  },

  async invalidateAnimalLists() {
    return cacheService.invalidate(`${reproductionCacheConfig.animalLists.keyPrefix}:*`);
  },

  async invalidateCompatibility() {
    return cacheService.invalidate(`${reproductionCacheConfig.compatibility.keyPrefix}:*`);
  },

  async invalidatePregnancies() {
    return cacheService.invalidate(`${reproductionCacheConfig.pregnancies.keyPrefix}:*`);
  },

  async invalidateLitters() {
    return cacheService.invalidate(`${reproductionCacheConfig.litters.keyPrefix}:*`);
  },

  async invalidateAll() {
    return cacheService.invalidate('reproduction:*');
  },

  // Get cache statistics
  getStats() {
    return cacheService.getStats();
  }
};

export default cacheService;