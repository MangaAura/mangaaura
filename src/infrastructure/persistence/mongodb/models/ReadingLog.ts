import mongoose, { Schema, Document } from 'mongoose';

export interface IReadingLog extends Document {
  userId: string;
  chapterId: string;
  mangaId: string;
  events: Array<{
    type: 'scroll' | 'page_view' | 'completion';
    timestamp: Date;
    data: {
      pageNumber?: number;
      scrollDepth?: number;
      duration?: number;
    };
  }>;
  totalTimeSeconds: number;
  pagesViewed: number[]; // Array de números de páginas vistas
  completed: boolean;
  completedAt?: Date;
  readingSpeed: number; // páginas por minuto
  createdAt: Date;
  updatedAt: Date;
}

const ReadingLogSchema = new Schema<IReadingLog>(
  {
    userId: { type: String, required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    mangaId: { type: String, required: true, index: true },
    events: [
      {
        type: {
          type: String,
          enum: ['scroll', 'page_view', 'completion'],
          required: true,
        },
        timestamp: { type: Date, required: true },
        data: {
          pageNumber: Number,
          scrollDepth: Number,
          duration: Number,
        },
      },
    ],
    totalTimeSeconds: { type: Number, default: 0 },
    pagesViewed: { type: [Number], default: [] },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    readingSpeed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Índices para queries comunes
ReadingLogSchema.index({ userId: 1, mangaId: 1 });
ReadingLogSchema.index({ userId: 1, completedAt: -1 });
ReadingLogSchema.index({ chapterId: 1, completed: 1 });

// Método para obtener el número de páginas únicas vistas
ReadingLogSchema.virtual('uniquePagesViewed').get(function() {
  return new Set(this.pagesViewed).size;
});

// Método para agregar una página vista
ReadingLogSchema.methods.addPageView = function(pageNumber: number) {
  if (!this.pagesViewed.includes(pageNumber)) {
    this.pagesViewed.push(pageNumber);
  }
};

export const ReadingLogModel =
  mongoose.models.ReadingLog ||
  mongoose.model<IReadingLog>('ReadingLog', ReadingLogSchema);
