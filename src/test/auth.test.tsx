import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Login } from '../app/pages/Login';
import { AuthContext } from '../app/context/AuthContext';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderLogin = () => {
  const result = render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          loading: false,
          login: mockLogin,
          signup: vi.fn(),
          loginWithToken: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return result;
};

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign-in form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    const { container } = renderLogin();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    );
  });

  it('calls login with email and password', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );
  });

  it('has a Google OAuth link', () => {
    renderLogin();
    const googleLink = screen.getByRole('link', { name: /sign in with google/i });
    expect(googleLink).toBeInTheDocument();
    expect(googleLink.getAttribute('href')).toContain('/api/auth/google');
  });
});
