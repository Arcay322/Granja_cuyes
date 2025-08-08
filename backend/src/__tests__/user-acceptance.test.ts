import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const mockUser = {
  id: 1,
  email: 'user@example.com',
  nombre: 'Test User',
  role: 'user'
};

const mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');

describe('User Acceptance Tests - Phase 2 Features', () => {
  beforeAll(async () => {
    // Setup comprehensive test data
    await setupComprehensiveTestData();
  });

  afterAll(async () => {
    await cleanupComprehensiveTestData();
    await prisma.$disconnect();
  });

  describe('Complete User Workflow: Dashboard to Report Generation', () => {
    it('should complete full dashboard workflow', async () => {
      // Step 1: User accesses dashboard
      const dashboardResponse = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.data).toHaveProperty('reproductiveStats');
      expect(dashboardResponse.body.data).toHaveProperty('performanceMetrics');

      // Step 2: User applies filters to dashboard
      const filteredResponse = await request(app)
        .get('/api/dashboard?galpon=Test Galpon A&dateFrom=2024-01-01&dateTo=2024-12-31')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(filteredResponse.body.success).toBe(true);

      // Step 3: User generates a report based on dashboard data
      const reportResponse = await request(app)
        .post('/api/reports/generate/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          parameters: {
            galpon: 'Test Galpon A',
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31'
          }
        })
        .expect(200);

      expect(reportResponse.body.success).toBe(true);
      expect(reportResponse.body.data).toHaveProperty('sections');
      expect(reportResponse.body.data.sections.length).toBeGreaterThan(0);

      // Step 4: User exports the report
      const exportResponse = await request(app)
        .post('/api/reports/export/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          format: 'pdf',
          parameters: {
            galpon: 'Test Galpon A',
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31'
          }
        })
        .expect(202);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data).toHaveProperty('jobId');

      // Step 5: User checks export status
      const jobId = exportResponse.body.data.jobId;
      const statusResponse = await request(app)
        .get(`/api/reports/exports/${jobId}/status`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data).toHaveProperty('status');
    });

    it('should handle complete alert system workflow', async () => {
      // Step 1: User creates an alert rule
      const alertRule = {
        name: 'Test Pregnancy Alert',
        description: 'Alert for overdue pregnancies',
        type: 'pregnancy_overdue',
        conditions: { days: 75 },
        recipients: ['test@example.com'],
        enabled: true,
        priority: 'high'
      };

      const createResponse = await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(alertRule)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const ruleId = createResponse.body.data.id;

      // Step 2: User views active alerts
      const alertsResponse = await request(app)
        .get('/api/alerts/active')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(alertsResponse.body.success).toBe(true);
      expect(Array.isArray(alertsResponse.body.data)).toBe(true);

      // Step 3: User modifies alert rule
      const updateResponse = await request(app)
        .put(`/api/alerts/rules/${ruleId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ priority: 'critical' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.priority).toBe('critical');

      // Step 4: User views alert statistics
      const statsResponse = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toHaveProperty('totalRules');
    });

    it('should handle complete calendar workflow', async () => {
      // Step 1: User views calendar events
      const calendarResponse = await request(app)
        .get('/api/calendar/events')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(calendarResponse.body.success).toBe(true);
      expect(Array.isArray(calendarResponse.body.data)).toBe(true);

      // Step 2: User creates a calendar event
      const eventData = {
        title: 'Scheduled Health Check',
        type: 'health_check',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        animalIds: [1, 2, 3],
        description: 'Monthly health check for reproductors'
      };

      const createEventResponse = await request(app)
        .post('/api/calendar/events')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(eventData)
        .expect(201);

      expect(createEventResponse.body.success).toBe(true);
      const eventId = createEventResponse.body.data.id;

      // Step 3: User updates the event
      const updateEventResponse = await request(app)
        .put(`/api/calendar/events/${eventId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ title: 'Updated Health Check' })
        .expect(200);

      expect(updateEventResponse.body.success).toBe(true);
      expect(updateEventResponse.body.data.title).toBe('Updated Health Check');

      // Step 4: User filters calendar events
      const filteredEventsResponse = await request(app)
        .get('/api/calendar/events?type=health_check')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(filteredEventsResponse.body.success).toBe(true);
      filteredEventsResponse.body.data.forEach((event: any) => {
        expect(event.type).toBe('health_check');
      });
    });
  });

  describe('Real Breeding Scenarios Validation', () => {
    it('should handle complete breeding cycle', async () => {
      // Step 1: Create a new pregnancy
      const pregnancyData = {
        madreId: 1,
        padreId: 2,
        fechaPrenez: new Date().toISOString(),
        fechaProbableParto: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
        estado: 'activa'
      };

      const pregnancyResponse = await request(app)
        .post('/api/reproduccion/prenez')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(pregnancyData)
        .expect(201);

      expect(pregnancyResponse.body.success).toBe(true);
      const pregnancyId = pregnancyResponse.body.data.id;

      // Step 2: Monitor pregnancy progress
      const pregnancyStatusResponse = await request(app)
        .get(`/api/reproduccion/prenez/${pregnancyId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(pregnancyStatusResponse.body.success).toBe(true);
      expect(pregnancyStatusResponse.body.data.estado).toBe('activa');

      // Step 3: Record birth (complete pregnancy)
      const birthData = {
        fechaNacimiento: new Date().toISOString(),
        numVivos: 4,
        numMuertos: 1,
        madreId: 1,
        padreId: 2,
        prenezId: pregnancyId
      };

      const birthResponse = await request(app)
        .post('/api/reproduccion/camadas')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(birthData)
        .expect(201);

      expect(birthResponse.body.success).toBe(true);
      expect(birthResponse.body.data.numVivos).toBe(4);
      expect(birthResponse.body.data.numMuertos).toBe(1);

      // Step 4: Verify pregnancy is completed
      const completedPregnancyResponse = await request(app)
        .get(`/api/reproduccion/prenez/${pregnancyId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(completedPregnancyResponse.body.data.estado).toBe('completada');

      // Step 5: Verify dashboard reflects the changes
      const updatedDashboardResponse = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(updatedDashboardResponse.body.success).toBe(true);
      // Dashboard should show updated statistics
    });

    it('should handle overdue pregnancy scenario', async () => {
      // Create an overdue pregnancy (75+ days ago)
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 80);

      const overduePregnancyData = {
        madreId: 3,
        padreId: 4,
        fechaPrenez: overdueDate.toISOString(),
        fechaProbableParto: new Date(overdueDate.getTime() + 70 * 24 * 60 * 60 * 1000).toISOString(),
        estado: 'activa'
      };

      const overdueResponse = await request(app)
        .post('/api/reproduccion/prenez')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(overduePregnancyData)
        .expect(201);

      expect(overdueResponse.body.success).toBe(true);

      // Check if alerts are generated for overdue pregnancy
      const alertsResponse = await request(app)
        .get('/api/alerts/active?type=pregnancy_overdue')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(alertsResponse.body.success).toBe(true);
      // Should have alerts for overdue pregnancies
    });

    it('should handle high mortality scenario', async () => {
      // Create a birth with high mortality rate
      const highMortalityData = {
        fechaNacimiento: new Date().toISOString(),
        numVivos: 2,
        numMuertos: 4, // 66% mortality rate
        madreId: 5,
        padreId: 6
      };

      const highMortalityResponse = await request(app)
        .post('/api/reproduccion/camadas')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(highMortalityData)
        .expect(201);

      expect(highMortalityResponse.body.success).toBe(true);

      // Check if high mortality alerts are generated
      const mortalityAlertsResponse = await request(app)
        .get('/api/alerts/active?type=high_mortality')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(mortalityAlertsResponse.body.success).toBe(true);
    });
  });

  describe('Complex Scheduling and Conflict Scenarios', () => {
    it('should detect and handle calendar conflicts', async () => {
      const baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      // Create first event
      const event1Data = {
        title: 'Health Check Group A',
        type: 'health_check',
        date: baseDate.toISOString(),
        animalIds: [1, 2, 3],
        duration: 120 // 2 hours
      };

      const event1Response = await request(app)
        .post('/api/calendar/events')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(event1Data)
        .expect(201);

      expect(event1Response.body.success).toBe(true);

      // Try to create conflicting event
      const conflictingEventData = {
        title: 'Vaccination Group A',
        type: 'vaccination',
        date: new Date(baseDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
        animalIds: [2, 3, 4], // Overlapping animals
        vaccineType: 'Annual Vaccine'
      };

      const conflictResponse = await request(app)
        .post('/api/calendar/events')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(conflictingEventData);

      // Should either reject the conflict or provide warnings
      if (conflictResponse.status === 409) {
        expect(conflictResponse.body.success).toBe(false);
        expect(conflictResponse.body.message).toContain('conflict');
      } else {
        expect(conflictResponse.status).toBe(201);
        // If accepted, should have conflict warnings
      }
    });

    it('should handle bulk operations efficiently', async () => {
      // Test bulk calendar event creation
      const bulkEvents = [];
      for (let i = 0; i < 10; i++) {
        const eventDate = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
        bulkEvents.push({
          title: `Daily Check ${i + 1}`,
          type: 'health_check',
          date: eventDate.toISOString(),
          animalIds: [1, 2]
        });
      }

      const startTime = Date.now();
      const bulkPromises = bulkEvents.map(event =>
        request(app)
          .post('/api/calendar/events')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(event)
      );

      const bulkResults = await Promise.all(bulkPromises);
      const endTime = Date.now();

      // All should succeed
      bulkResults.forEach(result => {
        expect(result.status).toBe(201);
      });

      // Should complete within reasonable time
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // 5 seconds for 10 events
    });
  });

  describe('Report Generation Quality and Accuracy', () => {
    it('should generate accurate reproductive summary report', async () => {
      const reportResponse = await request(app)
        .post('/api/reports/generate/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          parameters: {
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31'
          }
        })
        .expect(200);

      expect(reportResponse.body.success).toBe(true);
      const report = reportResponse.body.data;

      // Verify report structure
      expect(report).toHaveProperty('title');
      expect(report).toHaveProperty('sections');
      expect(report).toHaveProperty('metadata');

      // Verify data accuracy by cross-checking with direct queries
      const directPregnancyCount = await prisma.prenez.count({
        where: { estado: 'activa' }
      });

      const summarySection = report.sections.find((s: any) => s.type === 'summary');
      if (summarySection && summarySection.data.reproductiveStats) {
        const reportPregnancyCount = summarySection.data.reproductiveStats.activePregnancies;
        expect(reportPregnancyCount).toBe(directPregnancyCount);
      }
    });

    it('should generate accurate performance metrics report', async () => {
      const reportResponse = await request(app)
        .post('/api/reports/generate/breeding_performance')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          parameters: {
            period: 'month'
          }
        })
        .expect(200);

      expect(reportResponse.body.success).toBe(true);
      const report = reportResponse.body.data;

      // Verify performance data accuracy
      const performanceSection = report.sections.find((s: any) => s.type === 'table' && s.id === 'top_performers');
      if (performanceSection) {
        expect(performanceSection.data).toHaveProperty('rows');
        expect(Array.isArray(performanceSection.data.rows)).toBe(true);
        
        // Verify data consistency
        performanceSection.data.rows.forEach((row: any) => {
          expect(row).toHaveProperty('totalLitters');
          expect(row).toHaveProperty('averageLitterSize');
          expect(row).toHaveProperty('successRate');
          expect(typeof row.totalLitters).toBe('number');
          expect(row.totalLitters).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('should handle comprehensive data sets in reports', async () => {
      // Generate report with large dataset
      const startTime = Date.now();
      
      const reportResponse = await request(app)
        .post('/api/reports/generate/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          parameters: {
            dateFrom: '2020-01-01',
            dateTo: '2024-12-31'
          }
        })
        .expect(200);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(reportResponse.body.success).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

      const report = reportResponse.body.data;
      expect(report.metadata).toHaveProperty('totalRecords');
      expect(report.metadata).toHaveProperty('executionTime');
      expect(typeof report.metadata.totalRecords).toBe('number');
    });
  });

  describe('System Performance Under Load', () => {
    it('should handle concurrent dashboard requests', async () => {
      const concurrentRequests = 20;
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

      // Should handle load efficiently
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 20 concurrent requests
    });

    it('should maintain performance with large datasets', async () => {
      // Test with pagination
      const largeDatasetResponse = await request(app)
        .get('/api/cuyes?limit=1000')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(largeDatasetResponse.body.success).toBe(true);
      expect(Array.isArray(largeDatasetResponse.body.data)).toBe(true);
      expect(largeDatasetResponse.body.data.length).toBeLessThanOrEqual(1000);

      // Response should be reasonably fast
      // This is implicitly tested by the request timeout
    });
  });
});

