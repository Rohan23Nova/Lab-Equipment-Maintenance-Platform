import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { UserProfile } from '@/types/auth';

const mockUser: UserProfile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'student@university.edu',
  firstName: 'Elena',
  lastName: 'Rostova',
  department: 'Physics',
  status: 'ACTIVE',
  roles: ['ROLE_STUDENT'],
  createdAt: '2026-10-28T12:00:00Z',
};

const ConsumerComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <div data-testid="loading">Loading session...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      <div data-testid="user-email">{user?.email || 'None'}</div>
      <button
        data-testid="login-btn"
        onClick={() => login({ email: 'student@university.edu', password: 'ValidPass123!' })}
      >
        Sign In
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Sign Out
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restores active user session when /auth/me returns valid profile', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/auth/csrf') return { success: true, message: 'CSRF initialized', data: {}, timestamp: '' };
      if (url === '/auth/me') return { success: true, message: 'OK', data: mockUser, timestamp: '' };
      throw new Error('Not found');
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('student@university.edu');
    });
  });

  it('sets user to guest when /auth/me fails with 401', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
      expect(screen.getByTestId('user-email')).toHaveTextContent('None');
    });
  });

  it('authenticates user and updates state upon successful login', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Unauthorized'));
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockUser,
      timestamp: '',
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('student@university.edu');
    });
  });

  it('clears user session upon logout', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/auth/csrf') return { success: true, message: 'OK', data: {}, timestamp: '' };
      if (url === '/auth/me') return { success: true, message: 'OK', data: mockUser, timestamp: '' };
      throw new Error('Not found');
    });
    vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true, message: 'Logged out', data: null, timestamp: '' });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
      expect(screen.getByTestId('user-email')).toHaveTextContent('None');
    });
  });
});
