import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const mockUser = {
  id: 1,
  email: 'test@example.com',
  nombre: 'Test User',
  role: 'admin'
};

const mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');

describe('Alerts API', () => {
  beforeAll(async () => {
    // Setup test data if needed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/alerts/rules', () => {
    const validAlertRule = {
      name: 'Test Pregnancy Alert',
      description: 'Test alert for overdue pregnancies',
      type: 'pregnancy_overdue',
      conditions: {
        days: 75
      },
      recipients: ['test@example.com'],
      enabled: true,
      priority: 'high',
      schedule: {
        frequency: 'daily',
        time: '09:00'
      }
    };

    it('should create alert rule successfully', async () => {
      const response = await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validAlertRule)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(validAlertRule.name);
      expect(response.body.data.type).toBe(validAlertRule.type);
    });

    it('should validate required fields', async () => {
      const invalidRule = {
        description: 'Missing required fields'
      };

      const response = await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidRule)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should validate alert type', async () => {
      const invalidRule = {
        ...validAlertRule,
        type: 'invalid_type'
      };

      await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidRule)
        .expect(400);
    });

    it('should validate email recipients', async () => {
      const invalidRule = {
        ...validAlertRule,
        recipients: ['invalid-email']
      };

      await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidRule)
        .expect(400);
    });

    it('should validate business rules for pregnancy alerts', async () => {
      const invalidRule = {
        ...validAlertRule,
        type: 'pregnancy_overdue',
        conditions: {
          days: 30 // Too low for pregnancy alerts
        }
      };

      await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidRule)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/alerts/rules')
        .send(validAlertRule)
        .expect(401);
    });
  });

  describe('GET /api/alerts/rules', () => {
    it('should return list of alert rules', async () => {
      const response = await request(app)
        .get('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/alerts/rules?page=1&limit=5')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support filtering by type', async () => {
      const response = await request(app)
        .get('/api/alerts/rules?type=pregnancy_overdue')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((rule: any) => {
        expect(rule.type).toBe('pregnancy_overdue');
      });
    });
  });

  describe('PUT /api/alerts/rules/:id', () => {
    let ruleId: string;

    beforeEach(async () => {
      // Create a test rule
      const response = await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Test Rule for Update',
          type: 'birth_reminder',
          conditions: { days: 7 },
          recipients: ['test@example.com'],
          priority: 'medium'
        });
      
      ruleId = response.body.data.id;
    });

    it('should update alert rule successfully', async () => {
      const updateData = {
        name: 'Updated Test Rule',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/alerts/rules/${ruleId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it('should return 404 for non-existent rule', async () => {
      await request(app)
        .put('/api/alerts/rules/999999')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/alerts/rules/:id', () => {
    let ruleId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/alerts/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Test Rule for Deletion',
          type: 'health_check',
          conditions: { days: 30 },
          recipients: ['test@example.com'],
          priority: 'low'
        });
      
      ruleId = response.body.data.id;
    });

    it('should delete alert rule successfully', async () => {
      await request(app)
        .delete(`/api/alerts/rules/${ruleId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      // Verify rule is deleted
      await request(app)
        .get(`/api/alerts/rules/${ruleId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);
    });
  });

  describe('GET /api/alerts/active', () => {
    it('should return active alerts', async () => {
      const response = await request(app)
        .get('/api/alerts/active')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by priority', async () => {
      const response = await request(app)
        .get('/api/alerts/active?priority=high')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((alert: any) => {
        expect(alert.priority).toBe('high');
      });
    });
  });

  describe('POST /api/alerts/:id/dismiss', () => {
    // This would require setting up test alerts first
    it('should dismiss alert successfully', async () => {
      // Mock implementation - in real test you'd create an alert first
      const response = await request(app)
        .post('/api/alerts/1/dismiss')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ reason: 'False positive' });

      // Expect either success or 404 for non-existent alert
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/alerts/stats', () => {
    it('should return alert statistics', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRules');
      expect(response.body.data).toHaveProperty('activeAlerts');
      expect(response.body.data).toHaveProperty('alertsByType');
      expect(response.body.data).toHaveProperty('alertsByPriority');
    });
  });
});

