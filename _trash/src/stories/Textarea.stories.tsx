import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from '@/components/ui/Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Form/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    rows: { control: 'number' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Write something...',
    rows: 4,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'This is a textarea with some content.\nIt spans multiple lines.\nEach line shows how the component handles text.',
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Description',
    defaultValue: 'Too short',
    error: 'Description must be at least 20 characters',
    rows: 3,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
    rows: 3,
  },
};
