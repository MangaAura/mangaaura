/**
 * MongoDB Models Index
 *
 * Re-exporta todos los modelos MongoDB desde la infraestructura
 * para mantener compatibilidad con código existente.
 */

export {
  // Modelos
  ReadingLogModel,
  CommentModel,
  QualityReportModel,
  PromptLibraryModel,
  // Interfaces
  type IReadingLog,
  type IComment,
  type IQualityReport,
  type IPromptLibrary,
  // Alias para compatibilidad
  ReadingLogModel as ReadingLog,
  CommentModel as Comment,
  QualityReportModel as QualityReport,
  PromptLibraryModel as PromptLibrary,
} from '@/infrastructure/persistence/mongodb/models';
