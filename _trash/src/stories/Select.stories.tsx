import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/Select';

const meta: Meta<typeof Select> = {
  title: 'Form/Select',
  component: Select,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Choose category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Entertainment</SelectLabel>
          <SelectItem value="shonen">Shonen</SelectItem>
          <SelectItem value="seinen">Seinen</SelectItem>
          <SelectItem value="shojo">Shojo</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Demographic</SelectLabel>
          <SelectItem value="kids">Kids</SelectItem>
          <SelectItem value="teen">Teen</SelectItem>
          <SelectItem value="adult">Adult</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  ),
};
