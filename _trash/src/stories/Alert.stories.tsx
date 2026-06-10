import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Info, AlertTriangle } from 'lucide-react';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning'],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Info className="h-4 w-4" />
        <AlertDescription>This is a default alert with an informational message.</AlertDescription>
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-96">
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertDescription>This is a default informational alert.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>This is a warning alert. Please be cautious.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>This is a destructive alert. Something went wrong.</AlertDescription>
      </Alert>
    </div>
  ),
};
