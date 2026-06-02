import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SkeletonGrid } from '@/components/ui/SkeletonGrid';

const meta: Meta<typeof SkeletonGrid> = {
  title: 'Feedback/SkeletonGrid',
  component: SkeletonGrid,
  parameters: { layout: 'padded' },
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 12 } },
    columns: { control: 'select', options: [2, 3, 4, 5] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonGrid>;

export const Default: Story = {
  args: {
    count: 6,
    columns: 4,
  },
};

export const Grid3Columns: Story = {
  args: {
    count: 6,
    columns: 3,
  },
};

export const Grid2Columns: Story = {
  args: {
    count: 4,
    columns: 2,
  },
};
