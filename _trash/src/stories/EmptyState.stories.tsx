import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmptyState, EmptyLibrary, EmptySearch, ErrorState } from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';
const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    preset: { control: 'select', options: ['empty', 'error', 'search', 'library', undefined] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at the moment.',
    size: 'md',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'No manga yet',
    description: 'Start adding manga to your collection to see them here.',
    size: 'md',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Your library is empty',
    description: 'Click the button below to explore and add manga.',
    action: { label: 'Explore Mangas', href: '/explore' },
    size: 'md',
  },
};

export const PresetSearch: Story = {
  render: () => <EmptySearch query="one piece" />,
};

export const PresetLibrary: Story = {
  render: () => <EmptyLibrary />,
};

export const ErrorStateStory: Story = {
  render: () => <ErrorState message="Could not load the manga list. Please try again." onRetry={() => alert('Retry clicked!')} />,
};


