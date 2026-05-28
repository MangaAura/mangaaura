'use client';

import { User, Bell, Shield, Lock, Palette, Eye, UserCog } from 'lucide-react';
import { useState } from 'react';

import { AccessibilitySettings } from './AccessibilitySettings';
import { AccountSettings } from './AccountSettings';
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
  coverUrl?: string | null;
  bio?: string | null;
  website?: string | null;
  socialLinks?: string | null;
  emailPreferences: {
    newsletter: boolean;
    newFollowers: boolean;
    commentReplies: boolean;
    commentLikes: boolean;
    newComments: boolean;
    commentMentions: boolean;
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
  { id: 'account', label: 'Cuenta', icon: UserCog },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'accessibility', label: 'Accesibilidad', icon: Eye },
];

export function SettingsTabs({ user }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('profile');

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = tabs.length - 1;
    } else {
      return;
    }
    setActiveTab(tabs[newIndex].id);
    document.getElementById(`tab-${tabs[newIndex].id}`)?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)]">
        <nav role="tablist" aria-label="Configuración" className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="py-4">
        {activeTab === 'profile' && <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" tabIndex={0}><ProfileSettings user={user} /></div>}
        {activeTab === 'notifications' && (
          <div role="tabpanel" id="panel-notifications" aria-labelledby="tab-notifications" tabIndex={0}><NotificationSettings userId={user.id} preferences={user.emailPreferences} /></div>
        )}
        {activeTab === 'privacy' && <div role="tabpanel" id="panel-privacy" aria-labelledby="tab-privacy" tabIndex={0}><PrivacySettings userId={user.id} /></div>}
        {activeTab === 'security' && <div role="tabpanel" id="panel-security" aria-labelledby="tab-security" tabIndex={0}><SecuritySettings userId={user.id} /></div>}
        {activeTab === 'account' && <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" tabIndex={0}><AccountSettings userId={user.id} /></div>}
        {activeTab === 'appearance' && <div role="tabpanel" id="panel-appearance" aria-labelledby="tab-appearance" tabIndex={0}><AppearanceSettings /></div>}
        {activeTab === 'accessibility' && <div role="tabpanel" id="panel-accessibility" aria-labelledby="tab-accessibility" tabIndex={0}><AccessibilitySettings /></div>}
      </div>
    </div>
  );
}
