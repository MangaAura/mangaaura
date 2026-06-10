import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Feedback/ErrorMessage',
  component: ErrorMessage,
  parameters: { layout: 'centered' },
  argTypes: {
    severity: { control: 'select', options: ['error', 'warning', 'info', 'success'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorMessage>;

export const Error: Story = {
  args: {
    severity: 'error',
    title: 'Upload failed',
    message: 'The image could not be uploaded. Please check the file size and format.',
  },
};

export const Warning: Story = {
  args: {
    severity: 'warning',
    title: 'Storage almost full',
    message: 'You have used 90% of your storage. Upgrade your plan to continue uploading.',
  },
};

export const Info: Story = {
  args: {
    severity: 'info',
    title: 'New feature available',
    message: 'AI-powered manga recommendations are now available in your dashboard.',
  },
};

export const Success: Story = {
  args: {
    severity: 'success',
    title: 'Changes saved',
    message: 'Your profile has been updated successfully.',
  },
};

export const WithAction: Story = {
  args: {
    severity: 'error',
    message: 'Failed to load your manga list.',
    action: { label: 'Try again', onClick: () => console.log('Retry') },
  },
};

export const WithDismiss: Story = {
  args: {
    severity: 'warning',
    message: 'Your session will expire in 5 minutes.',
    onDismiss: () => console.log('Dismissed'),
  },
};


