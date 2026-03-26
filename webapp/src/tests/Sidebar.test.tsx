import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import type { Project } from '../lib/types';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockCreateProject = { mutate: vi.fn(), isPending: false };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/' }) };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'u1', name: 'John Doe', email: 'john@test.com', role: 'admin' },
    logout: mockLogout,
    token: 'token',
    isLoading: false,
    setToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

const mockProjects: Project[] = [
  {
    _id: 'p1', name: 'Alpha Project', description: 'Desc',
    owner: { _id: 'u1', name: 'John', email: 'j@j.com', role: 'admin' },
    members: [], lists: [], isArchived: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p2', name: 'Beta Project', description: '',
    owner: { _id: 'u1', name: 'John', email: 'j@j.com', role: 'admin' },
    members: [], lists: [], isArchived: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

vi.mock('../hooks/useProjects', () => ({
  useProjects: () => ({ data: mockProjects }),
  useCreateProject: () => mockCreateProject,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderSidebar = () => render(<MemoryRouter><Sidebar /></MemoryRouter>);

describe('Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
    mockCreateProject.mutate.mockReset();
  });

  it('renders TaskBoard logo', () => {
    renderSidebar();
    expect(screen.getByText('TaskBoard')).toBeInTheDocument();
  });

  it('renders Dashboard nav item', () => {
    renderSidebar();
    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
  });

  it('renders all project names', () => {
    renderSidebar();
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
  });

  it('renders user name in footer', () => {
    renderSidebar();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders user role in footer', () => {
    renderSidebar();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('navigates to / when Dashboard clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByTitle('Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to project when project clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Alpha Project'));
    expect(mockNavigate).toHaveBeenCalledWith('/project/p1');
  });

  it('collapses sidebar when toggle button clicked', () => {
    renderSidebar();
    const toggleBtn = screen.getByTitle('Dashboard').closest('nav')
      ?.previousElementSibling?.querySelector('button');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(screen.queryByText('TaskBoard')).not.toBeInTheDocument();
    }
  });

  it('opens New Project dialog when + button clicked', () => {
    renderSidebar();
    const projectsHeader = screen.getByText('Projects');
    const plusBtn = projectsHeader.nextElementSibling as HTMLElement;
    fireEvent.click(plusBtn);
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('calls createProject.mutate on form submit', () => {
    renderSidebar();
    const projectsHeader = screen.getByText('Projects');
    const plusBtn = projectsHeader.nextElementSibling as HTMLElement;
    fireEvent.click(plusBtn);

    fireEvent.change(screen.getByPlaceholderText('e.g. Website Redesign'), {
      target: { value: 'My New Project' },
    });
    fireEvent.submit(screen.getByPlaceholderText('e.g. Website Redesign').closest('form')!);

    expect(mockCreateProject.mutate).toHaveBeenCalledWith(
      { name: 'My New Project', description: '' },
      expect.any(Object),
    );
  });
});
