import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlaskConical } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title, description, and action button', () => {
    const handleAction = vi.fn();

    render(
      <MemoryRouter>
        <EmptyState
          icon={<FlaskConical data-testid="flask-icon" />}
          title="No Instruments Found"
          description="Adjust your laboratory filters or register a new piece of equipment."
          action={{
            label: 'Register Instrument',
            onClick: handleAction,
          }}
          secondaryAction={{
            label: 'Clear Filters',
            href: '/app/equipment',
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('flask-icon')).toBeInTheDocument();
    expect(screen.getByText('No Instruments Found')).toBeInTheDocument();
    expect(
      screen.getByText('Adjust your laboratory filters or register a new piece of equipment.')
    ).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: /Register Instrument/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);

    const clearLink = screen.getByRole('link', { name: /Clear Filters/i });
    expect(clearLink).toHaveAttribute('href', '/app/equipment');
  });
});
