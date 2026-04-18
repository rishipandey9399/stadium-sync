import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import EmergencySOS from '../components/EmergencySOS';

// Mock the simulation service
vi.mock('../services/crowdSimulation', () => ({
  triggerSOSAlert: vi.fn()
}));

import { triggerSOSAlert } from '../services/crowdSimulation';

describe('EmergencySOS Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default non-active state', () => {
    render(<EmergencySOS />);
    expect(screen.getByText('Emergency SOS')).toBeInTheDocument();
    
    const triggerBtn = screen.getByRole('button', { name: /Trigger SOS/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).not.toBeDisabled();
  });

  it('triggers SOS and shows accessible live alert when confirmed', async () => {
    // Mock window.confirm to return true automatically
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    // Mock successful SOS response
    triggerSOSAlert.mockResolvedValueOnce({ success: true, alert: { status: 'dispatched' } });

    render(<EmergencySOS />);
    
    const triggerBtn = screen.getByRole('button', { name: /Trigger SOS/i });
    fireEvent.click(triggerBtn);

    // Should wait for the active state alert to render
    await waitFor(() => {
      // Role="alert" should be populated with the success text
      const alertDiv = screen.getByRole('alert');
      expect(alertDiv).toBeInTheDocument();
      expect(alertDiv).toHaveTextContent(/ALERT SENT. SECURITY DISPATCHED/i);
    });

    expect(triggerSOSAlert).toHaveBeenCalledTimes(1);
    
    // Restore confirm behavior
    window.confirm.mockRestore();
  });

  it('does not send SOS if user cancels confirm dialog', async () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => false);
    
    render(<EmergencySOS />);
    
    const triggerBtn = screen.getByRole('button', { name: /Trigger SOS/i });
    fireEvent.click(triggerBtn);

    expect(triggerSOSAlert).toHaveBeenCalledTimes(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    window.confirm.mockRestore();
  });
});
