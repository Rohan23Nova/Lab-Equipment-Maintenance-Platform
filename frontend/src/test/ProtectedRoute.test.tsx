import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as AuthContextModule from '@/context/AuthContext';
import { UserProfile } from '@/types/auth';

const mockStudent: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student@university.edu',
  firstName: 'Elena',
  lastName: 'Rostova',
  status: 'ACTIVE',
  roles: ['ROLE_STUDENT'],
  createdAt: '2026-10-28T12:00:00Z',
};

const mockAdmin: UserProfile = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@university.edu',
  firstName: 'System',
  lastName: 'Administrator',
  status: 'ACTIVE',
  roles: ['ROLE_ADMIN'],
  createdAt: '2026-10-28T12:00:00Z',
};

describe('ProtectedRoute', () => {
  it('redirects unauthenticated visitor to /login preserving target destination', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app/profile']}>
        <Routes>
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Secret Laboratory Area</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div data-testid="login-screen">Sign In Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });

  it('renders protected child component when user is authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStudent,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app/profile']}>
        <Routes>
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Secret Laboratory Area</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('allows access when user possesses required role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockAdmin,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app/admin']}>
        <Routes>
          <Route
            path="/app/admin"
            element={
              <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                <div data-testid="admin-panel">Admin Control Center</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
  });

  it('redirects to /forbidden when user lacks required role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStudent,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app/admin']}>
        <Routes>
          <Route
            path="/app/admin"
            element={
              <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                <div data-testid="admin-panel">Admin Control Center</div>
              </ProtectedRoute>
            }
          />
          <Route path="/forbidden" element={<div data-testid="forbidden-screen">403 Forbidden</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('forbidden-screen')).toBeInTheDocument();
  });
});
