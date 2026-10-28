import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import * as AuthContextModule from '@/context/AuthContext';

import { UserProfile } from '@/types/auth';

describe('AppLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockStaffUser: UserProfile = {
    id: 'user-admin-1',
    email: 'admin@university.edu',
    firstName: 'Marcus',
    lastName: 'Vance',
    status: 'ACTIVE',
    roles: ['ROLE_ADMIN'],
    department: 'Central Facilities',
    createdAt: '2026-10-28T12:00:00Z',
  };

  it('renders application shell with desktop sidebar navigation, user badge, and page content', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStaffUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <AppLayout
            title="Operational Overview"
            subtitle="Campus telemetry"
            breadcrumbs={[{ label: 'Operational Overview', href: '/app/dashboard' }]}
          >
            <div data-testid="test-content">Dashboard Metrics Panel</div>
          </AppLayout>
        </MemoryRouter>
      </ThemeProvider>
    );

    // Main content rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Operational Overview/i })).toBeInTheDocument();
    expect(screen.getByText('Campus telemetry')).toBeInTheDocument();

    // Sidebar navigation items
    expect(screen.getAllByRole('link', { name: /^Dashboard$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /^Equipment$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /^Laboratories$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /^Reservations$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Approvals Queue/i }).length).toBeGreaterThanOrEqual(1);

    // User info
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('toggles sidebar collapse state and persists to localStorage', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStaffUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppLayout title="Test Workspace">
            <div>Inner Content</div>
          </AppLayout>
        </MemoryRouter>
      </ThemeProvider>
    );

    const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
    expect(collapseBtn).toBeInTheDocument();

    // Click collapse
    fireEvent.click(collapseBtn);
    expect(localStorage.getItem('labledger_sidebar_collapsed')).toBe('true');

    // Click expand
    const expandBtn = screen.getByRole('button', { name: /Expand sidebar/i });
    fireEvent.click(expandBtn);
    expect(localStorage.getItem('labledger_sidebar_collapsed')).toBe('false');
  });

  it('opens and closes mobile navigation drawer', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStaffUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppLayout title="Mobile Test View">
            <div>Mobile View Content</div>
          </AppLayout>
        </MemoryRouter>
      </ThemeProvider>
    );

    const mobileMenuBtn = screen.getByRole('button', { name: /Open navigation drawer/i });
    fireEvent.click(mobileMenuBtn);

    const mobileDrawer = screen.getByRole('dialog', { name: /Mobile Navigation Menu/i });
    expect(mobileDrawer).toBeInTheDocument();

    const closeDrawerBtn = screen.getByRole('button', { name: /Close menu/i });
    fireEvent.click(closeDrawerBtn);

    expect(screen.queryByRole('dialog', { name: /Mobile Navigation Menu/i })).not.toBeInTheDocument();
  });
});
