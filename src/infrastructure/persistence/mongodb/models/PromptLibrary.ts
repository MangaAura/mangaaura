import mongoose, { Schema } from 'mongoose';

export interface IPromptLibrary {
  authorId: string;
  name: string;
  prompt: string;
  style?: string;
  tags: string[];
  isPublic: boolean;
  likes: number;
  likedBy: string[];
  chapterId?: string;
  mangaId?: string;
  model?: string;
  negativePrompt?: string;
  seed?: number;
  cfgScale?: number;
  views: number;
  forks: number;
  forkedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromptLibraryDocument extends IPromptLibrary {
  _id: string;
}

const PromptLibrarySchema = new Schema<IPromptLibrary>(
  {
    authorId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    prompt: { type: String, required: true, maxlength: 2000 },
    style: String,
    tags: [{ type: String, index: true }],
    isPublic: { type: Boolean, default: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    // Referencias opcionales
    chapterId: { type: String, index: true },
    mangaId: { type: String, index: true },
    // Configuración
    model: String,
    negativePrompt: String,
    seed: Number,
    cfgScale: Number,
    // Stats
    views: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    forkedBy: [{ type: String }],
  },
  { timestamps: true }
);

// Índices
PromptLibrarySchema.index({ authorId: 1, createdAt: -1 });
PromptLibrarySchema.index({ tags: 1 });
PromptLibrarySchema.index({ isPublic: 1, likes: -1 });
PromptLibrarySchema.index({ isPublic: 1, createdAt: -1 });
PromptLibrarySchema.index({ name: 'text', prompt: 'text' }); // Para búsqueda

// Método para dar/quitar like
PromptLibrarySchema.methods.toggleLike = function(userId: string) {
  const index = this.likedBy.indexOf(userId);
  if (index === -1) {
    this.likedBy.push(userId);
  } else {
    this.likedBy.splice(index, 1);
  }
  this.likes = this.likedBy.length;
};

// Método para incrementar views
PromptLibrarySchema.methods.incrementViews = function() {
  this.views += 1;
};

// Método para fork
PromptLibrarySchema.methods.fork = function(userId: string) {
  if (!this.forkedBy.includes(userId)) {
    this.forkedBy.push(userId);
    this.forks = this.forkedBy.length;
  }
};

export const PromptLibraryModel =
  mongoose.models.PromptLibrary ||
  mongoose.model<IPromptLibrary>('PromptLibrary', PromptLibrarySchema) as mongoose.Model<IPromptLibrary, {}, {}, {}>;
