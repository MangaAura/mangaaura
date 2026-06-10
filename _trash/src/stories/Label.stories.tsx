import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Label> = {
  title: 'Form/Label',
  component: Label,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Email address',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-72">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="email@example.com" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-72">
      <Label htmlFor="disabled-input" className="peer-disabled:opacity-70">Disabled field</Label>
      <Input id="disabled-input" disabled placeholder="This field is disabled" />
    </div>
  ),
};
