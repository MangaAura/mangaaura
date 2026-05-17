import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeDefined();
  });

  it('handles value changes', () => {
    let value = '';
    render(<Textarea onChange={(e) => { value = e.target.value; }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test content' } });
    expect(value).toBe('test content');
  });

  it('applies disabled state', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />);
    expect(screen.getByRole('textbox').className).toContain('custom-class');
  });

  it('renders error message', () => {
    render(<Textarea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
