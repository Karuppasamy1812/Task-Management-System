import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

// Mock config
vi.mock('../lib/config', () => ({
  BaseUrl: { API: '/api' },
}));

// Mock utils
vi.mock('../lib/utils', () => ({
  AutoQueryKey: () => (cls: any) => cls,
}));

import { AuthApi } from '../api/auth.api';
import { ProjectsApi } from '../api/projects.api';
import { TasksApi } from '../api/tasks.api';
import { UsersApi } from '../api/users.api';

const mockAxios = axios as any;

describe('AuthApi', () => {
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({ data: {} });
    mockAxios.post.mockResolvedValue({ data: {} });
  });

  it('me() calls GET /api/auth/me', async () => {
    await AuthApi.me();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/auth/me');
  });

  it('login() calls POST /api/auth/login with payload', async () => {
    await AuthApi.login({ email: 'a@a.com', password: 'pass' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@a.com', password: 'pass' });
  });

  it('register() calls POST /api/auth/register with payload', async () => {
    await AuthApi.register({ name: 'Alice', email: 'a@a.com', password: 'pass', role: 'admin' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ name: 'Alice' }));
  });

  it('logout() calls POST /api/auth/logout', async () => {
    await AuthApi.logout();
    expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/logout');
  });
});

describe('ProjectsApi', () => {
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({ data: [] });
    mockAxios.post.mockResolvedValue({ data: {} });
    mockAxios.put.mockResolvedValue({ data: {} });
    mockAxios.delete.mockResolvedValue({ data: {} });
  });

  it('list() calls GET /api/projects', async () => {
    await ProjectsApi.list();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/projects');
  });

  it('get() calls GET /api/projects/:id', async () => {
    await ProjectsApi.get('proj1');
    expect(mockAxios.get).toHaveBeenCalledWith('/api/projects/proj1');
  });

  it('create() calls POST /api/projects', async () => {
    await ProjectsApi.create({ name: 'Test', description: 'Desc' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/projects', { name: 'Test', description: 'Desc' });
  });

  it('update() calls PUT /api/projects/:id', async () => {
    await ProjectsApi.update('proj1', { name: 'Updated', description: '' });
    expect(mockAxios.put).toHaveBeenCalledWith('/api/projects/proj1', expect.any(Object));
  });

  it('delete() calls DELETE /api/projects/:id', async () => {
    await ProjectsApi.delete('proj1');
    expect(mockAxios.delete).toHaveBeenCalledWith('/api/projects/proj1');
  });

  it('addMember() calls POST /api/projects/:id/members', async () => {
    await ProjectsApi.addMember('proj1', { userId: 'u1', role: 'contributor' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/projects/proj1/members', { userId: 'u1', role: 'contributor' });
  });

  it('addList() calls POST /api/projects/:id/lists', async () => {
    await ProjectsApi.addList('proj1', { title: 'Sprint 1' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/projects/proj1/lists', { title: 'Sprint 1' });
  });
});

describe('TasksApi', () => {
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({ data: [] });
    mockAxios.post.mockResolvedValue({ data: {} });
    mockAxios.put.mockResolvedValue({ data: {} });
    mockAxios.delete.mockResolvedValue({ data: {} });
  });

  it('listByProject() calls GET /api/tasks/project/:id', async () => {
    await TasksApi.listByProject('proj1');
    expect(mockAxios.get).toHaveBeenCalledWith('/api/tasks/project/proj1');
  });

  it('create() calls POST /api/tasks', async () => {
    await TasksApi.create({ title: 'Task 1' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/tasks', { title: 'Task 1' });
  });

  it('update() calls PUT /api/tasks/:id', async () => {
    await TasksApi.update('task1', { status: 'done' });
    expect(mockAxios.put).toHaveBeenCalledWith('/api/tasks/task1', { status: 'done' });
  });

  it('delete() calls DELETE /api/tasks/:id', async () => {
    await TasksApi.delete('task1');
    expect(mockAxios.delete).toHaveBeenCalledWith('/api/tasks/task1');
  });

  it('addComment() calls POST /api/tasks/:id/comments', async () => {
    await TasksApi.addComment('task1', { text: 'Hello' });
    expect(mockAxios.post).toHaveBeenCalledWith('/api/tasks/task1/comments', { text: 'Hello' });
  });
});

describe('UsersApi', () => {
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({ data: [] });
  });

  it('list() calls GET /api/users', async () => {
    await UsersApi.list();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/users');
  });
});
