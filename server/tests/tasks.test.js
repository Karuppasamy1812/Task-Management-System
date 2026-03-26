import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

let adminToken, contributorToken, viewerToken;
let adminId, contributorId, viewerId;
let projectId, listId, taskId;

const ADMIN   = { name: 'Task Admin',       email: 'taskadmin@task.test',   password: 'pass1234', role: 'admin' };
const CONTRIB = { name: 'Task Contributor', email: 'taskcontrib@task.test', password: 'pass1234', role: 'contributor' };
const VIEWER  = { name: 'Task Viewer',      email: 'taskviewer@task.test',  password: 'pass1234', role: 'viewer' };

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

  const proj = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Task Test Project', description: 'For task tests' });
  projectId = proj.body._id;
  listId = proj.body.lists[0]._id;

  await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: contributorId, role: 'contributor' });

  await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: viewerId, role: 'viewer' });
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({
    email: { $in: [ADMIN.email, CONTRIB.email, VIEWER.email] },
  });
  await mongoose.connection.collection('projects').deleteMany({ name: 'Task Test Project' });
  await mongoose.connection.collection('tasks').deleteMany({ project: new mongoose.Types.ObjectId(projectId) });
  await mongoose.disconnect();
});

describe('Tasks — Create (RBAC)', () => {
  it('admin should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Fix login bug',
        description: 'Users cannot login on mobile',
        project: projectId,
        listId,
        priority: 'high',
        assignees: [adminId],
        labels: ['bug'],
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Fix login bug');
    expect(res.body.priority).toBe('high');
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0].action).toBe('created task');
    taskId = res.body._id;
  });

  it('contributor should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ title: 'Add dark mode', project: projectId, listId, priority: 'medium' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Add dark mode');
  });

  it('viewer should NOT create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Viewer task', project: projectId, listId });
    expect(res.status).toBe(403);
  });

  it('should reject task creation without auth', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'No auth task', project: projectId, listId });
    expect(res.status).toBe(401);
  });
});

describe('Tasks — List by Project', () => {
  it('should return all tasks for a project', async () => {
    const res = await request(app)
      .get(`/api/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('viewer should be able to list tasks', async () => {
    const res = await request(app)
      .get(`/api/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
  });

  it('should return empty array for project with no tasks', async () => {
    const proj = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Empty Project', description: '' });
    const emptyProjectId = proj.body._id;

    const res = await request(app)
      .get(`/api/tasks/project/${emptyProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);

    await mongoose.connection.collection('projects').deleteOne({ _id: new mongoose.Types.ObjectId(emptyProjectId) });
  });
});

describe('Tasks — Update', () => {
  it('should update task title and description', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Fix login bug (updated)', description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Fix login bug (updated)');
    expect(res.body.description).toBe('Updated description');
  });

  it('should track status change in history', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in-progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in-progress');
    const historyEntry = res.body.history.find((h) => h.action === 'changed status');
    expect(historyEntry).toBeDefined();
    expect(historyEntry.from).toBe('todo');
    expect(historyEntry.to).toBe('in-progress');
  });

  it('should track list move in history', async () => {
    const projRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const lists = projRes.body.lists;
    const secondListId = (lists[1] || lists[0])._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ listId: secondListId });
    expect(res.status).toBe(200);
    expect(res.body.listId).toBe(secondListId);
    const moveEntry = res.body.history.find((h) => h.action === 'moved task');
    expect(moveEntry).toBeDefined();
  });

  it('should track assignee update in history', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignees: [adminId, contributorId] });
    expect(res.status).toBe(200);
    const assignEntry = res.body.history.find((h) => h.action === 'updated assignees');
    expect(assignEntry).toBeDefined();
  });

  it('should NOT overwrite title with undefined when only updating status', async () => {
    const before = await request(app)
      .get(`/api/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const task = before.body.find((t) => t._id === taskId);
    const originalTitle = task.title;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'review' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(originalTitle);
  });

  it('should return 404 for non-existent task', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('Tasks — Comments', () => {
  it('should add a comment to a task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'This is a comment' });
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].text).toBe('This is a comment');
    expect(res.body.comments[0].user.name).toBe(ADMIN.name);
  });

  it('contributor should add a comment', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ text: 'Contributor comment' });
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(2);
  });

  it('viewer should add a comment', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ text: 'Viewer comment' });
    expect(res.status).toBe(200);
  });

  it('comment should be tracked in history', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'History check comment' });
    expect(res.status).toBe(200);
    const commentHistory = res.body.history.find((h) => h.action === 'added comment');
    expect(commentHistory).toBeDefined();
  });

  it('should reject empty comment', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Tasks — Delete (RBAC)', () => {
  let deleteProjectId;
  let deleteListId;

  beforeAll(async () => {
    const proj = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Delete Test Project', description: '' });
    deleteProjectId = proj.body._id;
    deleteListId = proj.body.lists[0]._id;

    await request(app)
      .post(`/api/projects/${deleteProjectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: contributorId, role: 'contributor' });
  });

  afterAll(async () => {
    await mongoose.connection.collection('projects').deleteOne({ _id: new mongoose.Types.ObjectId(deleteProjectId) });
  });

  it('contributor should delete their own task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ title: 'To be deleted', project: deleteProjectId, listId: deleteListId });
    const deleteId = created.body._id;

    const res = await request(app)
      .delete(`/api/tasks/${deleteId}`)
      .set('Authorization', `Bearer ${contributorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('admin should delete any task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ title: 'Admin will delete this', project: deleteProjectId, listId: deleteListId });
    const deleteId = created.body._id;

    const res = await request(app)
      .delete(`/api/tasks/${deleteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should return 200 even for already deleted task (idempotent)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
