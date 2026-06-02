import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

const meta: Meta<typeof AnimatedContainer> = {
  title: 'Animation/AnimatedContainer',
  component: AnimatedContainer,
  parameters: { layout: 'centered' },
  argTypes: {
    animation: {
      control: 'select',
      options: ['fadeIn', 'fadeInUp', 'fadeInDown', 'scaleIn', 'slideInLeft', 'slideInRight'],
    },
    delay: { control: { type: 'number', min: 0, max: 2, step: 0.1 } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnimatedContainer>;

export const FadeInUp: Story = {
  args: {
    animation: 'fadeInUp',
    children: (
      <div className="p-8 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Animated Content</h3>
        <p className="text-sm text-[var(--text-secondary)]">This content animates in with a fadeInUp effect.</p>
      </div>
    ),
  },
};

export const ScaleIn: Story = {
  args: {
    animation: 'scaleIn',
    children: (
      <div className="p-8 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Scale In</h3>
        <p className="text-sm text-[var(--text-secondary)]">This content scales in from 90%.</p>
      </div>
    ),
  },
};

export const StaggeredItems: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      {['First', 'Second', 'Third'].map((text, i) => (
        <AnimatedContainer key={text} animation="fadeInUp" delay={i * 0.15}>
          <div className="p-4 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-primary)]">{text} Item</p>
          </div>
        </AnimatedContainer>
      ))}
    </div>
  ),
};

export const MultipleAnimations: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 justify-center">
      <AnimatedContainer animation="fadeIn"><div className="w-28 h-28 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-xs text-[var(--primary)] border border-[var(--primary)]/30">fadeIn</div></AnimatedContainer>
      <AnimatedContainer animation="fadeInUp"><div className="w-28 h-28 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-xs text-[var(--primary)] border border-[var(--primary)]/30">fadeInUp</div></AnimatedContainer>
      <AnimatedContainer animation="scaleIn"><div className="w-28 h-28 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-xs text-[var(--primary)] border border-[var(--primary)]/30">scaleIn</div></AnimatedContainer>
      <AnimatedContainer animation="slideInLeft"><div className="w-28 h-28 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-xs text-[var(--primary)] border border-[var(--primary)]/30">slideInLeft</div></AnimatedContainer>
    </div>
  ),
};
