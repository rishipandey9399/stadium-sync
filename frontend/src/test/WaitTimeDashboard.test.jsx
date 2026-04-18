import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WaitTimeDashboard from '../components/WaitTimeDashboard';
import * as firestoreSync from '../services/firestoreSync';

// Mock the CSS to prevent import errors in Vitest
vi.mock('../index.css', () => ({}));

// Mock the specific service layer dependency
vi.mock('../services/firestoreSync', () => ({
  subscribeToVenueStatus: vi.fn()
}));

const mockData = [
  { id: 'north-gate', name: 'North Entrance', type: 'gate', waitTime: 12 },
  { id: 'east-concourse', name: 'East Concourse', type: 'food', waitTime: 5 }
];

describe('WaitTimeDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a loading state initially', () => {
    // Return an empty unsubscribe function
    firestoreSync.subscribeToVenueStatus.mockImplementation(() => () => {});
    
    render(<WaitTimeDashboard />);
    
    expect(screen.getByText('Loading live data from Firestore...')).toBeInTheDocument();
  });

  it('renders data when subscription provides it', async () => {
    // Simulate the callback immediately executing with mock data
    firestoreSync.subscribeToVenueStatus.mockImplementation((callback) => {
      callback(mockData);
      return () => {}; // return mock unsubscribe
    });

    render(<WaitTimeDashboard />);

    // Since callback executes synchronously in this mock, loading state should have toggled
    await waitFor(() => {
      expect(screen.getByText('North Entrance')).toBeInTheDocument();
      expect(screen.getByText('12 MIN')).toBeInTheDocument();
      expect(screen.getByText('East Concourse')).toBeInTheDocument();
      expect(screen.getByText('5 MIN')).toBeInTheDocument();
      // Ensure Loading state is gone
      expect(screen.queryByText('Loading live data from Firestore...')).not.toBeInTheDocument();
    });
  });
});
