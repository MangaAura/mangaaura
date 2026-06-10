import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Card> = {
  title: 'Base/Card',
  component: Card,
  parameters: { layout: 'centered' },
  argTypes: {
    interactive: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--text-secondary)]">This is the card content area. You can put any content here.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <Card interactive className="w-72">
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Hover over me</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">This card has interactive hover effects.</p>
        </CardContent>
      </Card>
      <Card interactive className="w-72">
        <CardHeader>
          <CardTitle>Another Card</CardTitle>
          <CardDescription>Also interactive</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">Clickable card with lift animation.</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent className="pt-6">
        <p className="text-sm text-[var(--text-secondary)]">A simple card with just content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
};
