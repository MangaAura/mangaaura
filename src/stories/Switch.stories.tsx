import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';

const meta: Meta<typeof Switch> = {
  title: 'Form/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Unchecked: Story = {
  args: { checked: false },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Interactive: Story = {
  render: function Render() {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex items-center gap-3">
        <Switch checked={checked} onCheckedChange={setChecked} />
        <span className="text-sm text-[var(--text-secondary)]">
          {checked ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Switch disabled checked={false} />
        <span className="text-sm text-[var(--text-secondary)]">Disabled off</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch disabled checked={true} />
        <span className="text-sm text-[var(--text-secondary)]">Disabled on</span>
      </div>
    </div>
  ),
};
