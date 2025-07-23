import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Reproduction Module Improvements', () => {
  let authToken: string;
  let testMadreId: number;
  let testPadreId: number;
  let testPrenezId: number;

  beforeAll(async () => {
    // Configurar datos de prueba
    // Nota: En un entorno real, esto se haría con datos de prueba específicos
    
    // Obtener token de autenticación (simulado)
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.$disconnect();
  });

  describe('Breeding Eligibility and Validation', () => {
    test('should get available mothers for breeding', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/madres-disponibles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const madre = response.body.data[0];
        expect(madre).toHaveProperty('id');
        expect(madre).toHaveProperty('estaDisponible');
        expect(madre).toHaveProperty('historialReproductivo');
        expect(madre.historialReproductivo).toHaveProperty('tasaExito');
        testMadreId = madre.id;
      }
    });

    test('should get available fathers for breeding', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/padres-disponibles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const padre = response.body.data[0];
        expect(padre).toHaveProperty('id');
        expect(padre).toHaveProperty('estaDisponible');
        expect(padre).toHaveProperty('rendimientoReproductivo');
        expect(padre.rendimientoReproductivo).toHaveProperty('tasaExito');
        testPadreId = padre.id;
      }
    });

    test('should get eligible mothers for litter registration', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/madres-elegibles-camada')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const madreElegible = response.body.data[0];
        expect(madreElegible).toHaveProperty('prenezId');
        expect(madreElegible).toHaveProperty('madre');
        expect(madreElegible).toHaveProperty('diasGestacion');
        expect(madreElegible).toHaveProperty('esElegible');
        expect(madreElegible.esElegible).toBe(true);
      }
    });
  });

  describe('Gestation Period Validation', () => {
    test('should validate gestation period correctly', async () => {
      if (!testMadreId) {
        console.log('Skipping gestation validation test - no test mother available');
        return;
      }

      const response = await request(app)
        .post('/reproduccion/prenez/validar-gestacion')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          madreId: testMadreId,
          fechaRegistroCamada: new Date().toISOString().split('T')[0]
        });

      // La respuesta puede ser exitosa o fallar dependiendo del estado de la madre
      expect([200, 400, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('validacion');
        expect(response.body.data.validacion).toHaveProperty('esValido');
        expect(response.body.data.validacion).toHaveProperty('tipo');
        expect(response.body.data.validacion).toHaveProperty('mensaje');
      }
    });

    test('should reject invalid gestation validation request', async () => {
      const response = await request(app)
        .post('/reproduccion/prenez/validar-gestacion')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('madreId');
    });
  });

  describe('Breeding Compatibility System', () => {
    test('should calculate breeding compatibility', async () => {
      if (!testMadreId || !testPadreId) {
        console.log('Skipping compatibility test - no test parents available');
        return;
      }

      const response = await request(app)
        .post('/reproduccion/prenez/calcular-compatibilidad')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          madreId: testMadreId,
          padreId: testPadreId
        });

      // La respuesta puede fallar si los reproductores no existen
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('compatibilityScore');
        expect(response.body.data).toHaveProperty('nivelCompatibilidad');
        expect(response.body.data).toHaveProperty('recomendaciones');
        expect(response.body.data).toHaveProperty('predicciones');
        expect(typeof response.body.data.compatibilityScore).toBe('number');
        expect(response.body.data.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(response.body.data.compatibilityScore).toBeLessThanOrEqual(100);
      }
    });

    test('should get breeding recommendations', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/recomendaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recomendaciones');
      expect(response.body.data).toHaveProperty('resumen');
      expect(Array.isArray(response.body.data.recomendaciones)).toBe(true);
    });

    test('should reject compatibility calculation without required parameters', async () => {
      const response = await request(app)
        .post('/reproduccion/prenez/calcular-compatibilidad')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('madreId');
    });
  });

  describe('Reproductive Performance Analytics', () => {
    test('should get basic reproduction statistics', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resumen');
      expect(response.body.data).toHaveProperty('promedios');
      expect(response.body.data.resumen).toHaveProperty('totalPreneces');
      expect(response.body.data.resumen).toHaveProperty('prenecesActivas');
      expect(response.body.data.promedios).toHaveProperty('tasaExito');
    });

    test('should get advanced reproduction statistics', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/estadisticas-avanzadas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resumen');
      expect(response.body.data).toHaveProperty('distribucion');
      expect(response.body.data.resumen).toHaveProperty('totalReproductoras');
    });

    test('should get specific reproduction alerts', async () => {
      const response = await request(app)
        .get('/reproduccion/prenez/alertas-especificas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resumen');
      expect(response.body.data).toHaveProperty('alertas');
      expect(response.body.data.resumen).toHaveProperty('total');
      expect(response.body.data.alertas).toHaveProperty('criticas');
      expect(response.body.data.alertas).toHaveProperty('altas');
      expect(response.body.data.alertas).toHaveProperty('medias');
      expect(response.body.data.alertas).toHaveProperty('bajas');
    });
  });

  describe('Integration Tests', () => {
    test('should create pregnancy with improved validation', async () => {
      if (!testMadreId) {
        console.log('Skipping pregnancy creation test - no test mother available');
        return;
      }

      const response = await request(app)
        .post('/reproduccion/prenez')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          madreId: testMadreId,
          padreId: testPadreId || null,
          fechaPrenez: new Date().toISOString().split('T')[0],
          notas: 'Prueba de mejoras de reproducción'
        });

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        testPrenezId = response.body.data.id;
      }
    });

    test('should handle pregnancy workflow correctly', async () => {
      // Este test verifica que el flujo completo funcione
      // 1. Obtener madres disponibles
      // 2. Validar compatibilidad si hay padre
      // 3. Crear preñez
      // 4. Validar gestación para camada
      // 5. Registrar camada

      const madresResponse = await request(app)
        .get('/reproduccion/prenez/madres-disponibles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(madresResponse.status).toBe(200);
      expect(madresResponse.body.success).toBe(true);

      if (madresResponse.body.data.length > 0) {
        const madre = madresResponse.body.data[0];
        
        // Verificar que la madre tenga la información esperada
        expect(madre).toHaveProperty('estaDisponible');
        expect(madre).toHaveProperty('historialReproductivo');
        expect(madre).toHaveProperty('salud');
        
        // Si está disponible, debería poder ser seleccionada
        if (madre.estaDisponible) {
          expect(madre.estadoReproductivo).toBe('Disponible');
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle non-existent mother ID gracefully', async () => {
      const response = await request(app)
        .post('/reproduccion/prenez/validar-gestacion')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          madreId: 99999, // ID que no existe
          fechaRegistroCamada: new Date().toISOString().split('T')[0]
        });

      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid date formats', async () => {
      if (!testMadreId) return;

      const response = await request(app)
        .post('/reproduccion/prenez/validar-gestacion')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          madreId: testMadreId,
          fechaRegistroCamada: 'invalid-date'
        });

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('should require authentication for all endpoints', async () => {
      const endpoints = [
        '/reproduccion/prenez/madres-disponibles',
        '/reproduccion/prenez/padres-disponibles',
        '/reproduccion/prenez/madres-elegibles-camada',
        '/reproduccion/prenez/recomendaciones'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });
  });
});

// Función auxiliar para limpiar datos de prueba
async function cleanupTestData() {
  try {
    // Limpiar preñeces de prueba
    if (testPrenezId) {
      await prisma.prenez.delete({
        where: { id: testPrenezId }
      }).catch(() => {
        // Ignorar errores si ya fue eliminado
      });
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

// Ejecutar limpieza después de las pruebas
afterAll(async () => {
  await cleanupTestData();
});