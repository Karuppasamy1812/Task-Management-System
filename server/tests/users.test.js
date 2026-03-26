import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

let token, userId;

const USER = { name: 'Users Test', email: 'userstest@users.test', password: 'pass1234', role: 'admin' };

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 10000,
  });
  const res = await request(app).post('/api/auth/register').send(USER);
  token = res.body.token;
  userId = res.body.user._id;
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({ email: USER.email });
  await mongoose.disconnect();
});

describe('Users — List', () => {
  it('should return list of all users when authenticated', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('Users — Get by ID', () => {
  it('should return user by ID', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId);
    expect(res.body.email).toBe(USER.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
