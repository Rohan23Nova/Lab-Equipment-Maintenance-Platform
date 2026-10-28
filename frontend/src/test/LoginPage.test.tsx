import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import * as AuthContextModule from '@/context/AuthContext';
import { ApiClientError } from '@/lib/apiClient';

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLogin.mockReset();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders login form with inputs and submit button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Institutional Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to LabLedger/i })).toBeInTheDocument();
  });

  it('shows validation warning when submitting with empty email', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Sign In to LabLedger/i }));

    expect(await screen.findByText(/Institutional email address is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits credentials when valid email and password are provided', async () => {
    mockLogin.mockResolvedValueOnce({
      id: '123',
      email: 'student@university.edu',
      firstName: 'Elena',
      lastName: 'Rostova',
      status: 'ACTIVE',
      roles: ['ROLE_STUDENT'],
      createdAt: '2026-10-28T12:00:00Z',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'student@university.edu' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to LabLedger/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'student@university.edu',
        password: 'ValidPass123!',
      });
    });
  });

  it('displays error alert on 401 Bad Credentials', async () => {
    const error = new ApiClientError({
      title: 'Authentication Failed',
      status: 401,
      detail: 'Invalid email or password. Please verify your credentials and try again.',
    });
    mockLogin.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'wrong@university.edu' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'WrongPass!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to LabLedger/i }));

    expect(await screen.findByTestId('login-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
  });

  it('displays lockout warning on 423 Account Locked', async () => {
    const error = new ApiClientError({
      title: 'Account Locked',
      status: 423,
      detail: 'Your account is temporarily locked due to consecutive failed attempts. Please retry after 15 minutes.',
    });
    mockLogin.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'locked@university.edu' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'Pass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to LabLedger/i }));

    expect(await screen.findByText(/Account Temporarily Locked/i)).toBeInTheDocument();
    expect(screen.getByText(/retry after 15 minutes/i)).toBeInTheDocument();
  });
});
