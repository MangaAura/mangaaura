import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock child components to isolate SettingsTabs a11y testing
vi.mock('@/components/Settings/ProfileSettings', () => ({
  ProfileSettings: vi.fn(() => (
    <div data-testid="profile-settings">Profile Settings</div>
  )),
}));

vi.mock('@/components/Settings/NotificationSettings', () => ({
  NotificationSettings: vi.fn(() => (
    <div data-testid="notification-settings">Notification Settings</div>
  )),
}));

vi.mock('@/components/Settings/PrivacySettings', () => ({
  PrivacySettings: vi.fn(() => (
    <div data-testid="privacy-settings">Privacy Settings</div>
  )),
}));

vi.mock('@/components/Settings/SecuritySettings', () => ({
  SecuritySettings: vi.fn(() => (
    <div data-testid="security-settings">Security Settings</div>
  )),
}));

vi.mock('@/components/Settings/AppearanceSettings', () => ({
  AppearanceSettings: vi.fn(() => (
    <div data-testid="appearance-settings">Appearance Settings</div>
  )),
}));

import { SettingsTabs } from '@/components/Settings/SettingsTabs';

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@mangaaura.es',
  avatarUrl: null,
  emailPreferences: {
    newsletter: true,
    newFollowers: true,
    commentReplies: true,
    commentLikes: true,
    newComments: true,
    commentMentions: true,
    chapterUpdates: true,
    achievements: true,
    marketing: false,
  },
};

describe('SettingsTabs — Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with a tablist role and accessible name', () => {
    render(<SettingsTabs user={mockUser} />);
    const tablist = screen.getByRole('tablist', { name: /configuración/i });
    expect(tablist).toBeDefined();
  });

  it('renders all tabs with role="tab" and proper aria-selected', () => {
    render(<SettingsTabs user={mockUser} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(7);

    // First tab (profile) should be selected by default
    const profileTab = screen.getByRole('tab', { name: /perfil/i });
    expect(profileTab).toHaveAttribute('aria-selected', 'true');

    // Others should be unselected
    const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
    expect(notifTab).toHaveAttribute('aria-selected', 'false');
  });

  it('associates tabs with tabpanels via aria-controls', () => {
    render(<SettingsTabs user={mockUser} />);

    const profileTab = screen.getByRole('tab', { name: /perfil/i });
    expect(profileTab).toHaveAttribute('aria-controls', 'panel-profile');

    const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
    expect(notifTab).toHaveAttribute('aria-controls', 'panel-notifications');
  });

  it('renders the active tabpanel with role="tabpanel" and aria-labelledby', () => {
    render(<SettingsTabs user={mockUser} />);

    // Only the profile panel should be visible
    const panels = screen.getAllByRole('tabpanel', { hidden: false });
    expect(panels).toHaveLength(1);

    const panel = screen.queryByRole('tabpanel');
    expect(panel).not.toBeNull();
    expect(panel!).toHaveAttribute('aria-labelledby', 'tab-profile');
    expect(panel!).toHaveAttribute('id', 'panel-profile');
  });

  it('switches tabpanel when clicking another tab', () => {
    render(<SettingsTabs user={mockUser} />);

    const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
    fireEvent.click(notifTab);

    // Now the notification panel should be visible
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'panel-notifications');
    expect(notifTab).toHaveAttribute('aria-selected', 'true');

    // And profile should be unselected
    const profileTab = screen.getByRole('tab', { name: /perfil/i });
    expect(profileTab).toHaveAttribute('aria-selected', 'false');
  });

  // Keyboard navigation tests (WAI-ARIA tab pattern)
  describe('Keyboard navigation', () => {
    it('moves focus to next tab on ArrowRight', () => {
      render(<SettingsTabs user={mockUser} />);

      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      profileTab.focus();

      fireEvent.keyDown(profileTab, { key: 'ArrowRight' });

      // Notification tab should now have focus and be selected
      const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
      expect(notifTab).toHaveAttribute('aria-selected', 'true');
    });

    it('moves focus to previous tab on ArrowLeft', () => {
      render(<SettingsTabs user={mockUser} />);

      // First click notifications to make it active
      const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
      fireEvent.click(notifTab);
      notifTab.focus();

      fireEvent.keyDown(notifTab, { key: 'ArrowLeft' });

      // Profile should now be selected again
      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps from last tab to first on ArrowRight', () => {
      render(<SettingsTabs user={mockUser} />);

      // Go to last tab
      const lastTab = screen.getByRole('tab', { name: /accesibilidad/i });
      fireEvent.click(lastTab);
      lastTab.focus();

      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });

      // Should wrap to first tab
      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });

    it('moves to first tab on Home key', () => {
      render(<SettingsTabs user={mockUser} />);

      // Go to last tab first
      const lastTab = screen.getByRole('tab', { name: /accesibilidad/i });
      fireEvent.click(lastTab);
      lastTab.focus();

      fireEvent.keyDown(lastTab, { key: 'Home' });

      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });

    it('moves to last tab on End key', () => {
      render(<SettingsTabs user={mockUser} />);

      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      profileTab.focus();

      fireEvent.keyDown(profileTab, { key: 'End' });

      const lastTab = screen.getByRole('tab', { name: /accesibilidad/i });
      expect(lastTab).toHaveAttribute('aria-selected', 'true');
    });

    it('active tab has tabIndex=0, inactive tabs have tabIndex=-1', () => {
      render(<SettingsTabs user={mockUser} />);

      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      expect(profileTab).toHaveAttribute('tabIndex', '0');

      const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
      expect(notifTab).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations in initial state', async () => {
      const { container } = render(<SettingsTabs user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations after switching tabs', async () => {
      const { container } = render(<SettingsTabs user={mockUser} />);

      // Switch to another tab
      const notifTab = screen.getByRole('tab', { name: /notificaciones/i });
      fireEvent.click(notifTab);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
