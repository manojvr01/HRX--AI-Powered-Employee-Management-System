import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { runSeed } from '../src/scripts/seed.js';

describe('Authentication Lifecycle & Security Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    await runSeed(true);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('Logs in successfully with valid demo credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hrx.local', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@hrx.local');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    // Check Set-Cookie header contains refreshToken
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refreshToken=');
  });

  it('Rejects invalid password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hrx.local', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Returns current user profile on GET /auth/me with valid Bearer token', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrx.local', password: 'Password123!' });

    const token = loginRes.body.data.tokens.accessToken;

    // 2. Fetch /me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('hr@hrx.local');
    expect(meRes.body.data.role).toBe('HR');
    expect(meRes.body.data.permissions).toContain('employees:create');
  });

  it('Rejects unauthenticated access to /me with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Rotates refresh token and detects reuse attempt', async () => {
    // 1. Initial login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@hrx.local', password: 'Password123!' });

    const initialRefreshToken = loginRes.body.data.tokens.refreshToken;
    expect(initialRefreshToken).toBeDefined();

    // 2. First refresh -> Valid rotation
    const refreshRes1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes1.status).toBe(200);
    expect(refreshRes1.body.data.accessToken).toBeDefined();
    const rotatedRefreshToken = refreshRes1.body.data.refreshToken;
    expect(rotatedRefreshToken).toBeDefined();
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

    // 3. REUSE ATTEMPT: Attempt to reuse the already-rotated initialRefreshToken!
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.message).toContain('breach detected');

    // 4. VERIFY FAMILY REVOCATION: Even the rotated token should now be revoked!
    const revokedRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotatedRefreshToken });

    expect(revokedRes.status).toBe(401);
  });

  it('Locks account after 5 consecutive failed login attempts', async () => {
    // Attempt 5 bad logins for a specific test user
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'manager@hrx.local', password: 'BadPassword!' });
    }

    // 6th attempt should be locked out
    const lockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@hrx.local', password: 'Password123!' });

    expect([423, 401]).toContain(lockedRes.status);
    expect(lockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
  });
});
