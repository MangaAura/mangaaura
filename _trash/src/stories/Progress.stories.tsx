import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Progress } from '@/components/ui/Progress';

const meta: Meta<typeof Progress> = {
  title: 'Feedback/Progress',
  component: Progress,
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 100 } },
    max: { control: { type: 'number', min: 1, max: 1000 } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Empty: Story = {
  args: { value: 0 },
};

export const Halfway: Story = {
  args: { value: 50 },
};

export const AlmostDone: Story = {
  args: { value: 85 },
};

export const Complete: Story = {
  args: { value: 100 },
};

export const Steps: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Step 1</span>
          <span className="text-[var(--text-muted)]">33%</span>
        </div>
        <Progress value={33} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Step 2</span>
          <span className="text-[var(--text-muted)]">66%</span>
        </div>
        <Progress value={66} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Complete</span>
          <span className="text-[var(--text-muted)]">100%</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  ),
};
