import { PrismaClient } from '@prisma/client';
import * as prenezService from '../services/reproduccion/prenez.service';
import * as camadasService from '../services/reproduccion/camadas.service';
import { reproductionCache } from '../services/cache.service';

// Mock Prisma for testing
jest.mock('@prisma/client');
const mockPrisma = {
  prenez: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  camada: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cuy: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Replace the actual prisma instance with our mock
jest.doMock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Reproduction Module Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reproductionCache.invalidateAll();
  });

  describe('Optimized Prenez Queries', () => {
    it('should use single optimized query with includes', async () => {
      const mockPreneces = [
        {
          id: 1,
          fechaPrenez: new Date('2024-01-01'),
          fechaProbableParto: new Date('2024-03-12'),
          estado: 'activa',
          notas: 'Test pregnancy',
          fechaCompletada: null,
          madre: {
            id: 1,
            raza: 'Peruana',
            galpon: 'A',
            jaula: '1',
            etapaVida: 'Reproductora',
            peso: 1.2,
          },
          padre: {
            id: 2,
            raza: 'Andina',
            galpon: 'B',
            jaula: '2',
            peso: 1.5,
          },
          camada: null,
        },
      ];

      mockPrisma.prenez.findMany.mockResolvedValue(mockPreneces);
      mockPrisma.prenez.count.mockResolvedValue(1);

      const filters = { estado: 'activa' };
      const pagination = { page: 1, limit: 20 };

      const result = await prenezService.getAllPaginatedOptimized(filters, pagination);

      // Verify single query with proper includes
      expect(mockPrisma.prenez.findMany).toHaveBeenCalledWith({
        where: { estado: 'activa' },
        include: {
          madre: {
            select: {
              id: true,
              raza: true,
              galpon: true,
              jaula: true,
              etapaVida: true,
              peso: true,
            },
          },
          padre: {
            select: {
              id: true,
              raza: true,
              galpon: true,
              jaula: true,
              peso: true,
            },
          },
          camada: {
            select: {
              id: true,
              fechaNacimiento: true,
              numVivos: true,
              numMuertos: true,
            },
          },
        },
        orderBy: { fechaPrenez: 'desc' },
        skip: 0,
        take: 20,
      });

      // Verify calculated fields are added
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('diasGestacion');
      expect(result.data[0]).toHaveProperty('diasRestantes');
      expect(result.data[0]).toHaveProperty('estadoCalculado');
    });

    it('should handle complex filters correctly', async () => {
      mockPrisma.prenez.findMany.mockResolvedValue([]);
      mockPrisma.prenez.count.mockResolvedValue(0);

      const filters = {
        estado: 'activa',
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-12-31',
        search: 'Peruana',
        galpon: 'A',
      };

      await prenezService.getAllPaginatedOptimized(filters, { page: 1, limit: 20 });

      expect(mockPrisma.prenez.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            estado: 'activa',
            fechaPrenez: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
            OR: [
              { notas: { contains: 'Peruana', mode: 'insensitive' } },
              { madre: { raza: { contains: 'Peruana', mode: 'insensitive' } } },
              { padre: { raza: { contains: 'Peruana', mode: 'insensitive' } } },
            ],
          },
        })
      );
    });
  });

  describe('Optimized Camadas Queries', () => {
    it('should use single optimized query for litters', async () => {
      const mockCamadas = [
        {
          id: 1,
          fechaNacimiento: new Date('2024-03-15'),
          numVivos: 4,
          numMuertos: 1,
          madre: {
            id: 1,
            raza: 'Peruana',
            galpon: 'A',
            jaula: '1',
            etapaVida: 'Reproductora',
          },
          padre: {
            id: 2,
            raza: 'Andina',
            galpon: 'B',
            jaula: '2',
          },
          prenez: {
            id: 1,
            fechaPrenez: new Date('2024-01-01'),
            estado: 'completada',
          },
          cuyes: [
            { id: 1, raza: 'Peruana', sexo: 'M', peso: 0.1, estado: 'Activo', etapaVida: 'Cría' },
            { id: 2, raza: 'Peruana', sexo: 'H', peso: 0.1, estado: 'Activo', etapaVida: 'Cría' },
          ],
        },
      ];

      mockPrisma.camada.findMany.mockResolvedValue(mockCamadas);
      mockPrisma.camada.count.mockResolvedValue(1);

      const result = await camadasService.getAllCamadasPaginatedOptimized(
        {},
        { page: 1, limit: 20 }
      );

      // Verify single query with proper includes
      expect(mockPrisma.camada.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          madre: {
            select: {
              id: true,
              raza: true,
              galpon: true,
              jaula: true,
              etapaVida: true,
            },
          },
          padre: {
            select: {
              id: true,
              raza: true,
              galpon: true,
              jaula: true,
            },
          },
          prenez: {
            select: {
              id: true,
              fechaPrenez: true,
              estado: true,
            },
          },
          cuyes: {
            select: {
              id: true,
              raza: true,
              sexo: true,
              peso: true,
              estado: true,
              etapaVida: true,
            },
          },
        },
        orderBy: { fechaNacimiento: 'desc' },
        skip: 0,
        take: 20,
      });

      // Verify calculated fields
      expect(result.data[0]).toHaveProperty('edadDias');
      expect(result.data[0]).toHaveProperty('tasaSupervivencia');
      expect(result.data[0]).toHaveProperty('totalCrias');
      expect(result.data[0].totalCrias).toBe(5); // 4 vivos + 1 muerto
    });
  });

  describe('Optimized Statistics with Caching', () => {
    it('should use aggregated queries for statistics', async () => {
      // Mock aggregated query responses
      mockPrisma.prenez.groupBy.mockResolvedValue([
        { estado: 'activa', _count: { id: 5 } },
        { estado: 'completada', _count: { id: 10 } },
        { estado: 'fallida', _count: { id: 2 } },
      ]);

      mockPrisma.camada.aggregate
        .mockResolvedValueOnce({
          _count: { id: 8 },
          _avg: { numVivos: 3.5, numMuertos: 0.5 },
        })
        .mockResolvedValueOnce({
          _count: { id: 10 },
          _avg: { numVivos: 3.2, numMuertos: 0.8 },
        });

      mockPrisma.prenez.count
        .mockResolvedValueOnce(3) // próximos partos
        .mockResolvedValueOnce(1) // preñeces vencidas
        .mockResolvedValueOnce(12) // último mes
        .mockResolvedValueOnce(15); // último trimestre

      const result = await prenezService.getEstadisticasReproduccionOptimized();

      // Verify aggregated queries were used
      expect(mockPrisma.prenez.groupBy).toHaveBeenCalledWith({
        by: ['estado'],
        _count: { id: true },
      });

      expect(mockPrisma.camada.aggregate).toHaveBeenCalledTimes(2);

      // Verify calculated statistics
      expect(result.resumen.totalPreneces).toBe(17); // 5 + 10 + 2
      expect(result.resumen.prenecesActivas).toBe(5);
      expect(result.resumen.prenecesCompletadas).toBe(10);
      expect(result.promedios.tasaExito).toBe(58.8); // (10/17) * 100, rounded
    });

    it('should cache statistics results', async () => {
      // Mock first call
      mockPrisma.prenez.groupBy.mockResolvedValue([]);
      mockPrisma.camada.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _avg: { numVivos: 0, numMuertos: 0 },
      });
      mockPrisma.prenez.count.mockResolvedValue(0);

      // First call should hit database
      const result1 = await prenezService.getEstadisticasReproduccionOptimized();

      // Second call should use cache
      const result2 = await prenezService.getEstadisticasReproduccionOptimized();

      // Database should only be called once
      expect(mockPrisma.prenez.groupBy).toHaveBeenCalledTimes(1);

      // Results should be identical
      expect(result1).toEqual(result2);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete pagination queries within performance threshold', async () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        fechaPrenez: new Date(),
        fechaProbableParto: new Date(),
        estado: 'activa',
        madre: { id: i + 1, raza: 'Test', galpon: 'A', jaula: '1', etapaVida: 'Reproductora', peso: 1.0 },
        padre: null,
        camada: null,
      }));

      mockPrisma.prenez.findMany.mockResolvedValue(mockData);
      mockPrisma.prenez.count.mockResolvedValue(100);

      const startTime = Date.now();
      await prenezService.getAllPaginatedOptimized({}, { page: 1, limit: 20 });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        fechaNacimiento: new Date(),
        numVivos: 3,
        numMuertos: 1,
        madre: { id: i + 1, raza: 'Test', galpon: 'A', jaula: '1', etapaVida: 'Reproductora' },
        padre: null,
        prenez: null,
        cuyes: [],
      }));

      mockPrisma.camada.findMany.mockResolvedValue(largeDataset.slice(0, 50));
      mockPrisma.camada.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const result = await camadasService.getAllCamadasPaginatedOptimized({}, { page: 1, limit: 50 });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(result.data).toHaveLength(50);
      expect(result.pagination.total).toBe(1000);
    });
  });
});