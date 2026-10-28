import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders navigation path with Home link and active page segment', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: 'Equipment Inventory', href: '/app/equipment' },
            { label: 'Zeiss Axio Observer 7' },
          ]}
        />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Dashboard Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Equipment Inventory/i })).toBeInTheDocument();

    const activeCrumb = screen.getByText('Zeiss Axio Observer 7');
    expect(activeCrumb).toHaveAttribute('aria-current', 'page');
  });
});
