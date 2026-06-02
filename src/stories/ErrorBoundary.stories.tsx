import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorBoundary } from '@/components/ui/ErrorMessage';

function ExampleError() {
  return (
    <ErrorBoundary
      error={new Error('Failed to fetch chapter data. Please try again.')}
      reset={() => console.log('Reset clicked')}
    />
  );
}

function ExampleDevError() {
  return (
    <div className="max-w-md">
      <ErrorBoundary
        error={new Error('TypeError: Cannot read properties of undefined (reading \'title\')')}
        reset={() => console.log('Reset clicked')}
      />
    </div>
  );
}

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Feedback/ErrorBoundary',
  component: ErrorBoundary,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj = {
  render: () => <ExampleError />,
};

export const WithDevError: StoryObj = {
  parameters: { layout: 'centered' },
  render: () => <ExampleDevError />,
};
