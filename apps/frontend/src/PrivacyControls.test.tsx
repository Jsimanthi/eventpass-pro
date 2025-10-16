import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivacyControls from './PrivacyControls';

test('renders privacy controls', () => {
  render(<PrivacyControls />);
  const linkElement = screen.getByText(/Privacy Controls/i);
  expect(linkElement).toBeInTheDocument();
});
