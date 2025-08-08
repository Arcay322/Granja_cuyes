import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { queryOptimizer } from '../services/performance/query-optimizer.service';

const prisma = new PrismaClient();

const mockUser = {
  id: 1,
  email: 'test@example.com',
  nombre: 'Test User',
  role: 'admin'
};

const mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');

describe('Reproduction Optimizations', () => {
  beforeAll(async () => {
    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Dashboard Performance', () => {
    it('should load dashboard metrics within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body.data).toHaveProperty('reproductiveStats');
      expect(response.body.data).toHaveProperty('performanceMetrics');
    });

    it('should cache dashboard metrics effectively', async () => {
      // First request
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`);
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`);
      const time2 = Date.now() - start2;

      expect(response1.body).toEqual(response2.body);
      expect(time2).toBeLessThan(time1); // Cached response should be faster
    });

    it('should handle concurrent dashboard requests', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests).fill(null).map(() =>
        request(app)
          .get('/api/dashboard')
          .set('Authorization', `Bearer ${mockToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should handle concurrent requests efficiently
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
    });
  });

  describe('Query Optimization', () => {
    it('should track query performance', async () => {
      const testQuery = async () => {
        return await prisma.cuy.findMany({
          where: { estado: 'Activo' },
          take: 10
        });
      };

      await queryOptimizer.executeWithMonitoring('test_query', testQuery);

      const stats = queryOptimizer.getPerformanceStats();
      expect(stats.totalQueries).toBeGreaterThan(0);
      expect(typeof stats.averageExecutionTime).toBe('number');
    });

    it('should identify slow queries', async () => {
      // Simulate a slow query
      const slowQuery = async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds
        return { data: 'slow result' };
      };

      await queryOptimizer.executeWithMonitoring('slow_query', slowQuery);

      const stats = queryOptimizer.getPerformanceStats();
      expect(stats.slowQueries).toBeGreaterThan(0);
      expect(stats.topSlowQueries.length).toBeGreaterThan(0);
    });

    it('should provide optimization suggestions', () => {
      // Generate some test data for analysis
      const suggestions = queryOptimizer.analyzeAndSuggestOptimizations();
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('implementation');
        expect(['low', 'medium', 'high']).toContain(suggestion.impact);
      });
    });
  });

  describe('Reproductive Data Queries', () => {
    it('should efficiently query active pregnancies', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/reproduccion/prenez?estado=activa')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should efficiently query recent births', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/reproduccion/camadas?limit=50')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });

    it('should handle complex reproductive queries', async () => {
      const complexQuery = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        galpon: 'Galpon A',
        estado: 'activa'
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/reproduccion/prenez')
        .query(complexQuery)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1500); // Complex queries may take longer
      expect(response.body.success).toBe(true);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should handle large result sets efficiently', async () => {
      const initialMemory = process.memoryUsage();
      
      // Request large dataset
      const response = await request(app)
        .get('/api/cuyes?limit=1000')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(response.body.data.length).toBeLessThanOrEqual(1000);
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should properly cleanup resources', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/dashboard')
          .set('Authorization', `Bearer ${mockToken}`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory should not increase significantly after multiple requests
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
    });
  });

  describe('Database Connection Optimization', () => {
    it('should maintain healthy database connections', async () => {
      const { DatabaseOptimizer } = await import('../services/performance/query-optimizer.service');
      
      const healthCheck = await DatabaseOptimizer.checkDatabaseHealth();
      
      expect(healthCheck).toHaveProperty('connectionStatus');
      expect(healthCheck).toHaveProperty('responseTime');
      expect(healthCheck).toHaveProperty('suggestions');
      expect(['healthy', 'slow', 'error']).toContain(healthCheck.connectionStatus);
      expect(typeof healthCheck.responseTime).toBe('number');
    });

    it('should provide database optimization suggestions', () => {
      const { DatabaseOptimizer } = require('../services/performance/query-optimizer.service');
      
      const suggestions = DatabaseOptimizer.getDatabaseIndexSuggestions();
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion).toContain('CREATE INDEX');
      });
    });
  });

  describe('API Response Optimization', () => {
    it('should compress large responses', async () => {
      const response = await request(app)
        .get('/api/cuyes?limit=500')
        .set('Authorization', `Bearer ${mockToken}`)
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Check if response is compressed for large datasets
      const responseSize = JSON.stringify(response.body).length;
      if (responseSize > 1024) { // If response is larger than 1KB
        expect(response.headers['content-encoding']).toBeDefined();
      }
    });

    it('should include appropriate cache headers', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      // Should include cache-related headers
      expect(response.headers).toHaveProperty('x-cache');
      expect(['HIT', 'MISS']).toContain(response.headers['x-cache']);
    });

    it('should handle ETags for conditional requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      const etag = response1.headers.etag;
      
      if (etag) {
        // Second request with ETag
        const response2 = await request(app)
          .get('/api/dashboard')
          .set('Authorization', `Bearer ${mockToken}`)
          .set('If-None-Match', etag);

        // Should return 304 if content hasn't changed
        expect([200, 304]).toContain(response2.status);
      }
    });
  });
});

// Helper functions for test setup
async function setupTestData() {
  try {
    // Create test galpones
    await prisma.galpon.createMany({
      data: [
        { nombre: 'Test Galpon A', capacidadMaxima: 100, ubicacion: 'Test Location A' },
        { nombre: 'Test Galpon B', capacidadMaxima: 150, ubicacion: 'Test Location B' }
      ],
      skipDuplicates: true
    });

    // Create test cuyes
    const testCuyes = [];
    for (let i = 1; i <= 50; i++) {
      testCuyes.push({
        raza: i % 2 === 0 ? 'Peru' : 'Andina',
        sexo: i % 3 === 0 ? 'M' : 'H',
        fechaNacimiento: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        peso: 800 + Math.random() * 400,
        galpon: i % 2 === 0 ? 'Test Galpon A' : 'Test Galpon B',
        jaula: `Jaula ${Math.floor(i / 10) + 1}`,
        estado: 'Activo',
        etapaVida: i % 4 === 0 ? 'Reproductor' : i % 4 === 1 ? 'Reproductora' : 'Engorde'
      });
    }

    await prisma.cuy.createMany({
      data: testCuyes,
      skipDuplicates: true
    });

    // Create test pregnancies
    const hembras = await prisma.cuy.findMany({
      where: { sexo: 'H', etapaVida: 'Reproductora' }
    });

    const machos = await prisma.cuy.findMany({
      where: { sexo: 'M', etapaVida: 'Reproductor' }
    });

    if (hembras.length > 0 && machos.length > 0) {
      const testPregnancies = [];
      for (let i = 0; i < Math.min(10, hembras.length); i++) {
        const fechaPrenez = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
        const fechaProbableParto = new Date(fechaPrenez);
        fechaProbableParto.setDate(fechaProbableParto.getDate() + 70);

        testPregnancies.push({
          madreId: hembras[i].id,
          padreId: machos[Math.floor(Math.random() * machos.length)].id,
          fechaPrenez,
          fechaProbableParto,
          estado: Math.random() > 0.3 ? 'activa' : 'completada'
        });
      }

      await prisma.prenez.createMany({
        data: testPregnancies,
        skipDuplicates: true
      });
    }

  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

async function cleanupTestData() {
  try {
    // Clean up in reverse order of dependencies
    await prisma.prenez.deleteMany({
      where: {
        madreId: {
          in: await prisma.cuy.findMany({
            where: {
              galpon: {
                in: ['Test Galpon A', 'Test Galpon B']
              }
            },
            select: { id: true }
          }).then(cuyes => cuyes.map(c => c.id))
        }
      }
    });

    await prisma.cuy.deleteMany({
      where: {
        galpon: {
          in: ['Test Galpon A', 'Test Galpon B']
        }
      }
    });

    await prisma.galpon.deleteMany({
      where: {
        nombre: {
          in: ['Test Galpon A', 'Test Galpon B']
        }
      }
    });

  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}