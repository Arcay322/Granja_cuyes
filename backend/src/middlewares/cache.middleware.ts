import { Request, Response, NextFunction } from 'express';
import { mainCache, getCacheKey } from '../services/cache.service';
import logger from '../utils/logger';

interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  skipCache?: (req: Request) => boolean;
  varyBy?: string[];
}

// Cache middleware factory
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator,
    condition = () => true,
    skipCache = () => false,
    varyBy = []
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if condition not met
    if (!condition(req) || skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : generateDefaultCacheKey(req, varyBy);

    // Try to get from cache
    const cachedResponse = mainCache.get<any>(cacheKey);
    
    if (cachedResponse) {
      logger.debug(`Cache hit for key: ${cacheKey}`);
      
      // Set cache headers
      res.set({
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `public, max-age=${ttl}`
      });

      return res.json(cachedResponse);
    }

    // Cache miss - intercept response
    logger.debug(`Cache miss for key: ${cacheKey}`);
    
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        mainCache.set(cacheKey, data, ttl);
        logger.debug(`Cached response for key: ${cacheKey}`);
      }

      // Set cache headers
      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `public, max-age=${ttl}`
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

// Generate default cache key
const generateDefaultCacheKey = (req: Request, varyBy: string[]): string => {
  const baseKey = `api:${req.route?.path || req.path}`;
  const queryString = new URLSearchParams(req.query as any).toString();
  
  const varyParts = varyBy.map(field => {
    switch (field) {
      case 'user':
        return `user:${req.user?.id || 'anonymous'}`;
      case 'query':
        return `query:${queryString}`;
      case 'headers':
        return `headers:${JSON.stringify(req.headers)}`;
      default:
        return `${field}:${req.headers[field] || req.query[field] || ''}`;
    }
  });

  return getCacheKey(baseKey, queryString, ...varyParts);
};

// Specific cache middlewares for different endpoints
export const dashboardCacheMiddleware = cacheMiddleware({
  ttl: 300, // 5 minutes
  varyBy: ['user', 'query'],
  condition: (req) => {
    // Only cache if no real-time updates requested
    return !req.query.realtime;
  }
});

export const reportsCacheMiddleware = cacheMiddleware({
  ttl: 1800, // 30 minutes
  varyBy: ['user', 'query'],
  keyGenerator: (req) => {
    const templateId = req.params.templateId;
    const parameters = JSON.stringify(req.body.parameters || {});
    return getCacheKey('reports', templateId, parameters, req.user?.id);
  }
});

export const calendarCacheMiddleware = cacheMiddleware({
  ttl: 900, // 15 minutes
  varyBy: ['user', 'query'],
  condition: (req) => {
    // Don't cache if requesting events for today (might change frequently)
    const today = new Date().toDateString();
    const requestDate = req.query.date ? new Date(req.query.date as string).toDateString() : null;
    return requestDate !== today;
  }
});

// Cache invalidation middleware
export const cacheInvalidationMiddleware = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Invalidate cache on successful mutations
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') &&
          res.statusCode >= 200 && res.statusCode < 300) {
        
        patterns.forEach(pattern => {
          const deletedCount = mainCache.invalidatePattern(pattern);
          if (deletedCount > 0) {
            logger.info(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
          }
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// ETags middleware for conditional requests
export const etagMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Generate ETag based on response data
    const etag = generateETag(data);
    res.set('ETag', etag);

    // Check if client has the same version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === etag) {
      return res.status(304).end();
    }

    return originalJson.call(this, data);
  };

  next();
};

// Generate ETag from data
const generateETag = (data: any): string => {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `"${hash}"`;
};

// Compression middleware for large responses
export const compressionCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    const dataSize = JSON.stringify(data).length;
    
    // Enable compression for responses larger than 1KB
    if (dataSize > 1024) {
      res.set('Content-Encoding', 'gzip');
    }

    return originalJson.call(this, data);
  };

  next();
};

// Rate limiting with cache
export const rateLimitCacheMiddleware = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.user?.id || 'anonymous';
    const windowKey = getCacheKey('ratelimit', clientId, Math.floor(Date.now() / windowMs));
    
    const currentCount = mainCache.get<number>(windowKey) || 0;
    
    if (currentCount >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Increment counter
    mainCache.set(windowKey, currentCount + 1, Math.ceil(windowMs / 1000));
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - currentCount - 1).toString(),
      'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
    });

    next();
  };
};

// Cache warming middleware
export const cacheWarmingMiddleware = (warmUpFunctions: Array<() => Promise<void>>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Warm up cache in background for first request
    if (req.headers['x-cache-warmup'] === 'true') {
      Promise.all(warmUpFunctions.map(fn => fn().catch(err => 
        logger.error('Cache warming error:', err)
      ))).then(() => {
        logger.info('Cache warming completed');
      });
    }

    next();
  };
};