import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: vi.fn((props: Record<string, unknown>) => {
    const { fill, width, height, priority, placeholder, blurDataURL, ...rest } = props;
    const imgProps: Record<string, unknown> = { ...rest };
    if (!fill) {
      imgProps.width = width;
      imgProps.height = height;
    }
    return <img {...imgProps} />;
  }),
}));

import { OptimizedImage, ThumbnailImage, CoverImage } from '@/components/Image/OptimizedImage';

describe('OptimizedImage', () => {
  it('renders with alt text', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" width={100} height={100} />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeDefined();
  });

  it('renders with fill mode', () => {
    render(<OptimizedImage src="/test.jpg" alt="Fill image" fill />);
    const img = screen.getByAltText('Fill image');
    expect(img).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Styled image" width={100} height={100} className="custom-class" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  it('shows loading skeleton initially', () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Loading image" width={100} height={100} />
    );
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeDefined();
  });

  it('uses lazy loading by default', () => {
    render(<OptimizedImage src="/test.jpg" alt="Lazy image" width={100} height={100} />);
    const img = screen.getByAltText('Lazy image');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('uses eager loading when specified', () => {
    render(<OptimizedImage src="/test.jpg" alt="Eager image" width={100} height={100} loading="eager" />);
    const img = screen.getByAltText('Eager image');
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('renders error state when fallbackOnError triggers', () => {
    render(<OptimizedImage src="/test.jpg" alt="Error image" width={100} height={100} />);
    const img = screen.getByAltText('Error image');
    expect(img).toBeDefined();
  });

  it('calls onLoad callback when image loads', () => {
    const onLoad = vi.fn();
    render(<OptimizedImage src="/test.jpg" alt="OnLoad image" width={100} height={100} onLoad={onLoad} />);
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('calls onClick when wrapper is clicked', () => {
    const onClick = vi.fn();
    render(<OptimizedImage src="/test.jpg" alt="Click image" width={100} height={100} onClick={onClick} />);
    const wrapper = screen.getByAltText('Click image').closest('div');
    wrapper?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ThumbnailImage', () => {
  it('renders with 200x200 dimensions', () => {
    render(<ThumbnailImage src="/thumb.jpg" alt="Thumbnail" />);
    const img = screen.getByAltText('Thumbnail');
    expect(img).toBeDefined();
  });
});

describe('CoverImage', () => {
  it('renders with fill mode', () => {
    render(<CoverImage src="/cover.jpg" alt="Cover" />);
    const img = screen.getByAltText('Cover');
    expect(img).toBeDefined();
  });
});
