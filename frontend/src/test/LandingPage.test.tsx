import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '@/App';
import { ThemeProvider } from '@/context/ThemeContext';

describe('Landing Page App', () => {
  it('renders navbar, hero, preview, features, and footer sections', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );

    // Hero headline
    expect(
      screen.getByRole('heading', { name: /University Laboratory Operations/i })
    ).toBeInTheDocument();

    // Tagline elements exist in hero and footer
    const taglineElements = screen.getAllByText(/Every instrument accounted for\./i);
    expect(taglineElements.length).toBeGreaterThanOrEqual(1);

    // Product Preview Section
    expect(
      screen.getByRole('heading', { name: /Equipment Lifecycle & Availability Console/i })
    ).toBeInTheDocument();

    // Check simulated disclaimer is present
    expect(
      screen.getByText(/Product Preview • Sample Facility Data Only/i)
    ).toBeInTheDocument();

    // Features Section
    expect(
      screen.getByRole('heading', { name: /Engineered for High-Stakes Academic Facilities/i })
    ).toBeInTheDocument();

    // Workflow Section
    expect(
      screen.getByRole('heading', { name: /From Fault Discovery to Certified Return to Service/i })
    ).toBeInTheDocument();

    // Footer
    expect(
      screen.getByText(/Central Research Infrastructure Bay/i)
    ).toBeInTheDocument();
  });

  it('switches tabs in the Product Preview', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );

    // Click on Active Bookings tab
    const reservationsTab = screen.getByRole('tab', { name: /Active Bookings/i });
    fireEvent.click(reservationsTab);

    expect(
      screen.getByText(/Constraint Engine:/i)
    ).toBeInTheDocument();

    const intervalLabels = screen.getAllByText(/RESERVATION INTERVAL/i);
    expect(intervalLabels.length).toBeGreaterThanOrEqual(1);

    // Click on Work Orders tab
    const workOrdersTab = screen.getByRole('tab', { name: /Work Orders/i });
    fireEvent.click(workOrdersTab);

    expect(
      screen.getByText(/Maintenance Policy:/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/WO-2026-084/i)
    ).toBeInTheDocument();
  });
});
