import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef, type RefObject } from 'react';

import {
  ImageCropperUploader,
  type ImageCropperUploaderHandle,
} from '../ImageCropperUploader';

// ─── Mocks ───────────────────────────────────────────────────────────

const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);
});

vi.mock('@/components/ui/ImageCropper', () => ({
  default: vi.fn(
    ({
      open,
      onCropConfirm,
      onCancel,
      aspect,
      title,
      subtitle,
    }: {
      open: boolean;
      onCropConfirm: (blob: Blob) => void;
      onCancel: () => void;
      aspect?: number;
      title?: string;
      subtitle?: string;
    }) => {
      if (!open) return null;
      return (
        <div data-testid="mock-cropper">
          <span data-testid="cropper-title">{title || 'Ajustar imagen'}</span>
          <span data-testid="cropper-subtitle">
            {subtitle || 'Arrastra para encuadrar · Ratio 16:9'}
          </span>
          <span data-testid="cropper-aspect">{aspect}</span>
          <button
            data-testid="mock-confirm"
            onClick={() =>
              onCropConfirm(new Blob(['test'], { type: 'image/webp' }))
            }
          >
            Confirm
          </button>
          <button data-testid="mock-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      );
    }
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────

function createMockFile(
  name = 'test.png',
  type = 'image/png',
  size = 1024
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

function renderCropper(
  props: Partial<{
    aspect: number;
    cropperTitle: string;
    cropperSubtitle: string;
    accept: string;
    maxSize: number;
    onCropComplete: (blob: Blob, fileName: string) => void;
    onError: (error: string) => void;
    inputId: string;
  }> = {}
) {
  const onCropComplete = vi.fn();
  const onError = vi.fn();
  const ref: RefObject<ImageCropperUploaderHandle | null> = createRef();

  const utils = render(
    <ImageCropperUploader
      ref={ref}
      onCropComplete={props.onCropComplete || onCropComplete}
      onError={props.onError || onError}
      aspect={props.aspect}
      cropperTitle={props.cropperTitle}
      cropperSubtitle={props.cropperSubtitle}
      accept={props.accept}
      maxSize={props.maxSize}
      inputId={props.inputId}
    />
  );

  return {
    ...utils,
    ref,
    onCropComplete: props.onCropComplete || onCropComplete,
    onError: props.onError || onError,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('ImageCropperUploader', () => {
  describe('rendering', () => {
    it('renders a hidden file input', () => {
      renderCropper();
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('hidden');
    });

    it('does not render the cropper initially', () => {
      renderCropper();
      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('renders the cropper when processFile is called with a valid file', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile());
      });
      expect(screen.getByTestId('mock-cropper')).toBeInTheDocument();
    });

    it('passes aspect ratio to the cropper', async () => {
      const { ref } = renderCropper({ aspect: 1 });
      await act(async () => {
        ref.current?.processFile(createMockFile());
      });
      expect(screen.getByTestId('cropper-aspect').textContent).toBe('1');
    });

    it('passes custom title and subtitle to the cropper', async () => {
      const { ref } = renderCropper({
        cropperTitle: 'Custom Title',
        cropperSubtitle: 'Custom subtitle here',
      });
      await act(async () => {
        ref.current?.processFile(createMockFile());
      });
      expect(screen.getByTestId('cropper-title').textContent).toBe(
        'Custom Title'
      );
      expect(screen.getByTestId('cropper-subtitle').textContent).toBe(
        'Custom subtitle here'
      );
    });

    it('uses default title and subtitle when not provided', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile());
      });
      expect(screen.getByTestId('cropper-title').textContent).toBe(
        'Ajustar imagen'
      );
      expect(screen.getByTestId('cropper-subtitle').textContent).toBe(
        'Arrastra para encuadrar · Ratio 16:9'
      );
    });

    it('sets inputId on the file input', () => {
      renderCropper({ inputId: 'my-cropper-input' });
      const input = document.getElementById('my-cropper-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('ref API - open()', () => {
    it('exposes an open method via ref', () => {
      const ref = createRef<ImageCropperUploaderHandle>();
      render(
        <ImageCropperUploader
          ref={ref}
          onCropComplete={vi.fn()}
        />
      );
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.open).toBe('function');
    });

    it('exposes a processFile method via ref', () => {
      const ref = createRef<ImageCropperUploaderHandle>();
      render(
        <ImageCropperUploader
          ref={ref}
          onCropComplete={vi.fn()}
        />
      );
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.processFile).toBe('function');
    });
  });

  describe('ref API - processFile()', () => {
    it('creates an object URL for a valid file', async () => {
      const { ref } = renderCropper();
      const file = createMockFile();
      await act(async () => {
        ref.current?.processFile(file);
      });
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    });

    it('calls onError when file type is not allowed', async () => {
      const { ref, onError } = renderCropper({
        accept: 'image/jpeg,image/png',
      });
      const invalidFile = createMockFile('test.gif', 'image/gif');
      await act(async () => {
        ref.current?.processFile(invalidFile);
      });
      expect(onError).toHaveBeenCalledWith('Formato no soportado.');
      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('calls onError when file exceeds maxSize', async () => {
      const { ref, onError } = renderCropper({ maxSize: 500 });
      const oversizedFile = createMockFile('large.png', 'image/png', 1024);
      await act(async () => {
        ref.current?.processFile(oversizedFile);
      });
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('demasiado grande')
      );
      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('accepts wildcard MIME types (e.g. image/*)', async () => {
      const { ref, onError } = renderCropper({ accept: 'image/*' });
      await act(async () => {
        ref.current?.processFile(createMockFile('test.webp', 'image/webp'));
      });
      expect(onError).not.toHaveBeenCalled();
      expect(screen.getByTestId('mock-cropper')).toBeInTheDocument();
    });

    it('uses default accept list when not overridden', async () => {
      const { ref, onError } = renderCropper();
      // Default accepts: jpeg, png, webp, gif, avif
      await act(async () => {
        ref.current?.processFile(createMockFile('test.gif', 'image/gif'));
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('file input onChange', () => {
    it('opens cropper when a valid file is selected via the input', () => {
      renderCropper();
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();

      const file = createMockFile();
      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByTestId('mock-cropper')).toBeInTheDocument();
    });

    it('does not open cropper when no file is selected', () => {
      renderCropper();
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { files: [] } });
      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('does not open cropper when files is null', () => {
      renderCropper();
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { files: null } });
      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('calls onError when invalid file type is selected', () => {
      const { onError } = renderCropper({ accept: 'image/png' });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: { files: [createMockFile('test.jpg', 'image/jpeg')] },
      });
      expect(onError).toHaveBeenCalledWith('Formato no soportado.');
      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });
  });

  describe('crop confirmation', () => {
    it('calls onCropComplete with blob and webp filename when confirmed', async () => {
      const { ref, onCropComplete } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-confirm'));
      });

      expect(onCropComplete).toHaveBeenCalledTimes(1);

      const [blob, fileName] = (onCropComplete as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(fileName).toBe('test.webp');
    });

    it('closes the cropper after confirmation', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-confirm'));
      });

      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('revokes the object URL after confirmation', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png'));
      });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);

      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-confirm'));
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('uses default filename when original has no extension', async () => {
      const { ref, onCropComplete } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('noext', 'image/png'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-confirm'));
      });

      const [, fileName] = (onCropComplete as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fileName).toBe('noext.webp');
    });
  });

  describe('crop cancellation', () => {
    it('closes the cropper on cancel', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png'));
      });

      expect(screen.getByTestId('mock-cropper')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-cancel'));
      });

      expect(screen.queryByTestId('mock-cropper')).not.toBeInTheDocument();
    });

    it('revokes the object URL on cancel', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png'));
      });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);

      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-cancel'));
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('resets file input value on cancel', async () => {
      const { ref } = renderCropper();
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png'));
      });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      await act(async () => {
        // Set a value so we can verify it's reset
        Object.defineProperty(input, 'value', { writable: true, value: 'test.png' });

        fireEvent.click(screen.getByTestId('mock-cancel'));
      });

      expect(input.value).toBe('');
    });
  });

  describe('custom accept prop', () => {
    it('restricts file types based on accept prop', async () => {
      const { ref, onError } = renderCropper({
        accept: 'image/webp,image/avif',
      });

      await act(async () => {
        ref.current?.processFile(createMockFile('test.jpg', 'image/jpeg'));
      });
      expect(onError).toHaveBeenCalled();
    });

    it('allows files matching the custom accept list', async () => {
      const { ref, onError } = renderCropper({
        accept: 'image/webp,image/avif',
      });

      await act(async () => {
        ref.current?.processFile(createMockFile('test.webp', 'image/webp'));
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('custom maxSize prop', () => {
    it('rejects files larger than custom maxSize', async () => {
      const { ref, onError } = renderCropper({ maxSize: 100 });
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png', 'image/png', 200));
      });
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('demasiado grande')
      );
    });

    it('accepts files within custom maxSize', async () => {
      const { ref, onError } = renderCropper({ maxSize: 500 });
      await act(async () => {
        ref.current?.processFile(createMockFile('test.png', 'image/png', 300));
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
