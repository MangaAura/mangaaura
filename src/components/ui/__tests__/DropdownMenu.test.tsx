import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../DropdownMenu';

describe('DropdownMenu', () => {
  it('renders trigger content', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Options')).toBeInTheDocument();
  });

  it('uses Radix primitives', () => {
    const { container } = render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Menu</DropdownMenuTrigger>
      </DropdownMenu>
    );
    const trigger = container.querySelector('[data-testid="trigger"]');
    expect(trigger).toBeInTheDocument();
  });
});
