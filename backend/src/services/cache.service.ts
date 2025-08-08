import logger from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // Check period for expired keys
  useClones?: boolean;
  deleteOnExpire?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Enhanced cache implementation using Map (alternative to node-cache)
class SimpleCache {
  private cache = new Map<string, { value: any; expires: number; created: number }>();
  private stats = { hits: 0, misses: 0, keys: 0, ksize: 0, vsize: 0 };
  private accessLog = new Map<string, number>();
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = (options.ttl || 300) * 1000; // Convert to milliseconds

    // Setup periodic cleanup
    if (options.checkperiod) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpired();
      }, options.checkperiod * 1000);
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        this.accessLog.delete(key);
        deletedCount++;
        logger.debug(`Cache EXPIRED: ${key}`);
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Cleaned up ${deletedCount} expired cache entries`);
    }
  }

  set(key: string, value: any, ttl?: number): boolean {
    const now = Date.now();
    const expires = now + (ttl ? ttl * 1000 : this.defaultTTL);
    this.cache.set(key, { value, expires, created: now });
    return true;
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  del(key: string): number {
    return this.cache.delete(key) ? 1 : 0;
  }

  keys(): string[] {
    // Clean expired keys first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
    return Array.from(this.cache.keys());
  }

  mget<T>(keys: string[]): { [key: string]: T } {
    const result: { [key: string]: T } = {};
    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });
    return result;
  }

  mset<T>(keyValuePairs: Array<{ key: string; val: T; ttl?: number }>): boolean {
    keyValuePairs.forEach(({ key, val, ttl }) => {
      this.set(key, val, ttl);
    });
    return true;
  }

  flushAll(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      keys: this.cache.size,
      ksize: this.cache.size,
      vsize: this.cache.size
    };
  }

  on(event: string, callback: Function): void {
    // Simple event emulation - in real node-cache this would be more sophisticated
    // For now, we'll just ignore events
  }
}

class CacheService {
  private cache: SimpleCache;
  private stats: CacheStats;
  private accessLog: Map<string, number> = new Map();

  constructor(options: CacheOptions = {}) {
    const defaultOptions: CacheOptions = {
      ttl: 300, // 5 minutes default
      checkperiod: 60, // Check every minute
      useClones: false,
      deleteOnExpire: true
    };

    this.cache = new SimpleCache({ ttl: options.ttl || defaultOptions.ttl });
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Since our SimpleCache doesn't emit events like node-cache,
    // we'll update stats directly in the methods that need them
    // This method is kept for compatibility but doesn't do anything
  }

  // Get value from cache
  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);

    if (value !== undefined) {
      this.stats.hits++;
      this.accessLog.set(key, (this.accessLog.get(key) || 0) + 1);
      logger.debug(`Cache HIT: ${key}`);
      return value;
    } else {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return undefined;
    }
  }

  // Set value in cache
  public set<T>(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl);
    if (success) {
      logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'})`);
    }
    return success;
  }

  // Delete key from cache
  public del(key: string): number {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  // Check if key exists
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  // Get multiple keys
  public mget<T>(keys: string[]): { [key: string]: T } {
    return this.cache.mget(keys);
  }

  // Set multiple keys
  public mset<T>(keyValuePairs: Array<{ key: string; val: T; ttl?: number }>): boolean {
    return this.cache.mset(keyValuePairs);
  }

  // Get all keys
  public keys(): string[] {
    return this.cache.keys();
  }

  // Get cache statistics
  public getStats(): CacheStats & { hitRate: number; accessLog: Array<{ key: string; count: number }> } {
    const cacheStats = this.cache.getStats();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    const accessLog = Array.from(this.accessLog.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most accessed keys

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: cacheStats.keys,
      ksize: cacheStats.ksize,
      vsize: cacheStats.vsize,
      hitRate: Math.round(hitRate * 100) / 100,
      accessLog
    };
  }

  // Clear all cache
  public flushAll(): void {
    this.cache.flushAll();
    this.stats = { hits: 0, misses: 0, keys: 0, ksize: 0, vsize: 0 };
    this.accessLog.clear();
    logger.info('Cache flushed');
  }

  // Get or set pattern (cache-aside pattern)
  public async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    try {
      const value = await fetchFunction();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  // Invalidate cache by pattern
  public invalidatePattern(pattern: string): number {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    const keysToDelete = keys.filter(key => regex.test(key));

    let deletedCount = 0;
    keysToDelete.forEach(key => {
      deletedCount += this.cache.del(key);
    });

    logger.info(`Invalidated ${deletedCount} keys matching pattern: ${pattern}`);
    return deletedCount;
  }

  // Warm up cache with data
  public async warmUp(warmUpFunctions: Array<{ key: string; fn: () => Promise<any>; ttl?: number }>): Promise<void> {
    logger.info('Starting cache warm-up...');

    const promises = warmUpFunctions.map(async ({ key, fn, ttl }) => {
      try {
        const value = await fn();
        this.set(key, value, ttl);
        logger.debug(`Cache warmed up: ${key}`);
      } catch (error) {
        logger.error(`Error warming up cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    logger.info('Cache warm-up completed');
  }
}

// Specialized cache services
class DashboardCacheService extends CacheService {
  constructor() {
    super({
      ttl: 300, // 5 minutes for dashboard data
      checkperiod: 60
    });
  }

  // Cache dashboard metrics
  public async getDashboardMetrics(filters: any = {}): Promise<any> {
    const cacheKey = `dashboard:metrics:${JSON.stringify(filters)}`;

    return this.getOrSet(cacheKey, async () => {
      // This would call the actual metrics service
      const { getDashboardMetrics } = await import('./dashboard/metrics.service');
      return getDashboardMetrics(filters);
    }, 300); // 5 minutes TTL
  }

  // Cache charts data
  public async getChartsData(filters: any = {}): Promise<any> {
    const cacheKey = `dashboard:charts:${JSON.stringify(filters)}`;

    return this.getOrSet(cacheKey, async () => {
      const { getAllChartsData } = await import('./dashboard/charts.service');
      return getAllChartsData(filters);
    }, 600); // 10 minutes TTL for charts
  }

  // Invalidate dashboard cache
  public invalidateDashboardCache(): void {
    this.invalidatePattern('^dashboard:');
    logger.info('Dashboard cache invalidated');
  }
}

class ReportsCacheService extends CacheService {
  constructor() {
    super({
      ttl: 1800, // 30 minutes for reports
      checkperiod: 300 // Check every 5 minutes
    });
  }

  // Cache report templates
  public async getReportTemplates(): Promise<any> {
    const cacheKey = 'reports:templates';

    return this.getOrSet(cacheKey, async () => {
      // TODO: Implement reports service when available
      return [];
    }, 3600); // 1 hour TTL for templates
  }

  // Cache generated report data
  public async getReportData(templateId: string, parameters: any): Promise<any> {
    const cacheKey = `reports:data:${templateId}:${JSON.stringify(parameters)}`;

    return this.getOrSet(cacheKey, async () => {
      // TODO: Implement reports service when available
      return { templateId, parameters, data: [] };
    }, 1800); // 30 minutes TTL
  }

  // Invalidate reports cache
  public invalidateReportsCache(): void {
    this.invalidatePattern('^reports:');
    logger.info('Reports cache invalidated');
  }
}

class CalendarCacheService extends CacheService {
  constructor() {
    super({
      ttl: 900, // 15 minutes for calendar data
      checkperiod: 120
    });
  }

  // Cache calendar events
  public async getCalendarEvents(filters: unknown = {}): Promise<unknown> {
    const cacheKey = `calendar:events:${JSON.stringify(filters)}`;

    return this.getOrSet(cacheKey, async () => {
      const { getEvents } = await import('./calendar/events.service');
      return getEvents(filters as any);
    }, 900); // 15 minutes TTL
  }

  // Invalidate calendar cache
  public invalidateCalendarCache(): void {
    this.invalidatePattern('^calendar:');
    logger.info('Calendar cache invalidated');
  }
}

// Cache invalidation strategies
class CacheInvalidationService {
  private dashboardCache: DashboardCacheService;
  private reportsCache: ReportsCacheService;
  private calendarCache: CalendarCacheService;

  constructor(
    dashboardCache: DashboardCacheService,
    reportsCache: ReportsCacheService,
    calendarCache: CalendarCacheService
  ) {
    this.dashboardCache = dashboardCache;
    this.reportsCache = reportsCache;
    this.calendarCache = calendarCache;
  }

  // Invalidate cache based on data changes
  public invalidateByDataChange(entity: string, action: 'create' | 'update' | 'delete'): void {
    logger.info(`Invalidating cache for ${entity} ${action}`);

    switch (entity) {
      case 'cuy':
      case 'galpon':
      case 'jaula':
        this.dashboardCache.invalidateDashboardCache();
        this.reportsCache.invalidateReportsCache();
        break;

      case 'prenez':
      case 'camada':
        this.dashboardCache.invalidateDashboardCache();
        this.reportsCache.invalidateReportsCache();
        this.calendarCache.invalidateCalendarCache();
        break;

      case 'historialSalud':
        this.reportsCache.invalidateReportsCache();
        break;

      default:
        logger.warn(`Unknown entity for cache invalidation: ${entity}`);
    }
  }

  // Scheduled cache cleanup
  public scheduleCleanup(): void {
    // Clean up every hour
    setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000);

    logger.info('Cache cleanup scheduled');
  }

  private performCleanup(): void {
    const dashboardStats = this.dashboardCache.getStats();
    const reportsStats = this.reportsCache.getStats();
    const calendarStats = this.calendarCache.getStats();

    logger.info('Cache cleanup stats:', {
      dashboard: { keys: dashboardStats.keys, hitRate: dashboardStats.hitRate },
      reports: { keys: reportsStats.keys, hitRate: reportsStats.hitRate },
      calendar: { keys: calendarStats.keys, hitRate: calendarStats.hitRate }
    });

    // Clean up low-hit rate entries if memory usage is high
    if (dashboardStats.keys > 1000 && dashboardStats.hitRate < 50) {
      // Could implement LRU cleanup here
      logger.info('Dashboard cache cleanup triggered');
    }
  }
}

// Singleton instances
export const mainCache = new CacheService();
export const dashboardCache = new DashboardCacheService();
export const reportsCache = new ReportsCacheService();
export const calendarCache = new CalendarCacheService();

export const cacheInvalidation = new CacheInvalidationService(
  dashboardCache,
  reportsCache,
  calendarCache
);

// Initialize cache cleanup
cacheInvalidation.scheduleCleanup();

// Export cache service class for custom instances
export { CacheService };

// Utility functions
export const getCacheKey = (prefix: string, ...parts: (string | number | object)[]): string => {
  return `${prefix}:${parts.map(part =>
    typeof part === 'object' ? JSON.stringify(part) : String(part)
  ).join(':')}`;
};

export const invalidateAllCaches = (): void => {
  mainCache.flushAll();
  dashboardCache.flushAll();
  reportsCache.flushAll();
  calendarCache.flushAll();
  logger.info('All caches invalidated');
};