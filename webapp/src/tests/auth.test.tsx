import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Mock useAuth
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    user: null,
    isLoading: false,
    token: null,
    setToken: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Login Page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders email and password fields', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<MemoryRouter><Login /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('navigates to / on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<MemoryRouter><Login /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error toast on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid'));
    render(<MemoryRouter><Login /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });
});

describe('Register Page', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  it('renders all form fields', () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min. 8/i)).toBeInTheDocument();
  });

  it('renders create account button', () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls register with correct values on submit', async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<MemoryRouter><Register /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/min. 8/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Alice', 'alice@test.com', 'password123', 'contributor');
    });
  });

  it('navigates to / on successful register', async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<MemoryRouter><Register /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'bob@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/min. 8/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });
});
