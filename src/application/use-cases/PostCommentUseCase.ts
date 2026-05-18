import { DomainError } from '../../core/errors/DomainError';
import { IAProvider } from '../../core/services/IAProvider';
import { CommentPostedEvent } from '../events/CommentPostedEvent';
import { IEventBus } from '../services/IEventBus';

export interface PostCommentInputDTO {
  userId: string;
  chapterId: string;
  content: string;
  parentId?: string;
  aiAnalysis?: {
    spoilerScore: number;
    sentiment: string;
    toxicity: number;
    categories: string[];
    analyzedAt: Date;
  };
  isHidden?: boolean;
  hiddenReason?: string;
  moderatedBy?: string;
  requiresReview?: boolean;
}

export interface PostCommentOutputDTO {
  id: string;
  chapterId: string;
  userId: string;
  content: string;
  parentId?: string;
  aiAnalysis?: {
    spoilerScore: number;
    sentiment: string;
    toxicity: number;
    categories: string[];
    analyzedAt: Date;
  };
  isHidden?: boolean;
  hiddenReason?: string;
  spoilerAnalysis: {
    containsSpoiler: boolean;
    confidence: number;
  };
  xpGained: number;
  createdAt: string;
}

export interface ICommentRepository {
  create(data: {
    userId: string;
    chapterId: string;
    content: string;
    parentId?: string;
    containsSpoiler?: boolean;
    spoilerConfidence?: number;
  } & (
    { aiAnalysis?: PostCommentInputDTO['aiAnalysis']; isHidden?: boolean; hiddenReason?: string; moderatedBy?: string; requiresReview?: boolean; likes?: number; replies?: number; likedBy?: string[] }
  )): Promise<{
    id: string;
    userId: string;
    chapterId: string;
    content: string;
    parentId?: string;
    createdAt: Date;
  }>;
  incrementReplies(commentId: string): Promise<void>;
}

export interface IUserRepositoryPort {
  findById(id: string): Promise<{
    id: string;
    xp: { amount: number };
  } | null>;
  updateXP(userId: string, amount: number): Promise<number>;
}

export interface IAchievementChecker {
  checkAchievements(userId: string): Promise<void>;
}

export class PostCommentUseCase {
  private readonly MAX_CONTENT_LENGTH = 2000;
  private readonly XP_PER_COMMENT = 5;

  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly userRepo: IUserRepositoryPort,
    private readonly eventBus: IEventBus,
    private readonly aiProvider: IAProvider,
    private readonly achievementChecker?: IAchievementChecker
  ) {}

  async execute(input: PostCommentInputDTO): Promise<PostCommentOutputDTO> {
    this.validateInput(input);

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const spoilerAnalysis = await this.analyzeSpoiler(input.content);

    const comment = await this.commentRepo.create({
      userId: input.userId,
      chapterId: input.chapterId,
      content: input.content,
      parentId: input.parentId,
      containsSpoiler: spoilerAnalysis.containsSpoiler,
      spoilerConfidence: spoilerAnalysis.confidence,
      aiAnalysis: input.aiAnalysis,
      isHidden: input.isHidden,
      hiddenReason: input.hiddenReason,
      moderatedBy: input.moderatedBy,
      requiresReview: input.requiresReview,
      likes: 0,
      replies: 0,
      likedBy: [],
    });

    let xpGained = 0;
    if (!input.isHidden && (!input.aiAnalysis || input.aiAnalysis.toxicity < 50)) {
      xpGained = this.XP_PER_COMMENT;
      await this.userRepo.updateXP(input.userId, xpGained);
    }

    await this.eventBus.publish(
      new CommentPostedEvent({
        userId: input.userId,
        chapterId: input.chapterId,
        commentId: comment.id,
        containsSpoiler: spoilerAnalysis.containsSpoiler,
        xpGained,
      })
    );

    if (input.parentId) {
      await this.commentRepo.incrementReplies(input.parentId);
    }

    if (this.achievementChecker) {
      this.achievementChecker.checkAchievements(input.userId).catch(err =>
        console.error('[PostCommentUseCase] Error checking achievements:', err)
      );
    }

    return {
      id: comment.id,
      userId: comment.userId,
      chapterId: comment.chapterId,
      content: comment.content,
      parentId: comment.parentId,
      aiAnalysis: input.aiAnalysis,
      isHidden: input.isHidden,
      hiddenReason: input.hiddenReason,
      spoilerAnalysis,
      xpGained,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  private validateInput(input: PostCommentInputDTO): void {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new ValidationError('ID de capítulo requerido');
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError('Contenido del comentario requerido');
    }

    if (input.content.length > this.MAX_CONTENT_LENGTH) {
      throw new ValidationError(
        `El contenido no puede exceder ${this.MAX_CONTENT_LENGTH} caracteres`
      );
    }

    if (input.parentId !== undefined && input.parentId.trim().length === 0) {
      throw new ValidationError('ID de comentario padre inválido');
    }
  }

  private async analyzeSpoiler(content: string): Promise<{
    containsSpoiler: boolean;
    confidence: number;
  }> {
    try {
      const analysis = await this.aiProvider.analyzeComment(content);
      return {
        containsSpoiler: analysis.spoilerScore > 50,
        confidence: analysis.spoilerScore / 100,
      };
    } catch {
      return {
        containsSpoiler: false,
        confidence: 0,
      };
    }
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}
