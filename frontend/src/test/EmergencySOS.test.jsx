import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import EmergencySOS from '../components/EmergencySOS';

// Mock the service dependencies
vi.mock('../services/crowdSimulation', () => ({
  triggerSOSAlert: vi.fn(),
}));

vi.mock('../services/analyticsService', () => ({
  trackSOSAlert: vi.fn(),
}));

import { triggerSOSAlert } from '../services/crowdSimulation';
import { trackSOSAlert } from '../services/analyticsService';

describe('EmergencySOS Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with the SOS trigger button in default state', () => {
    render(<EmergencySOS />);
    expect(screen.getByText('Emergency SOS')).toBeInTheDocument();
    const triggerBtn = screen.getByRole('button', { name: /Trigger emergency SOS alert/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).not.toBeDisabled();
  });

  it('shows an inline confirmation dialog when SOS button is clicked', () => {
    render(<EmergencySOS />);
    fireEvent.click(screen.getByRole('button', { name: /Trigger emergency SOS alert/i }));

    const dialog = screen.getByRole('dialog', { name: /Confirm Emergency Alert/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/This will immediately alert venue security/i)).toBeInTheDocument();
  });

  it('dispatches SOS and shows accessible alert after confirming', async () => {
    triggerSOSAlert.mockResolvedValueOnce({
      success: true,
      alert: { id: 1, location: 'Section A', status: 'dispatched' },
    });

    render(<EmergencySOS />);

    // Open confirmation dialog
    fireEvent.click(screen.getByRole('button', { name: /Trigger emergency SOS alert/i }));

    // Confirm in the dialog
    fireEvent.click(screen.getByRole('button', { name: /Yes, Send SOS/i }));

    // Should fire the service
    expect(triggerSOSAlert).toHaveBeenCalledTimes(1);

    // Should show the live alert
    await waitFor(() => {
      const alertEl = screen.getByRole('alert');
      expect(alertEl).toHaveTextContent(/ALERT SENT. SECURITY DISPATCHED/i);
    });
  });

  it('tracks a GA4 SOS event after confirmed dispatch', async () => {
    triggerSOSAlert.mockResolvedValueOnce({
      success: true,
      alert: { id: 1, location: 'North Gate', status: 'dispatched' },
    });

    render(<EmergencySOS />);
    fireEvent.click(screen.getByRole('button', { name: /Trigger emergency SOS alert/i }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, Send SOS/i }));

    await waitFor(() => {
      expect(trackSOSAlert).toHaveBeenCalledWith('North Gate');
    });
  });

  it('closes the confirmation dialog when Cancel is clicked', () => {
    render(<EmergencySOS />);

    fireEvent.click(screen.getByRole('button', { name: /Trigger emergency SOS alert/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(triggerSOSAlert).not.toHaveBeenCalled();
  });

  it('does NOT trigger SOS if Cancel is pressed (service never called)', () => {
    render(<EmergencySOS />);
    fireEvent.click(screen.getByRole('button', { name: /Trigger emergency SOS alert/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(triggerSOSAlert).toHaveBeenCalledTimes(0);
  });
});
