import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows optional retry button', () => {
    const handleRetry = vi.fn();
    render(<ErrorMessage message="Error" action={{ label: 'Retry', onClick: handleRetry }} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
