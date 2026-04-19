import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VirtualQueue from '../components/VirtualQueue';
import * as crowdSimulation from '../services/crowdSimulation';
import * as analyticsService from '../services/analyticsService';

// Mock the services
vi.mock('../services/crowdSimulation', () => ({
  joinVirtualQueue: vi.fn(),
  getQueueStatus: vi.fn(),
}));

vi.mock('../services/analyticsService', () => ({
  trackQueueJoin: vi.fn(),
}));

describe('VirtualQueue Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the join queue button in idle state', () => {
    render(<VirtualQueue />);
    const joinBtn = screen.getByRole('button', { name: /Join the Virtual Merch Queue/i });
    expect(joinBtn).toBeInTheDocument();
    expect(joinBtn).not.toBeDisabled();
  });

  it('shows loading state while joining queue', async () => {
    // Never resolve to stay in loading state
    crowdSimulation.joinVirtualQueue.mockReturnValue(new Promise(() => {}));
    render(<VirtualQueue />);
    
    const joinBtn = screen.getByRole('button', { name: /Join the Virtual Merch Queue/i });
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Joining the Merch Queue/i })).toBeDisabled();
    });
  });

  it('displays queue position after successfully joining', async () => {
    crowdSimulation.joinVirtualQueue.mockResolvedValue({ success: true, position: 15 });
    
    render(<VirtualQueue />);
    
    fireEvent.click(screen.getByRole('button', { name: /Join the Virtual Merch Queue/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('#15')).toBeInTheDocument();
    });
  });

  it('tracks GA4 event when queue is joined', async () => {
    crowdSimulation.joinVirtualQueue.mockResolvedValue({ success: true, position: 8 });
    render(<VirtualQueue />);

    fireEvent.click(screen.getByRole('button', { name: /Join the Virtual Merch Queue/i }));

    await waitFor(() => {
      expect(analyticsService.trackQueueJoin).toHaveBeenCalledWith(8);
    });
  });

  it('shows an inline error message when queue join fails', async () => {
    crowdSimulation.joinVirtualQueue.mockResolvedValue({ success: false, position: null });
    render(<VirtualQueue />);

    fireEvent.click(screen.getByRole('button', { name: /Join the Virtual Merch Queue/i }));

    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent(/Failed to join queue/i);
    });
  });

  it('shows "your turn" message when position reaches 0', async () => {
    crowdSimulation.joinVirtualQueue.mockResolvedValue({ success: true, position: 0 });
    render(<VirtualQueue />);

    fireEvent.click(screen.getByRole('button', { name: /Join the Virtual Merch Queue/i }));

    await waitFor(() => {
      expect(screen.getByText(/YOUR TURN/i)).toBeInTheDocument();
    });
  });
});
