import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Form/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-96">
      <TabsList>
        <TabsTrigger value="tab1">Account</TabsTrigger>
        <TabsTrigger value="tab2">Password</TabsTrigger>
        <TabsTrigger value="tab3">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="p-4 text-sm text-[var(--text-secondary)]">
        Account settings content goes here. You can edit your profile information.
      </TabsContent>
      <TabsContent value="tab2" className="p-4 text-sm text-[var(--text-secondary)]">
        Password settings content goes here. Change your password securely.
      </TabsContent>
      <TabsContent value="tab3" className="p-4 text-sm text-[var(--text-secondary)]">
        General settings content goes here. Customize your experience.
      </TabsContent>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="tab1">Popular</TabsTrigger>
        <TabsTrigger value="tab2">Recent</TabsTrigger>
        <TabsTrigger value="tab3">Trending</TabsTrigger>
        <TabsTrigger value="tab4">Following</TabsTrigger>
        <TabsTrigger value="tab5">Bookmarks</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="p-4 text-sm text-[var(--text-secondary)]">
        Popular content
      </TabsContent>
      <TabsContent value="tab2" className="p-4 text-sm text-[var(--text-secondary)]">
        Recent content
      </TabsContent>
    </Tabs>
  ),
};
