import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransferCard } from './TransferCard';
import { encryptData } from '../../utils/encryption';
import '@testing-library/jest-dom';

describe('TransferCard Component', () => {
  const mockData = {
    id: 'TR-123',
    patientName: encryptData('John Doe'),
    age: encryptData('45'),
    gender: encryptData('Male'),
    priority: 'high',
    status: 'pending',
    pickup: { hospitalName: 'General Hospital' },
    destination: { hospitalName: 'City Clinic' },
    distance: 5.2,
    eta: '10 mins'
  };

  it('renders patient information correctly after decryption', () => {
    render(<TransferCard type="incoming" data={mockData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays the correct priority', () => {
    render(<TransferCard type="incoming" data={mockData} />);
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('displays hospital names correctly', () => {
    render(<TransferCard type="incoming" data={mockData} />);
    expect(screen.getByText('General Hospital')).toBeInTheDocument();
    expect(screen.getByText('City Clinic')).toBeInTheDocument();
  });
});
