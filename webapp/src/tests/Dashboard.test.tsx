import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Project } from '../lib/types';

const mockNavigate = vi.fn();
const mockDeleteProject = { mutate: vi.fn(), isPending: false };

const mockState = {
  data: undefined as Project[] | undefined,
  isLoading: false,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'u1', name: 'Jane Doe', email: 'jane@test.com', role: 'admin' },
    token: 'token',
    isLoading: false,
    logout: vi.fn(),
    setToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock('../hooks/useProjects', () => ({
  useProjects: () => ({ data: mockState.data, isLoading: mockState.isLoading }),
  useDeleteProject: () => mockDeleteProject,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockProjects: Project[] = [
  {
    _id: 'p1', name: 'Website Redesign', description: 'Redesign the website',
    owner: { _id: 'u1', name: 'Jane Doe', email: 'jane@test.com', role: 'admin' },
    members: [
      { _id: 'm1', user: { _id: 'u2', name: 'Bob', email: 'b@b.com', role: 'contributor' }, role: 'contributor' },
    ],
    lists: [
      { _id: 'l1', title: 'To Do', order: 0 },
      { _id: 'l2', title: 'In Progress', order: 1 },
    ],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p2', name: 'Mobile App', description: '',
    owner: { _id: 'u1', name: 'Jane Doe', email: 'jane@test.com', role: 'admin' },
    members: [],
    lists: [{ _id: 'l3', title: 'Backlog', order: 0 }],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Lazy import so the mock is applied
const loadDashboard = async () => (await import('../pages/Dashboard')).default;

describe('Dashboard — with projects', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockDeleteProject.mutate.mockReset();
    mockState.data = mockProjects;
    mockState.isLoading = false;
  });

  it('renders greeting with user first name', async () => {
    const Dashboard = await loadDashboard();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/good morning, jane/i)).toBeInTheDocument();
  });

  it('renders project names', async () => {
    const Dashboard = await loadDashboard();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
  });

  it('renders project description', async () => {
    const Dashboard = await loadDashboard();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Redesign the website')).toBeInTheDocument();
  });

  it('shows fallback description when empty', async () => {
    const Dashboard = await loadDashboard();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });
});

describe('Dashboard — loading state', () => {
  beforeEach(() => {
    mockState.data = undefined;
    mockState.isLoading = true;
  });

  it('shows loading spinner', async () => {
    const Dashboard = await loadDashboard();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('Dashboard — empty state', () => {
  beforeEach(() => {
    mockState.data = [];
    mockState.isLoading = false;
  });

  it('shows empty state when no projects', async () => {
    const Dashboard = await loadDashboard();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });
});
