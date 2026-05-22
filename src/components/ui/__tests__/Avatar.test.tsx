import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Avatar, AvatarImage, AvatarFallback } from '../Avatar';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} />;
  },
}));

describe('Avatar', () => {
  it('renders AvatarImage with correct src', () => {
    render(
      <Avatar>
        <AvatarImage src="/photo.jpg" alt="User name" />
      </Avatar>
    );
    const img = screen.getByAltText('User name');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/photo.jpg');
  });

  it('renders AvatarFallback with initials', () => {
    render(
      <Avatar>
        <AvatarImage />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('shows single initial from name', () => {
    render(
      <Avatar>
        <AvatarImage />
        <AvatarFallback>J</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('J')).toBeInTheDocument();
  });
});
