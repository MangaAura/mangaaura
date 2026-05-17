import { PaymentService } from '@/core/services/PaymentService';
import { PrismaPaymentRepository } from '@/infrastructure/adapters/PrismaPaymentRepository';

const prismaPaymentRepository = new PrismaPaymentRepository();
export const paymentService = new PaymentService(prismaPaymentRepository);
