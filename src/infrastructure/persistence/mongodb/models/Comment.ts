import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  chapterId: string;
  userId: string;
  parentId?: string; // Para threads
  content: string;
  // Análisis IA
  aiAnalysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    spoilerScore: number; // 0-100
    toxicity: number; // 0-100
    categories: string[];
    analyzedAt: Date;
  };
  // Engagement
  likes: number;
  isHidden: boolean;
  hiddenReason?: string;
  moderatedBy?: 'ai' | 'human';
  requiresReview: boolean;
  replies: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    chapterId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    parentId: { type: String, index: true },
    content: { type: String, required: true, maxlength: 2000 },
    aiAnalysis: {
      sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral',
      },
      spoilerScore: { type: Number, default: 0, min: 0, max: 100 },
      toxicity: { type: Number, default: 0, min: 0, max: 100 },
      categories: [{ type: String }],
      analyzedAt: Date,
    },
    likes: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    hiddenReason: String,
    moderatedBy: { type: String, enum: ['ai', 'human'] },
    requiresReview: { type: Boolean, default: false, index: true },
    replies: { type: Number, default: 0 },
    likedBy: [{ type: String }],
  },
  { timestamps: true }
);

// Índices
CommentSchema.index({ chapterId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ 'aiAnalysis.spoilerScore': 1 });
CommentSchema.index({ 'aiAnalysis.toxicity': 1 });
CommentSchema.index({ isHidden: 1 });

// Método para dar like
CommentSchema.methods.toggleLike = function(userId: string) {
  const index = this.likedBy.indexOf(userId);
  if (index === -1) {
    this.likedBy.push(userId);
    this.likes = this.likedBy.length;
  } else {
    this.likedBy.splice(index, 1);
    this.likes = this.likedBy.length;
  }
};

export const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
