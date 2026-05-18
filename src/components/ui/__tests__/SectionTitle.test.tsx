import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SectionTitle } from '../SectionTitle';

describe('SectionTitle', () => {
  it('renders title text', () => {
    render(<SectionTitle>My Title</SectionTitle>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders optional action', () => {
    render(<SectionTitle action={<button>Action</button>}>Title</SectionTitle>);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<SectionTitle className="custom-class">Title</SectionTitle>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
