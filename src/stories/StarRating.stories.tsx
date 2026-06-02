import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StarRating } from '@/components/ui/StarRating';

const meta: Meta<typeof StarRating> = {
  title: 'Form/StarRating',
  component: StarRating,
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 5, step: 0.5 } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    interactive: { control: 'boolean' },
    showAverage: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StarRating>;

export const Display: Story = {
  args: {
    value: 4.2,
    showAverage: true,
    totalRatings: 128,
  },
};

export const Interactive: Story = {
  args: {
    value: 0,
    interactive: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <StarRating value={4.5} showAverage size="sm" totalRatings={10} />
      <StarRating value={3.8} showAverage size="md" totalRatings={42} />
      <StarRating value={4.0} showAverage size="lg" totalRatings={99} />
    </div>
  ),
};

export const HalfStars: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StarRating value={0.5} showAverage />
      <StarRating value={1.5} showAverage />
      <StarRating value={2.5} showAverage />
      <StarRating value={3.5} showAverage />
      <StarRating value={4.5} showAverage />
    </div>
  ),
};
