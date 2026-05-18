import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Slider } from '../Slider';

describe('Slider', () => {
  it('renders with label and value', () => {
    render(<Slider value={50} onChange={() => {}} label="Volume" ariaLabel="Volume slider" />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders with default value', () => {
    render(<Slider value={25} onChange={() => {}} label="Brightness" ariaLabel="Brightness slider" />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('fires onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<Slider value={50} onChange={handleChange} label="Volume" ariaLabel="Volume slider" />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('renders with min and max bounds', () => {
    render(<Slider value={5} onChange={() => {}} min={0} max={10} label="Range" ariaLabel="Range slider" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '10');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Slider value={50} onChange={() => {}} label="Test" ariaLabel="Test slider" className="custom-slider" />
    );
    expect(container.firstChild).toHaveClass('custom-slider');
  });
});
