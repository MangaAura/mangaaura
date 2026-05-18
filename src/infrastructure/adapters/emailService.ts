import { ResendEmailRepository } from './ResendEmailRepository';
import { EmailService } from '@/core/services/EmailService';

const emailRepository = new ResendEmailRepository();

export const emailService = new EmailService(emailRepository, emailRepository);
