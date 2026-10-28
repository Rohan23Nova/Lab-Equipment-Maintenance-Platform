import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/context/ToastContext';

const TestComponent: React.FC = () => {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Action succeeded!', 'Success Title')}>
        Trigger Success
      </button>
      <button onClick={() => toast.error('Critical failure occurred.', 'Error Title')}>
        Trigger Error
      </button>
      <button onClick={() => toast.warning('Caution required.')}>
        Trigger Warning
      </button>
      <button onClick={() => toast.info('System notification.')}>
        Trigger Info
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  it('renders success and error toasts with accessible roles and dismiss buttons', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Trigger success toast
    fireEvent.click(screen.getByRole('button', { name: /Trigger Success/i }));
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Action succeeded!')).toBeInTheDocument();

    // Trigger error toast
    fireEvent.click(screen.getByRole('button', { name: /Trigger Error/i }));
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Critical failure occurred.')).toBeInTheDocument();

    // Dismiss toast
    const dismissBtns = screen.getAllByRole('button', { name: /Dismiss notification/i });
    expect(dismissBtns.length).toBe(2);

    fireEvent.click(dismissBtns[0]);
    expect(screen.queryByText('Action succeeded!')).not.toBeInTheDocument();
  });
});
