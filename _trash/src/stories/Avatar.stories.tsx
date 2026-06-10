import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Base/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://i.pravatar.cc/150?u=avatar@storybook.com"
        alt="User avatar"
      />
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>
      <Avatar className="w-12 h-12">
        <AvatarFallback>MC</AvatarFallback>
      </Avatar>
      <Avatar className="w-16 h-16 text-lg">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const CustomSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Avatar className="w-8 h-8">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar className="w-10 h-10">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="w-14 h-14">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="w-20 h-20 text-xl">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};
