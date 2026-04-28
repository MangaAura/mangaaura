import mongoose, { Schema, Document } from 'mongoose';

export interface IQualityReport extends Document {
  chapterId: string;
  reportedBy: string; // userId del reportante
  issueType: 'QUALITY' | 'ERROR' | 'SPOILER' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolvedBy?: string; // userId del que resuelve
  resolvedAt?: Date;
  resolution?: string;
  // Campos opcionales para ubicación específica
  pageNumber?: number;
  panelNumber?: number;
  // Metadata IA
  aiDetected?: boolean;
  aiConfidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QualityReportSchema = new Schema<IQualityReport>(
  {
    chapterId: { type: String, required: true, index: true },
    reportedBy: { type: String, required: true, index: true },
    issueType: {
      type: String,
      enum: ['QUALITY', 'ERROR', 'SPOILER', 'OTHER'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    description: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['PENDING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
    },
    resolvedBy: String,
    resolvedAt: Date,
    resolution: String,
    // Opcional
    pageNumber: Number,
    panelNumber: Number,
    aiDetected: { type: Boolean, default: false },
    aiConfidence: Number,
  },
  { timestamps: true }
);

// Índices
QualityReportSchema.index({ chapterId: 1, status: 1 });
QualityReportSchema.index({ reportedBy: 1, createdAt: -1 });
QualityReportSchema.index({ severity: 1, status: 1 });
QualityReportSchema.index({ createdAt: -1 });

// Método para resolver reporte
QualityReportSchema.methods.resolve = function(resolvedBy: string, resolution: string) {
  this.status = 'RESOLVED';
  this.resolvedBy = resolvedBy;
  this.resolution = resolution;
  this.resolvedAt = new Date();
};

// Método para descartar reporte
QualityReportSchema.methods.dismiss = function(resolvedBy: string, reason: string) {
  this.status = 'DISMISSED';
  this.resolvedBy = resolvedBy;
  this.resolution = reason;
  this.resolvedAt = new Date();
};

export const QualityReportModel =
  mongoose.models.QualityReport ||
  mongoose.model<IQualityReport>('QualityReport', QualityReportSchema);
