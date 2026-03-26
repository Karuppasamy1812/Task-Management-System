import { describe, it, expect, vi } from 'vitest';
import { listProjectsQueryOptions, getProjectQueryOptions } from '../queries/projects.query';
import { listTasksQueryOptions } from '../queries/tasks.query';
import { listUsersQueryOptions } from '../queries/users.query';
import { meQueryOptions } from '../queries/auth.query';

// Mock API modules
vi.mock('../api/projects.api', () => ({
  ProjectsApi: {
    list: Object.assign(vi.fn(), { key: 'ProjectsApi.list' }),
    get:  Object.assign(vi.fn(), { key: 'ProjectsApi.get' }),
    create: Object.assign(vi.fn(), { key: 'ProjectsApi.create' }),
    update: Object.assign(vi.fn(), { key: 'ProjectsApi.update' }),
    delete: Object.assign(vi.fn(), { key: 'ProjectsApi.delete' }),
    addMember: Object.assign(vi.fn(), { key: 'ProjectsApi.addMember' }),
    addList: Object.assign(vi.fn(), { key: 'ProjectsApi.addList' }),
  },
}));

vi.mock('../api/tasks.api', () => ({
  TasksApi: {
    listByProject: Object.assign(vi.fn(), { key: 'TasksApi.listByProject' }),
    create: Object.assign(vi.fn(), { key: 'TasksApi.create' }),
    update: Object.assign(vi.fn(), { key: 'TasksApi.update' }),
    delete: Object.assign(vi.fn(), { key: 'TasksApi.delete' }),
    addComment: Object.assign(vi.fn(), { key: 'TasksApi.addComment' }),
  },
}));

vi.mock('../api/users.api', () => ({
  UsersApi: {
    list: Object.assign(vi.fn(), { key: 'UsersApi.list' }),
  },
}));

vi.mock('../api/auth.api', () => ({
  AuthApi: {
    me:       Object.assign(vi.fn(), { key: 'AuthApi.me' }),
    login:    Object.assign(vi.fn(), { key: 'AuthApi.login' }),
    register: Object.assign(vi.fn(), { key: 'AuthApi.register' }),
    logout:   Object.assign(vi.fn(), { key: 'AuthApi.logout' }),
  },
}));

vi.mock('../lib/socket', () => ({
  getSocket: () => ({ emit: vi.fn(), on: vi.fn(), off: vi.fn(), connected: false, connect: vi.fn() }),
  disconnectSocket: vi.fn(),
}));

describe('Query Options — Projects', () => {
  it('listProjectsQueryOptions has correct queryKey', () => {
    const opts = listProjectsQueryOptions();
    expect(opts.queryKey[0]).toBe('ProjectsApi.list');
  });

  it('getProjectQueryOptions has correct queryKey with id', () => {
    const opts = getProjectQueryOptions('proj123');
    expect(opts.queryKey[0]).toBe('ProjectsApi.get');
    expect(opts.queryKey[1]).toBe('proj123');
  });

  it('getProjectQueryOptions is disabled when id is empty', () => {
    const opts = getProjectQueryOptions('');
    expect(opts.enabled).toBe(false);
  });

  it('getProjectQueryOptions is enabled when id is provided', () => {
    const opts = getProjectQueryOptions('proj123');
    expect(opts.enabled).toBe(true);
  });
});

describe('Query Options — Tasks', () => {
  it('listTasksQueryOptions has correct queryKey', () => {
    const opts = listTasksQueryOptions('proj1');
    expect(opts.queryKey[0]).toBe('TasksApi.listByProject');
    expect(opts.queryKey[1]).toBe('proj1');
  });

  it('listTasksQueryOptions is disabled when projectId is empty', () => {
    const opts = listTasksQueryOptions('');
    expect(opts.enabled).toBe(false);
  });

  it('listTasksQueryOptions is enabled when projectId is provided', () => {
    const opts = listTasksQueryOptions('proj1');
    expect(opts.enabled).toBe(true);
  });
});

describe('Query Options — Users', () => {
  it('listUsersQueryOptions has correct queryKey', () => {
    const opts = listUsersQueryOptions();
    expect(opts.queryKey[0]).toBe('UsersApi.list');
  });
});

describe('Query Options — Auth', () => {
  it('meQueryOptions has correct queryKey', () => {
    const opts = meQueryOptions();
    expect(opts.queryKey[0]).toBe('AuthApi.me');
  });

  it('meQueryOptions has staleTime Infinity', () => {
    const opts = meQueryOptions();
    expect(opts.staleTime).toBe(Infinity);
  });

  it('meQueryOptions has retry false', () => {
    const opts = meQueryOptions();
    expect(opts.retry).toBe(false);
  });
});
