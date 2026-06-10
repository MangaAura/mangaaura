import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '@/components/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Base/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'ink'],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Badge', variant: 'default' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="ink">Ink</Badge>
    </div>
  ),
};

export const OnSurface: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
    </div>
  ),
};