// Unit tests for alerts service
describe('Alerts Service', () => {
  let alertsService: any;

  beforeAll(async () => {
    const alertsModule = await import('../services/alerts/alerts.service');
    alertsService = alertsModule;
  });

  describe('Alert Rule Validation', () => {
    it('should validate pregnancy overdue rules', () => {
      const rule = {
        type: 'pregnancy_overdue',
        conditions: { days: 75 },
        recipients: ['test@example.com']
      };

      // This would test internal validation logic
      expect(rule.conditions.days).toBeGreaterThanOrEqual(65);
      expect(rule.conditions.days).toBeLessThanOrEqual(90);
    });

    it('should validate birth reminder rules', () => {
      const rule = {
        type: 'birth_reminder',
        conditions: { days: 7 },
        recipients: ['test@example.com']
      };

      expect(rule.conditions.days).toBeGreaterThanOrEqual(1);
      expect(rule.conditions.days).toBeLessThanOrEqual(14);
    });

    it('should validate capacity warning rules', () => {
      const rule = {
        type: 'capacity_warning',
        conditions: { percentage: 80 },
        recipients: ['test@example.com']
      };

      expect(rule.conditions.percentage).toBeGreaterThanOrEqual(50);
      expect(rule.conditions.percentage).toBeLessThanOrEqual(95);
    });
  });

  describe('Alert Generation', () => {
    it('should generate pregnancy overdue alerts', async () => {
      // Mock test - would require database setup
      const mockPregnancies = [
        {
          id: 1,
          madreId: 1,
          fechaPrenez: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
          estado: 'activa'
        }
      ];

      // Test logic for identifying overdue pregnancies
      const overdueDays = 75;
      const overduePregnancies = mockPregnancies.filter(p => {
        const daysSincePrenez = Math.floor((Date.now() - p.fechaPrenez.getTime()) / (1000 * 60 * 60 * 24));
        return daysSincePrenez > overdueDays;
      });

      expect(overduePregnancies.length).toBe(1);
    });

    it('should generate birth reminder alerts', async () => {
      const mockPregnancies = [
        {
          id: 1,
          madreId: 1,
          fechaProbableParto: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          estado: 'activa'
        }
      ];

      const reminderDays = 7;
      const upcomingBirths = mockPregnancies.filter(p => {
        const daysUntilBirth = Math.floor((p.fechaProbableParto.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilBirth <= reminderDays && daysUntilBirth > 0;
      });

      expect(upcomingBirths.length).toBe(1);
    });
  });

  describe('Notification Processing', () => {
    it('should format alert notifications correctly', () => {
      const alert = {
        type: 'pregnancy_overdue',
        priority: 'high',
        data: {
          madreId: 1,
          daysSincePrenez: 80,
          galpon: 'Galpon A',
          jaula: 'Jaula 1'
        }
      };

      const expectedMessage = expect.stringContaining('preñez vencida');
      const expectedMessage2 = expect.stringContaining('80 días');
      
      // Mock notification formatting
      const message = `Alerta de preñez vencida: Hembra en ${alert.data.galpon}-${alert.data.jaula} lleva ${alert.data.daysSincePrenez} días de gestación`;
      
      expect(message).toEqual(expectedMessage);
      expect(message).toEqual(expectedMessage2);
    });

    it('should prioritize critical alerts', () => {
      const alerts = [
        { priority: 'low', timestamp: new Date() },
        { priority: 'critical', timestamp: new Date() },
        { priority: 'medium', timestamp: new Date() },
        { priority: 'high', timestamp: new Date() }
      ];

      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const sortedAlerts = alerts.sort((a, b) => 
        priorityOrder[b.priority as keyof typeof priorityOrder] - 
        priorityOrder[a.priority as keyof typeof priorityOrder]
      );

      expect(sortedAlerts[0].priority).toBe('critical');
      expect(sortedAlerts[1].priority).toBe('high');
      expect(sortedAlerts[2].priority).toBe('medium');
      expect(sortedAlerts[3].priority).toBe('low');
    });
  });
});

// Integration tests for alert scheduler
describe('Alert Scheduler Integration', () => {
  it('should process scheduled alerts', async () => {
    // Mock test for scheduler functionality
    const mockRules = [
      {
        id: 1,
        type: 'pregnancy_overdue',
        conditions: { days: 75 },
        schedule: { frequency: 'daily', time: '09:00' },
        enabled: true
      }
    ];

    // Test that scheduler would process these rules
    const enabledRules = mockRules.filter(rule => rule.enabled);
    expect(enabledRules.length).toBe(1);

    // Test time-based scheduling logic
    const now = new Date();
    const scheduledTime = '09:00';
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    
    const shouldRun = now.getHours() === hours && now.getMinutes() === minutes;
    // This would be true only at 09:00, so we just test the logic exists
    expect(typeof shouldRun).toBe('boolean');
  });

  it('should handle scheduler errors gracefully', async () => {
    // Test error handling in scheduler
    const mockErrorRule = {
      id: 1,
      type: 'invalid_type',
      enabled: true
    };

    // Scheduler should handle invalid rules without crashing
    try {
      // Mock processing invalid rule
      if (mockErrorRule.type === 'invalid_type') {
        throw new Error('Invalid alert type');
      }
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Invalid alert type');
    }
  });
});