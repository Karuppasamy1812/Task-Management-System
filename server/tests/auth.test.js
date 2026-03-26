import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

const TEST_USER = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123',
  role: 'admin',
};

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 10000,
  });
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({ email: TEST_USER.email });
  await mongoose.disconnect();
});

describe('Auth — Register', () => {
  it('should register a new user and return token + user', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should reject duplicate email registration', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already in use/i);
  });

  it('should reject registration with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Auth — Login', () => {
  it('should login with valid credentials and return token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_USER.email);
    token = res.body.token;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('Auth — Get Me', () => {
  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_USER.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('Auth — Logout', () => {
  it('should logout successfully with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('should reject logout without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
