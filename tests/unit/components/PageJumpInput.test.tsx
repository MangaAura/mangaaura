import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PageJumpInput } from '@/components/Reader/PageJumpInput';

describe('PageJumpInput', () => {
  it('shows current page and total pages', () => {
    render(<PageJumpInput currentPage={5} totalPages={20} onJump={vi.fn()} />);
    const button = screen.getByText('5 / 20');
    expect(button).toBeDefined();
  });

  it('enters editing mode on click', () => {
    render(<PageJumpInput currentPage={3} totalPages={15} onJump={vi.fn()} />);
    const button = screen.getByText('3 / 15');
    fireEvent.click(button);
    const input = screen.getByLabelText('Ir a página');
    expect(input).toBeDefined();
    expect(input).toHaveValue('3');
  });

  it('shows / total pages in edit mode', () => {
    render(<PageJumpInput currentPage={1} totalPages={10} onJump={vi.fn()} />);
    const button = screen.getByText('1 / 10');
    fireEvent.click(button);
    expect(screen.getByText('/ 10')).toBeDefined();
  });

  it('submits valid page number on Enter', () => {
    const onJump = vi.fn();
    render(<PageJumpInput currentPage={1} totalPages={10} onJump={onJump} />);
    fireEvent.click(screen.getByText('1 / 10'));

    const input = screen.getByLabelText('Ir a página');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onJump).toHaveBeenCalledWith(7);
  });

  it('does not submit invalid page number', () => {
    const onJump = vi.fn();
    render(<PageJumpInput currentPage={1} totalPages={10} onJump={onJump} />);
    fireEvent.click(screen.getByText('1 / 10'));

    const input = screen.getByLabelText('Ir a página');
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onJump).not.toHaveBeenCalled();
  });

  it('does not submit page below 1', () => {
    const onJump = vi.fn();
    render(<PageJumpInput currentPage={1} totalPages={10} onJump={onJump} />);
    fireEvent.click(screen.getByText('1 / 10'));

    const input = screen.getByLabelText('Ir a página');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onJump).not.toHaveBeenCalled();
  });

  it('cancels editing on Escape', () => {
    const onJump = vi.fn();
    render(<PageJumpInput currentPage={1} totalPages={10} onJump={onJump} />);
    fireEvent.click(screen.getByText('1 / 10'));

    const input = screen.getByLabelText('Ir a página');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onJump).not.toHaveBeenCalled();
    expect(screen.getByText('1 / 10')).toBeDefined();
  });

  it('submits on blur', () => {
    const onJump = vi.fn();
    render(<PageJumpInput currentPage={2} totalPages={10} onJump={onJump} />);
    fireEvent.click(screen.getByText('2 / 10'));

    const input = screen.getByLabelText('Ir a página');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.blur(input);

    expect(onJump).toHaveBeenCalledWith(8);
  });

  it('filters non-numeric input', () => {
    const onJump = vi.fn();
    render(<PageJumpInput currentPage={1} totalPages={10} onJump={onJump} />);
    fireEvent.click(screen.getByText('1 / 10'));

    const input = screen.getByLabelText('Ir a página') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe('');
  });

  it('resets input value when not editing', () => {
    const { rerender } = render(
      <PageJumpInput currentPage={1} totalPages={10} onJump={vi.fn()} />
    );
    expect(screen.getByText('1 / 10')).toBeDefined();

    rerender(<PageJumpInput currentPage={3} totalPages={10} onJump={vi.fn()} />);
    expect(screen.getByText('3 / 10')).toBeDefined();
  });

  it('has accessible label on button', () => {
    render(<PageJumpInput currentPage={4} totalPages={20} onJump={vi.fn()} />);
    const button = screen.getByLabelText('Página 4 de 20. Click para saltar.');
    expect(button).toBeDefined();
  });
});
