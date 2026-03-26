import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

let adminToken, contributorToken, viewerToken;
let adminId, contributorId, viewerId;
let projectId, listId;

const ADMIN   = { name: 'Admin User',       email: 'admin@proj.test',   password: 'pass1234', role: 'admin' };
const CONTRIB = { name: 'Contributor User', email: 'contrib@proj.test', password: 'pass1234', role: 'contributor' };
const VIEWER  = { name: 'Viewer User',      email: 'viewer@proj.test',  password: 'pass1234', role: 'viewer' };

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 10000,
  });

  const a = await request(app).post('/api/auth/register').send(ADMIN);
  adminToken = a.body.token;
  adminId = a.body.user._id;

  const c = await request(app).post('/api/auth/register').send(CONTRIB);
  contributorToken = c.body.token;
  contributorId = c.body.user._id;

  const v = await request(app).post('/api/auth/register').send(VIEWER);
  viewerToken = v.body.token;
  viewerId = v.body.user._id;
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({
    email: { $in: [ADMIN.email, CONTRIB.email, VIEWER.email] },
  });
  await mongoose.connection.collection('projects').deleteMany({ name: /test project/i });
  await mongoose.disconnect();
});

describe('Projects — Create', () => {
  it('should create a project and auto-generate 3 default lists', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Project Alpha', description: 'A test project' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Project Alpha');
    expect(res.body.lists).toHaveLength(3);
    expect(res.body.owner._id).toBe(adminId);
    projectId = res.body._id;
    listId = res.body.lists[0]._id;
  });

  it('should reject project creation without auth', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Unauthorized Project' });
    expect(res.status).toBe(401);
  });
});

describe('Projects — List', () => {
  it('should return only projects the user owns or is a member of', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p) => p._id === projectId)).toBe(true);
  });

  it('should not return projects for unrelated users', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${contributorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p._id === projectId)).toBe(false);
  });
});

describe('Projects — Get by ID', () => {
  it('should return project details for owner', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(projectId);
    expect(res.body.lists).toHaveLength(3);
  });

  it('should return 404 for non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Projects — Add Member (RBAC)', () => {
  it('admin should add a contributor member', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: contributorId, role: 'contributor' });
    expect(res.status).toBe(200);
    expect(res.body.members.some((m) => m.user._id === contributorId)).toBe(true);
  });

  it('admin should add a viewer member', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: viewerId, role: 'viewer' });
    expect(res.status).toBe(200);
  });

  it('should reject adding duplicate member', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: contributorId, role: 'contributor' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already a member/i);
  });

  it('contributor should NOT be able to add members', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ userId: viewerId, role: 'viewer' });
    expect(res.status).toBe(403);
  });

  it('viewer should NOT be able to add members', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ userId: adminId, role: 'admin' });
    expect(res.status).toBe(403);
  });
});

describe('Projects — Add List (RBAC)', () => {
  it('admin should add a new list', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/lists`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Backlog' });
    expect(res.status).toBe(200);
    expect(res.body.lists.some((l) => l.title === 'Backlog')).toBe(true);
  });

  it('contributor should add a new list', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/lists`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ title: 'Sprint 1' });
    expect(res.status).toBe(200);
  });

  it('viewer should NOT add a list', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/lists`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Blocked' });
    expect(res.status).toBe(403);
  });
});

describe('Projects — Update (RBAC)', () => {
  it('admin should update project name', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Project Alpha Updated', description: 'Updated desc' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Project Alpha Updated');
  });

  it('contributor should NOT update project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ name: 'Hacked Name' });
    expect(res.status).toBe(403);
  });
});

describe('Projects — Delete/Archive (RBAC)', () => {
  it('contributor should NOT archive project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${contributorToken}`);
    expect(res.status).toBe(403);
  });

  it('admin should archive project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/archived/i);
  });
});
