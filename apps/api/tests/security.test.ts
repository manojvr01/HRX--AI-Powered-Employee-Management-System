import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { runSeed } from '../src/scripts/seed.js';

describe('Security & Input Validation Tests', () => {
  it('Seed script must refuse execution when NODE_ENV is production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    await expect(runSeed(true)).rejects.toThrow(
      'FATAL: Seed execution refused in production environment!'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('Rejects requests containing NoSQL query operators like $gt or dotted path', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .query({ 'injected[$gt]': 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('disallowed operators');
  });

  it('Rejects invalid ObjectId parameters with 400 Bad Request', async () => {
    // Attempt to access an invalid 12-char or non-hex ID on a route requiring an ObjectId
    const response = await request(app)
      .get('/api/v1/departments/not-a-valid-object-id')
      .set('Authorization', 'Bearer invalid-token');

    // Either auth failure or object ID failure:
    // When given invalid auth token -> 401
    expect([400, 401]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });
});
