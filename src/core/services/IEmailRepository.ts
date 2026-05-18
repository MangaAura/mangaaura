export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailPreferences {
  welcome: boolean;
  newChapters: boolean;
  commentReplies: boolean;
  tips: boolean;
  achievements: boolean;
  marketing: boolean;
  crowdfundingUpdates: boolean;
  passwordReset: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailRepository {
  sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<SendEmailResult>;
  sendTemplate(template: string, to: string, data: Record<string, unknown>): Promise<void>;
  getEmailPreferences(userId: string): Promise<EmailPreferences>;
  updateEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences>;
  verifyConnection(): Promise<{ success: boolean; message: string }>;
}

export interface IEmailTemplateService {
  renderWelcomeEmail(username: string): EmailTemplate;
  renderPasswordResetEmail(username: string, resetLink: string): EmailTemplate;
  renderNewChapterNotification(username: string, mangaTitle: string, chapterNumber: number, link: string): EmailTemplate;
  renderAchievementEmail(username: string, achievementName: string): EmailTemplate;
  renderTipReceivedEmail(username: string, senderName: string, amount: number, link: string): EmailTemplate;
  renderCrowdfundingGoalEmail(username: string, mangaTitle: string, goal: number, link: string): EmailTemplate;
  renderCommentReplyEmail(username: string, replierName: string, chapterTitle: string, link: string): EmailTemplate;
}