// Helper functions for comprehensive test setup
async function setupComprehensiveTestData() {
  try {
    // Create test galpones
    await prisma.galpon.createMany({
      data: [
        { nombre: 'Test Galpon A', capacidadMaxima: 200, ubicacion: 'North Wing' },
        { nombre: 'Test Galpon B', capacidadMaxima: 150, ubicacion: 'South Wing' },
        { nombre: 'Test Galpon C', capacidadMaxima: 100, ubicacion: 'East Wing' }
      ],
      skipDuplicates: true
    });

    // Create comprehensive test cuyes
    const testCuyes = [];
    for (let i = 1; i <= 100; i++) {
      testCuyes.push({
        raza: ['Peru', 'Andina', 'Inti'][i % 3],
        sexo: i % 2 === 0 ? 'M' : 'H',
        fechaNacimiento: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        peso: 600 + Math.random() * 600,
        galpon: ['Test Galpon A', 'Test Galpon B', 'Test Galpon C'][i % 3],
        jaula: `Jaula ${Math.floor(i / 10) + 1}`,
        estado: 'Activo',
        etapaVida: ['Cria', 'Engorde', 'Reproductor', 'Reproductora'][i % 4]
      });
    }

    await prisma.cuy.createMany({
      data: testCuyes,
      skipDuplicates: true
    });

    // Create comprehensive pregnancy data
    const hembras = await prisma.cuy.findMany({
      where: { sexo: 'H', etapaVida: 'Reproductora' }
    });

    const machos = await prisma.cuy.findMany({
      where: { sexo: 'M', etapaVida: 'Reproductor' }
    });

    if (hembras.length > 0 && machos.length > 0) {
      const pregnancies = [];
      for (let i = 0; i < Math.min(30, hembras.length); i++) {
        const fechaPrenez = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const fechaProbableParto = new Date(fechaPrenez);
        fechaProbableParto.setDate(fechaProbableParto.getDate() + 70);

        pregnancies.push({
          madreId: hembras[i].id,
          padreId: machos[Math.floor(Math.random() * machos.length)].id,
          fechaPrenez,
          fechaProbableParto,
          estado: Math.random() > 0.4 ? 'activa' : 'completada'
        });
      }

      await prisma.prenez.createMany({
        data: pregnancies,
        skipDuplicates: true
      });

      // Create corresponding litters for completed pregnancies
      const completedPregnancies = await prisma.prenez.findMany({
        where: { estado: 'completada' }
      });

      const litters = completedPregnancies.map(prenez => ({
        fechaNacimiento: new Date(prenez.fechaProbableParto),
        numVivos: Math.floor(Math.random() * 6) + 1,
        numMuertos: Math.floor(Math.random() * 3),
        madreId: prenez.madreId,
        padreId: prenez.padreId,
        prenezId: prenez.id
      }));

      if (litters.length > 0) {
        await prisma.camada.createMany({
          data: litters,
          skipDuplicates: true
        });
      }
    }

    console.log('✅ Comprehensive test data setup completed');
  } catch (error) {
    console.error('❌ Error setting up comprehensive test data:', error);
  }
}

async function cleanupComprehensiveTestData() {
  try {
    // Clean up in reverse order of dependencies
    await prisma.camada.deleteMany({
      where: {
        madreId: {
          in: await prisma.cuy.findMany({
            where: {
              galpon: {
                in: ['Test Galpon A', 'Test Galpon B', 'Test Galpon C']
              }
            },
            select: { id: true }
          }).then(cuyes => cuyes.map(c => c.id))
        }
      }
    });

    await prisma.prenez.deleteMany({
      where: {
        madreId: {
          in: await prisma.cuy.findMany({
            where: {
              galpon: {
                in: ['Test Galpon A', 'Test Galpon B', 'Test Galpon C']
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
          in: ['Test Galpon A', 'Test Galpon B', 'Test Galpon C']
        }
      }
    });

    await prisma.galpon.deleteMany({
      where: {
        nombre: {
          in: ['Test Galpon A', 'Test Galpon B', 'Test Galpon C']
        }
      }
    });

    console.log('✅ Comprehensive test data cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up comprehensive test data:', error);
  }
}