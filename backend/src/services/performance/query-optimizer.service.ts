import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

interface QueryPerformanceMetrics {
  queryId: string;
  query: string;
  executionTime: number;
  timestamp: Date;
  resultCount: number;
  cacheHit: boolean;
}

interface OptimizationSuggestion {
  type: 'index' | 'query_rewrite' | 'caching' | 'pagination';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
}

class QueryOptimizerService {
  private performanceLog: QueryPerformanceMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private maxLogSize = 1000;

  // Monitor query performance
  public async executeWithMonitoring<T>(
    queryId: string,
    queryFn: () => Promise<T>,
    cacheHit: boolean = false
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      // Log performance metrics
      this.logQueryPerformance({
        queryId,
        query: queryId, // In a real implementation, you'd capture the actual SQL
        executionTime,
        timestamp: new Date(),
        resultCount: Array.isArray(result) ? result.length : 1,
        cacheHit
      });

      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        logger.warn(`Slow query detected: ${queryId} took ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      logger.error(`Query failed: ${queryId}`, error);
      throw error;
    }
  }

  // Log query performance
  private logQueryPerformance(metrics: QueryPerformanceMetrics): void {
    this.performanceLog.push(metrics);
    
    // Keep log size manageable
    if (this.performanceLog.length > this.maxLogSize) {
      this.performanceLog = this.performanceLog.slice(-this.maxLogSize);
    }
  }

  // Get performance statistics
  public getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    cacheHitRate: number;
    topSlowQueries: QueryPerformanceMetrics[];
  } {
    const totalQueries = this.performanceLog.length;
    const totalExecutionTime = this.performanceLog.reduce((sum, log) => sum + log.executionTime, 0);
    const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0;
    
    const slowQueries = this.performanceLog.filter(log => log.executionTime > this.slowQueryThreshold).length;
    const cacheHits = this.performanceLog.filter(log => log.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
    
    const topSlowQueries = this.performanceLog
      .filter(log => log.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      topSlowQueries
    };
  }

  // Analyze queries and provide optimization suggestions
  public analyzeAndSuggestOptimizations(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const stats = this.getPerformanceStats();

    // Suggest caching for frequently executed queries
    if (stats.cacheHitRate < 50) {
      suggestions.push({
        type: 'caching',
        description: 'Cache hit rate is low. Consider implementing more aggressive caching.',
        impact: 'high',
        implementation: 'Implement Redis or in-memory caching for frequently accessed data'
      });
    }

    // Suggest indexing for slow queries
    if (stats.slowQueries > stats.totalQueries * 0.1) {
      suggestions.push({
        type: 'index',
        description: 'High number of slow queries detected. Consider adding database indexes.',
        impact: 'high',
        implementation: 'Add indexes on frequently queried columns (fechaNacimiento, estado, madreId, padreId)'
      });
    }

    // Suggest pagination for large result sets
    const largeResultQueries = this.performanceLog.filter(log => log.resultCount > 100);
    if (largeResultQueries.length > 0) {
      suggestions.push({
        type: 'pagination',
        description: 'Large result sets detected. Implement pagination to improve performance.',
        impact: 'medium',
        implementation: 'Add LIMIT and OFFSET to queries, implement cursor-based pagination'
      });
    }

    // Suggest query rewriting for consistently slow queries
    const consistentlySlowQueries = this.getConsistentlySlowQueries();
    if (consistentlySlowQueries.length > 0) {
      suggestions.push({
        type: 'query_rewrite',
        description: 'Some queries are consistently slow. Consider rewriting them.',
        impact: 'high',
        implementation: 'Optimize JOIN operations, use EXISTS instead of IN, consider denormalization'
      });
    }

    return suggestions;
  }

  // Get queries that are consistently slow
  private getConsistentlySlowQueries(): string[] {
    const queryGroups = new Map<string, QueryPerformanceMetrics[]>();
    
    this.performanceLog.forEach(log => {
      if (!queryGroups.has(log.queryId)) {
        queryGroups.set(log.queryId, []);
      }
      queryGroups.get(log.queryId)!.push(log);
    });

    const consistentlySlowQueries: string[] = [];
    
    queryGroups.forEach((logs, queryId) => {
      const slowCount = logs.filter(log => log.executionTime > this.slowQueryThreshold).length;
      const slowPercentage = (slowCount / logs.length) * 100;
      
      if (slowPercentage > 50 && logs.length > 5) {
        consistentlySlowQueries.push(queryId);
      }
    });

    return consistentlySlowQueries;
  }

  // Optimized dashboard queries
  public async getOptimizedDashboardMetrics(filters: any = {}): Promise<any> {
    return this.executeWithMonitoring('dashboard_metrics', async () => {
      // Use a single optimized query instead of multiple queries
      const optimizedQuery = `
        WITH reproductive_stats AS (
          SELECT 
            COUNT(CASE WHEN p.estado = 'activa' THEN 1 END) as active_pregnancies,
            COUNT(CASE WHEN p.estado = 'activa' AND p.fecha_probable_parto <= NOW() + INTERVAL '30 days' THEN 1 END) as expected_births
          FROM "Prenez" p
        ),
        birth_stats AS (
          SELECT 
            COUNT(*) as total_births,
            SUM(num_vivos) as total_live,
            SUM(num_muertos) as total_dead,
            AVG(num_vivos) as avg_litter_size
          FROM "Camada" c
          WHERE c.fecha_nacimiento >= NOW() - INTERVAL '1 month'
        ),
        monthly_comparison AS (
          SELECT 
            COUNT(CASE WHEN c.fecha_nacimiento >= DATE_TRUNC('month', NOW()) THEN 1 END) as this_month,
            COUNT(CASE WHEN c.fecha_nacimiento >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' 
                      AND c.fecha_nacimiento < DATE_TRUNC('month', NOW()) THEN 1 END) as last_month
          FROM "Camada" c
          WHERE c.fecha_nacimiento >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
        )
        SELECT 
          rs.active_pregnancies,
          rs.expected_births,
          bs.total_births,
          bs.total_live,
          bs.total_dead,
          bs.avg_litter_size,
          CASE WHEN (bs.total_live + bs.total_dead) > 0 
               THEN (bs.total_live::float / (bs.total_live + bs.total_dead)) * 100 
               ELSE 0 END as success_rate,
          mc.this_month,
          mc.last_month
        FROM reproductive_stats rs
        CROSS JOIN birth_stats bs
        CROSS JOIN monthly_comparison mc
      `;

      const result = await prisma.$queryRawUnsafe(optimizedQuery) as any[];
      
      if (result.length === 0) {
        throw new Error('No data returned from optimized query');
      }

      const row = result[0];
      
      return {
        reproductiveStats: {
          activePregnancies: Number(row.active_pregnancies) || 0,
          expectedBirths: Number(row.expected_births) || 0,
          successRate: Number(row.success_rate) || 0,
          averageLitterSize: Number(row.avg_litter_size) || 0,
          totalBirthsThisMonth: Number(row.this_month) || 0,
          totalBirthsLastMonth: Number(row.last_month) || 0
        }
      };
    });
  }

  // Optimized performance metrics query
  public async getOptimizedPerformanceMetrics(): Promise<any> {
    return this.executeWithMonitoring('performance_metrics', async () => {
      const topMothersQuery = `
        SELECT 
          c.id,
          c.raza,
          c.galpon,
          c.jaula,
          COUNT(cam.id) as total_litters,
          AVG(cam.num_vivos) as average_litter_size,
          (SUM(cam.num_vivos)::float / NULLIF(SUM(cam.num_vivos + cam.num_muertos), 0)) * 100 as success_rate
        FROM "Cuy" c
        INNER JOIN "Camada" cam ON c.id = cam.madre_id
        WHERE c.sexo = 'H' 
          AND c.etapa_vida = 'Reproductora'
          AND c.estado = 'Activo'
          AND cam.fecha_nacimiento >= NOW() - INTERVAL '1 year'
        GROUP BY c.id, c.raza, c.galpon, c.jaula
        HAVING COUNT(cam.id) >= 2
        ORDER BY total_litters DESC, average_litter_size DESC
        LIMIT 5
      `;

      const topFathersQuery = `
        SELECT 
          c.id,
          c.raza,
          c.galpon,
          c.jaula,
          COUNT(DISTINCT cam.id) as total_offspring,
          COUNT(DISTINCT p.id) as active_breedings
        FROM "Cuy" c
        LEFT JOIN "Camada" cam ON c.id = cam.padre_id
        LEFT JOIN "Prenez" p ON c.id = p.padre_id AND p.estado = 'activa'
        WHERE c.sexo = 'M' 
          AND c.etapa_vida = 'Reproductor'
          AND c.estado = 'Activo'
        GROUP BY c.id, c.raza, c.galpon, c.jaula
        HAVING COUNT(DISTINCT cam.id) > 0
        ORDER BY total_offspring DESC, active_breedings DESC
        LIMIT 5
      `;

      const [topMothersRaw, topFathersRaw] = await Promise.all([
        prisma.$queryRawUnsafe(topMothersQuery),
        prisma.$queryRawUnsafe(topFathersQuery)
      ]);

      return {
        topPerformingMothers: (topMothersRaw as any[]).map(row => ({
          id: Number(row.id),
          raza: String(row.raza),
          galpon: String(row.galpon),
          jaula: String(row.jaula),
          totalLitters: Number(row.total_litters),
          averageLitterSize: Number(row.average_litter_size) || 0,
          successRate: Number(row.success_rate) || 0
        })),
        topPerformingFathers: (topFathersRaw as any[]).map(row => ({
          id: Number(row.id),
          raza: String(row.raza),
          galpon: String(row.galpon),
          jaula: String(row.jaula),
          totalOffspring: Number(row.total_offspring),
          activeBreedings: Number(row.active_breedings)
        }))
      };
    });
  }

  // Clear performance log
  public clearPerformanceLog(): void {
    this.performanceLog = [];
    logger.info('Performance log cleared');
  }

  // Export performance data
  public exportPerformanceData(): {
    summary: any;
    suggestions: OptimizationSuggestion[];
    detailedLog: QueryPerformanceMetrics[];
  } {
    return {
      summary: this.getPerformanceStats(),
      suggestions: this.analyzeAndSuggestOptimizations(),
      detailedLog: this.performanceLog
    };
  }
}

// Database connection optimization
class DatabaseOptimizer {
  // Optimize Prisma connection pool
  public static optimizePrismaConnection(): PrismaClient {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty'
    });
  }

  // Suggest database indexes
  public static getDatabaseIndexSuggestions(): string[] {
    return [
      'CREATE INDEX IF NOT EXISTS idx_prenez_estado ON "Prenez"(estado);',
      'CREATE INDEX IF NOT EXISTS idx_prenez_fecha_probable_parto ON "Prenez"(fecha_probable_parto);',
      'CREATE INDEX IF NOT EXISTS idx_camada_fecha_nacimiento ON "Camada"(fecha_nacimiento);',
      'CREATE INDEX IF NOT EXISTS idx_camada_madre_id ON "Camada"(madre_id);',
      'CREATE INDEX IF NOT EXISTS idx_camada_padre_id ON "Camada"(padre_id);',
      'CREATE INDEX IF NOT EXISTS idx_cuy_estado ON "Cuy"(estado);',
      'CREATE INDEX IF NOT EXISTS idx_cuy_etapa_vida ON "Cuy"(etapa_vida);',
      'CREATE INDEX IF NOT EXISTS idx_cuy_sexo ON "Cuy"(sexo);',
      'CREATE INDEX IF NOT EXISTS idx_cuy_galpon ON "Cuy"(galpon);',
      'CREATE INDEX IF NOT EXISTS idx_historial_salud_cuy_id ON "HistorialSalud"(cuy_id);',
      'CREATE INDEX IF NOT EXISTS idx_historial_salud_fecha ON "HistorialSalud"(fecha);'
    ];
  }

  // Check database health
  public static async checkDatabaseHealth(): Promise<{
    connectionStatus: 'healthy' | 'slow' | 'error';
    responseTime: number;
    activeConnections?: number;
    suggestions: string[];
  }> {
    const startTime = Date.now();
    const suggestions: string[] = [];

    try {
      // Simple health check query
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      let connectionStatus: 'healthy' | 'slow' | 'error' = 'healthy';
      
      if (responseTime > 1000) {
        connectionStatus = 'slow';
        suggestions.push('Database response time is slow. Consider optimizing queries or upgrading hardware.');
      }

      if (responseTime > 100) {
        suggestions.push('Consider implementing connection pooling optimization.');
      }

      return {
        connectionStatus,
        responseTime,
        suggestions
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        connectionStatus: 'error',
        responseTime: Date.now() - startTime,
        suggestions: ['Database connection failed. Check connection string and database availability.']
      };
    }
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizerService();
export { DatabaseOptimizer };

// Export for use in other services
export default queryOptimizer;