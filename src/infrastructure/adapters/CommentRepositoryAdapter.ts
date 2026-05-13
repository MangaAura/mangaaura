import dbConnect from '@/lib/mongoose';
import { CommentModel } from '@/infrastructure/persistence/mongodb/models/Comment';
import { ICommentRepository } from '../../application/use-cases/PostCommentUseCase';

export class CommentRepositoryAdapter implements ICommentRepository {
  async create(data: Parameters<ICommentRepository['create']>[0]): Promise<Awaited<ReturnType<ICommentRepository['create']>>> {
    await dbConnect();
    const doc = await CommentModel.create({
      chapterId: data.chapterId,
      userId: data.userId,
      parentId: data.parentId || undefined,
      content: data.content,
      aiAnalysis: (data as any).aiAnalysis,
      isHidden: (data as any).isHidden ?? false,
      hiddenReason: (data as any).hiddenReason,
      moderatedBy: (data as any).moderatedBy,
      requiresReview: (data as any).requiresReview ?? false,
      containsSpoiler: data.containsSpoiler,
      spoilerConfidence: data.spoilerConfidence,
      likes: (data as any).likes ?? 0,
      replies: (data as any).replies ?? 0,
      likedBy: (data as any).likedBy ?? [],
    });
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      chapterId: doc.chapterId,
      content: doc.content,
      parentId: doc.parentId || undefined,
      createdAt: doc.createdAt,
    };
  }

  async incrementReplies(commentId: string): Promise<void> {
    await dbConnect();
    await CommentModel.findByIdAndUpdate(commentId, { $inc: { replies: 1 } });
  }
}
