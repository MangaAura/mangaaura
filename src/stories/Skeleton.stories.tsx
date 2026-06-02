import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from '@/components/ui/Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'heading', 'title', 'avatar', 'image', 'card', 'button', 'badge', 'stat', 'hero'],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: { variant: 'text' },
};

export const Heading: Story = {
  args: { variant: 'heading' },
};

export const Avatar: Story = {
  args: { variant: 'avatar' },
};

export const Card: Story = {
  args: { variant: 'card' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-96">
      <div className="space-y-3">
        <Skeleton variant="heading" />
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  ),
};
