import React from 'react';
import { render, screen } from '@testing-library/react';
import QueueMonitoring from './QueueMonitoring';

test('renders queue monitoring', () => {
  render(<QueueMonitoring />);
  const linkElement = screen.getByText(/Job Queue/i);
  expect(linkElement).toBeInTheDocument();
});
