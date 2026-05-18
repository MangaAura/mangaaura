import { EmailService } from '@/core/services/EmailService';
import { ResendEmailRepository } from './ResendEmailRepository';

const emailRepository = new ResendEmailRepository();

export const emailService = new EmailService(emailRepository, emailRepository);
