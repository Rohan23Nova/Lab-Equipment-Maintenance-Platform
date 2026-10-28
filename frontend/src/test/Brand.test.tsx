import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogoMark } from '@/components/brand/LogoMark';
import { Wordmark } from '@/components/brand/Wordmark';

describe('Brand Components', () => {
  it('renders LogoMark with svg element', () => {
    const { container } = render(<LogoMark size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders Wordmark with Lab and Ledger text', () => {
    render(<Wordmark showTagline size="md" />);
    expect(screen.getByText('Lab')).toBeInTheDocument();
    expect(screen.getByText('Ledger')).toBeInTheDocument();
    expect(screen.getByText(/Every instrument accounted for\./i)).toBeInTheDocument();
  });

  it('renders Wordmark without tagline when showTagline is false', () => {
    render(<Wordmark showTagline={false} size="sm" />);
    expect(screen.getByText('Lab')).toBeInTheDocument();
    expect(screen.getByText('Ledger')).toBeInTheDocument();
    expect(screen.queryByText(/Every instrument accounted for\./i)).not.toBeInTheDocument();
  });
});
