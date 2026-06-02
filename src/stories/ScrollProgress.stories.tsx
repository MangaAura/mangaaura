import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

const meta: Meta<typeof ScrollProgress> = {
  title: 'Feedback/ScrollProgress',
  component: ScrollProgress,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScrollProgress>;

export const Default: Story = {
  render: () => (
    <div className="relative min-h-[200vh]">
      <ScrollProgress />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Scroll Progress Indicator</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Scroll down to see the progress bar at the top of the page animate as you scroll.
            The bar shows your reading position as a percentage of the page height.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-8 max-w-md">
          <p className="text-sm text-[var(--text-secondary)]">
            Keep scrolling... The bar at the top fills up as you go.
          </p>
        </div>
      </div>
    </div>
  ),
};
