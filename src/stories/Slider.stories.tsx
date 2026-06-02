import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Slider } from '@/components/ui/Slider';

const meta: Meta<typeof Slider> = {
  title: 'Form/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState(50);
    return (
      <div className="w-80">
        <Slider
          value={value}
          onChange={setValue}
          label="Volume"
          ariaLabel="Volume slider"
          min={0}
          max={100}
          step={1}
        />
      </div>
    );
  },
};

export const WithCustomRange: Story = {
  render: function Render() {
    const [value, setValue] = useState(5);
    return (
      <div className="w-80">
        <Slider
          value={value}
          onChange={setValue}
          label="Rating"
          ariaLabel="Rating slider"
          min={1}
          max={10}
          step={1}
        />
      </div>
    );
  },
};
