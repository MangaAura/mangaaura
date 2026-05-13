import { Comment } from '../entities/Comment';

export interface CommentFilters {
  chapterId?: string;
  parentId?: string;
  page?: number;
  limit?: number;
}

export interface CommentRepository {
  findById(id: string): Promise<Comment | null>;
  findByChapterId(chapterId: string, filters?: Omit<CommentFilters, 'chapterId'>): Promise<Comment[]>;
  findByParentId(parentId: string): Promise<Comment[]>;
  save(comment: Comment): Promise<void>;
  delete(id: string): Promise<void>;
  countByChapterId(chapterId: string): Promise<number>;
}