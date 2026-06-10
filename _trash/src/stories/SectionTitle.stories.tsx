import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof SectionTitle> = {
  title: 'Layout/SectionTitle',
  component: SectionTitle,
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SectionTitle>;

export const Default: Story = {
  args: {
    children: 'Section Title',
    size: 'md',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Featured Mangas',
    icon: <Sparkles className="w-5 h-5" />,
    size: 'md',
  },
};

export const WithAction: Story = {
  args: {
    children: 'Recent Chapters',
    icon: <Sparkles className="w-5 h-5" />,
    action: <Button variant="ghost" size="sm">View all</Button>,
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <SectionTitle size="sm">Small Title</SectionTitle>
      <SectionTitle size="md">Medium Title</SectionTitle>
      <SectionTitle size="lg">Large Title</SectionTitle>
    </div>
  ),
};
