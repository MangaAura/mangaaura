import { DomainError } from '../../../core/errors/DomainError';

export interface TransactionRecord {
  id: string;
  amount: number;
  type: string;
  description: string;
  referenceId: string | null;
  timestamp: Date;
}

export interface ITransactionQueryRepository {
  findByUserId(
    userId: string,
    options: { skip: number; take: number; type?: string }
  ): Promise<TransactionRecord[]>;
  countByUserId(userId: string, type?: string): Promise<number>;
  getBalance(userId: string): Promise<number>;
}

export interface ListTransactionsInput {
  userId: string;
  page?: number;
  limit?: number;
  type?: string;
}

export interface ListTransactionsOutput {
  transactions: TransactionRecord[];
  balance: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ListTransactionsUseCase {
  constructor(
    private readonly transactionRepo: ITransactionQueryRepository
  ) {}

  async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    const [transactions, total, balance] = await Promise.all([
      this.transactionRepo.findByUserId(input.userId, {
        skip,
        take: limit,
        type: input.type,
      }),
      this.transactionRepo.countByUserId(input.userId, input.type),
      this.transactionRepo.getBalance(input.userId),
    ]);

    return {
      transactions,
      balance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
