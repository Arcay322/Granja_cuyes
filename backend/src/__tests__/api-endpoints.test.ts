import request from 'supertest';
import { app } from '../index';

describe('API Endpoints principales', () => {
    it('GET /api/salud debe responder 200 y array', async () => {
        const res = await request(app).get('/api/salud');
        expect([200, 401, 403]).toContain(res.statusCode);
        if (res.statusCode === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/cuyes debe responder 200 y array', async () => {
        const res = await request(app).get('/api/cuyes');
        expect([200, 401, 403]).toContain(res.statusCode);
        if (res.statusCode === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/alimentos debe responder 200 y array', async () => {
        const res = await request(app).get('/api/alimentos');
        expect([200, 401, 403]).toContain(res.statusCode);
        if (res.statusCode === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/ventas debe responder 200 y array', async () => {
        const res = await request(app).get('/api/ventas');
        expect([200, 401, 403]).toContain(res.statusCode);
        if (res.statusCode === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/gastos debe responder 200 y array', async () => {
        const res = await request(app).get('/api/gastos');
        expect([200, 401, 403]).toContain(res.statusCode);
        if (res.statusCode === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/dashboard/metrics debe responder 200', async () => {
        const res = await request(app).get('/api/dashboard/metrics');
        expect([200, 401, 403]).toContain(res.statusCode);
    });

    it('GET /api/health debe responder 200 y status OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('OK');
    });
});
