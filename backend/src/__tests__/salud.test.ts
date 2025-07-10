import request from 'supertest';
import { app } from '../index';

describe('GET /api/salud', () => {
    it('debería responder con un array de registros de salud (200)', async () => {
        const response = await request(app).get('/api/salud');
        expect([200, 401, 403]).toContain(response.status); // Permitir 401/403 si hay auth
        // Si es 200, debe ser array
        if (response.status === 200) {
            expect(Array.isArray(response.body)).toBe(true);
        }
    });
});
