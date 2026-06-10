import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Input> = {
  title: 'Form/Input',
  component: Input,
  parameters: { layout: 'centered' },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Some value',
  },
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="email@example.com" />
      <Input type="password" placeholder="Password" />
      <Input type="search" placeholder="Search..." />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    placeholder: 'Email address',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};
