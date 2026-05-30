import type {
  IEmailRepository,
  IEmailTemplateService,
  EmailTemplate,
  EmailPreferences,
  SendEmailResult,
} from './IEmailRepository';

export type { EmailTemplate, EmailPreferences, SendEmailResult };

export interface EmailUser {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface EmailMangaSeries {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  authorName: string;
}

export interface EmailChapter {
  id: string;
  chapterNumber: number;
  title?: string | null;
}

export interface EmailTip {
  id: string;
  amount: number;
  message?: string | null;
  createdAt: Date;
}

export interface EmailAchievement {
  name: string;
  description?: string | null;
  xpReward: number;
  category?: string;
}

export class EmailService {
  private emailRepository: IEmailRepository;
  private templateService: IEmailTemplateService;

  static readonly DEFAULT_PREFERENCES: EmailPreferences = {
    welcome: true,
    newChapters: true,
    commentReplies: true,
    tips: true,
    achievements: true,
    marketing: false,
    crowdfundingUpdates: true,
    passwordReset: true,
  };

  constructor(emailRepository: IEmailRepository, templateService: IEmailTemplateService) {
    this.emailRepository = emailRepository;
    this.templateService = templateService;
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<SendEmailResult> {
    return this.emailRepository.sendEmail(to, template.subject, template.html, template.text);
  }

  async sendWelcomeEmail(user: EmailUser): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'welcome')) return;

    const template = this.templateService.renderWelcomeEmail(user.username);
    await this.emailRepository.sendEmail(user.email, template.subject, template.html, template.text);

    console.info(`[EmailService] Welcome email sent to ${user.email}`);
  }

  async sendPasswordResetEmail(user: EmailUser, resetToken: string): Promise<void> {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const template = this.templateService.renderPasswordResetEmail(user.username, resetLink);
    await this.emailRepository.sendEmail(user.email, template.subject, template.html, template.text);

    console.info(`[EmailService] Password reset email sent to ${user.email}`);
  }

  async sendNewChapterNotification(
    user: EmailUser,
    manga: EmailMangaSeries,
    chapter: EmailChapter
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'newChapters')) return;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const chapterLink = `${baseUrl}/${manga.slug}-${chapter.chapterNumber}`;

    const template = this.templateService.renderNewChapterNotification(
      user.username,
      manga.title,
      chapter.chapterNumber,
      chapterLink
    );
    await this.emailRepository.sendEmail(user.email, template.subject, template.html, template.text);

    console.info(`[EmailService] New chapter notification sent to ${user.email}`);
  }

  async sendAchievementUnlockedEmail(
    user: EmailUser,
    achievement: EmailAchievement
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'achievements')) return;

    const template = this.templateService.renderAchievementEmail(user.username, achievement.name);
    await this.emailRepository.sendEmail(user.email, template.subject, template.html, template.text);

    console.info(`[EmailService] Achievement email sent to ${user.email}`);
  }

  async sendTipReceivedEmail(
    user: EmailUser,
    tip: EmailTip,
    fromUser: EmailUser
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'tips')) return;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const link = `${baseUrl}/profile/transactions`;

    const template = this.templateService.renderTipReceivedEmail(
      user.username,
      fromUser.username,
      tip.amount,
      link
    );
    await this.emailRepository.sendEmail(user.email, template.subject, template.html, template.text);

    console.info(`[EmailService] Tip received email sent to ${user.email}`);
  }

  async sendCrowdfundingGoalReachedEmail(
    user: EmailUser,
    manga: EmailMangaSeries,
    chapter: EmailChapter
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'crowdfundingUpdates')) return;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const chapterLink = `${baseUrl}/${manga.slug}-${chapter.chapterNumber}`;

    const template = this.templateService.renderCrowdfundingGoalEmail(
      user.username,
      manga.title,
      0,
      chapterLink
    );
    await this.emailRepository.sendEmail(user.email, template.subject, template.html, template.text);

    console.info(`[EmailService] Crowdfunding goal email sent to ${user.email}`);
  }

  private async shouldSendEmail(userId: string, type: keyof EmailPreferences): Promise<boolean> {
    try {
      const preferences = await this.emailRepository.getEmailPreferences(userId);
      return preferences[type] ?? true;
    } catch (error) {
      console.error('[EmailService] Error checking email preferences:', error);
      return true;
    }
  }

  async getEmailPreferences(userId: string): Promise<EmailPreferences> {
    return this.emailRepository.getEmailPreferences(userId);
  }

  async updateEmailPreferences(
    userId: string,
    preferences: Partial<EmailPreferences>
  ): Promise<EmailPreferences> {
    return this.emailRepository.updateEmailPreferences(userId, preferences);
  }

  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    return this.emailRepository.verifyConnection();
  }
}

export default EmailService;
