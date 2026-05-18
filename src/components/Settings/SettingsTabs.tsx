'use client';

import { User, Bell, Shield, Lock, Palette } from 'lucide-react';
import { useState } from 'react';

import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import { ProfileSettings } from './ProfileSettings';
import { SecuritySettings } from './SecuritySettings';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  emailPreferences: {
    newsletter: boolean;
    newFollowers: boolean;
    newComments: boolean;
    chapterUpdates: boolean;
    achievements: boolean;
    marketing: boolean;
  };
}

interface SettingsTabsProps {
  user: User;
}

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'privacy', label: 'Privacidad', icon: Shield },
  { id: 'security', label: 'Seguridad', icon: Lock },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
];

export function SettingsTabs({ user }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="py-4">
        {activeTab === 'profile' && <ProfileSettings user={user} />}
        {activeTab === 'notifications' && (
          <NotificationSettings userId={user.id} preferences={user.emailPreferences} />
        )}
        {activeTab === 'privacy' && <PrivacySettings userId={user.id} />}
        {activeTab === 'security' && <SecuritySettings userId={user.id} />}
        {activeTab === 'appearance' && <AppearanceSettings />}
      </div>
    </div>
  );
}
