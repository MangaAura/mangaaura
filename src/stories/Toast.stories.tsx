import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast({ title: 'Saved', description: 'Changes saved successfully', variant: 'default' })}>
        Default Toast
      </Button>
      <Button onClick={() => toast({ title: 'Success!', description: 'Operation completed', variant: 'success' })}>
        Success Toast
      </Button>
      <Button variant="destructive" onClick={() => toast({ title: 'Error', description: 'Something went wrong', variant: 'error' })}>
        Error Toast
      </Button>
      <Button variant="outline" onClick={() => toast({ title: 'Info', description: 'New update available', variant: 'info' })}>
        Info Toast
      </Button>
    </div>
  );
}

function ToastCustomMessageDemo() {
  const { toast } = useToast();
  return (
    <div className="flex gap-3">
      <Button
        variant="ink"
        onClick={() =>
          toast({
            title: '🎨 Welcome to MangaAura!',
            description: 'Explore thousands of manga titles. Your reading journey starts here.',
            variant: 'default',
          })
        }
      >
        Long Message Toast
      </Button>
    </div>
  );
}

const meta: Meta<typeof ToastProvider> = {
  title: 'Feedback/Toast',
  component: ToastProvider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="min-h-[200px] flex items-center justify-center">
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>
    </div>
  ),
};

export const WithLongMessage: StoryObj = {
  render: () => (
    <div className="min-h-[200px] flex items-center justify-center">
      <ToastProvider>
        <ToastCustomMessageDemo />
      </ToastProvider>
    </div>
  ),
};
