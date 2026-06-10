import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';

const meta: Meta<typeof StaggerContainer> = {
  title: 'Animation/StaggerContainer',
  component: StaggerContainer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StaggerContainer>;

export const SimpleList: Story = {
  render: () => (
    <StaggerContainer className="flex flex-col gap-3 w-64">
      {['Explore', 'Library', 'Community', 'Settings'].map((item) => (
        <StaggerItem key={item}>
          <div className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
            <p className="text-sm font-medium text-[var(--text-primary)]">{item}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  ),
};

export const Grid: Story = {
  render: () => (
    <StaggerContainer className="grid grid-cols-3 gap-3 w-72">
      {Array.from({ length: 9 }, (_, i) => (
        <StaggerItem key={i}>
          <div className="aspect-square rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 border border-[var(--border)] flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--text-secondary)]">{i + 1}</span>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  ),
};
