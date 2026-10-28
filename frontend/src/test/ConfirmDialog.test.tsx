import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders confirmation modal with title, warning message, and triggers onConfirm', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Archive Equipment"
        message="Are you sure you want to decommission and archive this instrument?"
        confirmLabel="Decommission Asset"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Archive Equipment')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to decommission and archive this instrument?')
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Decommission Asset/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes dialog on Escape key press', () => {
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Cancel Booking"
        message="Do you wish to release this reservation?"
        onConfirm={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
