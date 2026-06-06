const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
const esPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'es.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Helper to deep merge an object path
function ensurePath(obj, keyPath, defaultValue) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  const lastKey = keys[keys.length - 1];
  if (!current[lastKey]) {
    current[lastKey] = defaultValue;
  }
}

// === NEWS CATEGORIES ===
// Already exist as admin.pages.newsForm.categoryLabels.*
// We'll add them under admin.newsForm for the CATEGORIES constant
ensurePath(en, 'admin.newsForm.categoryLabels.platform', 'Platform');
ensurePath(en, 'admin.newsForm.categoryLabels.community', 'Community');
ensurePath(en, 'admin.newsForm.categoryLabels.tools', 'Tools');
ensurePath(en, 'admin.newsForm.categoryLabels.mobile', 'Mobile');
ensurePath(en, 'admin.newsForm.categoryLabels.contest', 'Contest');

ensurePath(es, 'admin.newsForm.categoryLabels.platform', 'Plataforma');
ensurePath(es, 'admin.newsForm.categoryLabels.community', 'Comunidad');
ensurePath(es, 'admin.newsForm.categoryLabels.tools', 'Herramientas');
ensurePath(es, 'admin.newsForm.categoryLabels.mobile', 'Móvil');
ensurePath(es, 'admin.newsForm.categoryLabels.contest', 'Concurso');

// === NEWS FORM FIELD LABELS ===
ensurePath(en, 'admin.newsForm.fieldLabels.title', 'Title');
ensurePath(en, 'admin.newsForm.fieldLabels.slug', 'Slug (URL)');
ensurePath(en, 'admin.newsForm.fieldLabels.excerpt', 'Excerpt');
ensurePath(en, 'admin.newsForm.fieldLabels.content', 'Content');
ensurePath(en, 'admin.newsForm.fieldLabels.category', 'Category');
ensurePath(en, 'admin.newsForm.fieldLabels.publish', 'Publish');
ensurePath(en, 'admin.newsForm.fieldLabels.schedule', 'Schedule publication (optional)');
ensurePath(en, 'admin.newsForm.fieldLabels.featured', 'Feature on homepage');
ensurePath(en, 'admin.newsForm.fieldLabels.cover', 'Cover image');
ensurePath(en, 'admin.newsForm.fieldLabels.titleEn', 'Title (English)');
ensurePath(en, 'admin.newsForm.fieldLabels.excerptEn', 'Excerpt (English)');
ensurePath(en, 'admin.newsForm.fieldLabels.contentEn', 'Content (English)');

ensurePath(es, 'admin.newsForm.fieldLabels.title', 'Título');
ensurePath(es, 'admin.newsForm.fieldLabels.slug', 'Slug (URL)');
ensurePath(es, 'admin.newsForm.fieldLabels.excerpt', 'Extracto');
ensurePath(es, 'admin.newsForm.fieldLabels.content', 'Contenido');
ensurePath(es, 'admin.newsForm.fieldLabels.category', 'Categoría');
ensurePath(es, 'admin.newsForm.fieldLabels.publish', 'Publicar');
ensurePath(es, 'admin.newsForm.fieldLabels.schedule', 'Programar publicación (opcional)');
ensurePath(es, 'admin.newsForm.fieldLabels.featured', 'Destacar en la homepage');
ensurePath(es, 'admin.newsForm.fieldLabels.cover', 'Imagen de portada');
ensurePath(es, 'admin.newsForm.fieldLabels.titleEn', 'Título (Inglés)');
ensurePath(es, 'admin.newsForm.fieldLabels.excerptEn', 'Extracto (Inglés)');
ensurePath(es, 'admin.newsForm.fieldLabels.contentEn', 'Contenido (Inglés)');

// === NEWS FORM PLACEHOLDERS ===
ensurePath(en, 'admin.newsForm.placeholders.title', 'News title');
ensurePath(en, 'admin.newsForm.placeholders.slug', 'my-news-slug');
ensurePath(en, 'admin.newsForm.placeholders.excerpt', 'Brief description for the news list');
ensurePath(en, 'admin.newsForm.placeholders.content', 'Write the news content...');
ensurePath(en, 'admin.newsForm.placeholders.titleEn', 'News title in English');
ensurePath(en, 'admin.newsForm.placeholders.excerptEn', 'Brief description in English');
ensurePath(en, 'admin.newsForm.placeholders.contentEn', 'Write the news content in English...');
ensurePath(en, 'admin.newsForm.placeholders.coverUrl', 'or paste a URL...');

ensurePath(es, 'admin.newsForm.placeholders.title', 'Título de la noticia');
ensurePath(es, 'admin.newsForm.placeholders.slug', 'mi-noticia');
ensurePath(es, 'admin.newsForm.placeholders.excerpt', 'Breve descripción que aparecerá en la lista de noticias');
ensurePath(es, 'admin.newsForm.placeholders.content', 'Escribe el contenido de la noticia...');
ensurePath(es, 'admin.newsForm.placeholders.titleEn', 'Título de la noticia en inglés');
ensurePath(es, 'admin.newsForm.placeholders.excerptEn', 'Breve descripción en inglés');
ensurePath(es, 'admin.newsForm.placeholders.contentEn', 'Escribe el contenido en inglés...');
ensurePath(es, 'admin.newsForm.placeholders.coverUrl', 'o pega una URL...');

// === NEWS FORM HINTS ===
ensurePath(en, 'admin.newsForm.hints.slugAuto', 'Only lowercase letters, numbers, and hyphens. Generated automatically from the title.');
ensurePath(en, 'admin.newsForm.hints.richEditor', 'Use the editor for formatting. Ctrl+S to save.');
ensurePath(en, 'admin.newsForm.hints.contentEnOptional', 'Optional. If not provided, auto-translation will be used.');
ensurePath(en, 'admin.newsForm.hints.coverImage', 'Drag an image or click to upload');
ensurePath(en, 'admin.newsForm.hints.coverFormats', 'JPEG, PNG, WebP · Max 10MB · Will be cropped to 16:9 automatically');
ensurePath(en, 'admin.newsForm.hints.uploading', 'Uploading cropped image...');
ensurePath(en, 'admin.newsForm.hints.changeImage', 'Change');
ensurePath(en, 'admin.newsForm.hints.removeImage', 'Remove');
ensurePath(en, 'admin.newsForm.hints.visibleForAll', 'Visible to everyone');
ensurePath(en, 'admin.newsForm.hints.adminOnly', 'Only visible in admin');
ensurePath(en, 'admin.newsForm.hints.scheduleInfo', 'Will be published automatically on');
ensurePath(en, 'admin.newsForm.hints.scheduleWarning', 'Scheduled publishing will not apply if marked as "Published". Uncheck the option to use scheduling.');
ensurePath(en, 'admin.newsForm.hints.featuredDesc', 'Will appear featured on the home page with a special indicator');
ensurePath(en, 'admin.newsForm.hints.notFeaturedDesc', 'Will appear in the normal news section');

ensurePath(es, 'admin.newsForm.hints.slugAuto', 'Solo letras minúsculas, números y guiones. Se genera automáticamente desde el título.');
ensurePath(es, 'admin.newsForm.hints.richEditor', 'Usa el editor para dar formato. Ctrl+S para guardar.');
ensurePath(es, 'admin.newsForm.hints.contentEnOptional', 'Opcional. Si no se proporciona, se usará la traducción automática.');
ensurePath(es, 'admin.newsForm.hints.coverImage', 'Arrastra una imagen o haz clic para subir');
ensurePath(es, 'admin.newsForm.hints.coverFormats', 'JPEG, PNG, WebP · Max 10MB · Se recortará a 16:9 automáticamente');
ensurePath(es, 'admin.newsForm.hints.uploading', 'Subiendo imagen recortada...');
ensurePath(es, 'admin.newsForm.hints.changeImage', 'Cambiar');
ensurePath(es, 'admin.newsForm.hints.removeImage', 'Quitar');
ensurePath(es, 'admin.newsForm.hints.visibleForAll', 'Visible para todos');
ensurePath(es, 'admin.newsForm.hints.adminOnly', 'Solo visible en admin');
ensurePath(es, 'admin.newsForm.hints.scheduleInfo', 'Se publicará automáticamente el');
ensurePath(es, 'admin.newsForm.hints.scheduleWarning', 'La publicación programada no se aplicará si está marcada como "Publicada". Desmarca la opción para usar la programación.');
ensurePath(es, 'admin.newsForm.hints.featuredDesc', 'Aparecerá destacada en la página principal con un indicador especial');
ensurePath(es, 'admin.newsForm.hints.notFeaturedDesc', 'Aparecerá en la sección de noticias normal');

// === NEWS FORM MISC ===
ensurePath(en, 'admin.newsForm.spanish', 'Español');
ensurePath(en, 'admin.newsForm.english', 'English');
ensurePath(en, 'admin.newsForm.expand', 'Expand');
ensurePath(en, 'admin.newsForm.upload', 'Upload');
ensurePath(en, 'admin.newsForm.url', 'URL');
ensurePath(en, 'admin.newsForm.noTitle', '(no title)');
ensurePath(en, 'admin.newsForm.noTitlePlaceholder', 'News title');
ensurePath(en, 'admin.newsForm.noExcerptPlaceholder', 'News excerpt...');
ensurePath(en, 'admin.newsForm.writeContentPreview', 'Write the content to see the preview');
ensurePath(en, 'admin.newsForm.uploadError', 'Upload error');
ensurePath(en, 'admin.newsForm.cropTitle', 'Adjust cover');
ensurePath(en, 'admin.newsForm.cropSubtitle', 'Drag to frame · 16:9 ratio');
ensurePath(en, 'admin.newsForm.switchToUpload', 'Switch to file upload');
ensurePath(en, 'admin.newsForm.switchToUrl', 'Switch to URL');
ensurePath(en, 'admin.newsForm.coverAlt', 'Cover preview');
ensurePath(en, 'admin.newsForm.removeSchedule', 'Remove schedule');
ensurePath(en, 'admin.newsForm.previewView', 'Preview');
ensurePath(en, 'admin.newsForm.editView', 'Edit');

ensurePath(es, 'admin.newsForm.spanish', 'Español');
ensurePath(es, 'admin.newsForm.english', 'English');
ensurePath(es, 'admin.newsForm.expand', 'Expandir');
ensurePath(es, 'admin.newsForm.upload', 'Subir');
ensurePath(es, 'admin.newsForm.url', 'URL');
ensurePath(es, 'admin.newsForm.noTitle', '(sin título)');
ensurePath(es, 'admin.newsForm.noTitlePlaceholder', 'Título de la noticia');
ensurePath(es, 'admin.newsForm.noExcerptPlaceholder', 'Extracto de la noticia...');
ensurePath(es, 'admin.newsForm.writeContentPreview', 'Escribe el contenido para ver la vista previa');
ensurePath(es, 'admin.newsForm.uploadError', 'Error al subir');
ensurePath(es, 'admin.newsForm.cropTitle', 'Ajustar portada');
ensurePath(es, 'admin.newsForm.cropSubtitle', 'Arrastra para encuadrar · Ratio 16:9');
ensurePath(es, 'admin.newsForm.switchToUpload', 'Cambiar a subir archivo');
ensurePath(es, 'admin.newsForm.switchToUrl', 'Cambiar a URL');
ensurePath(es, 'admin.newsForm.coverAlt', 'Vista previa de portada');
ensurePath(es, 'admin.newsForm.removeSchedule', 'Eliminar programación');
ensurePath(es, 'admin.newsForm.previewView', 'Vista previa');
ensurePath(es, 'admin.newsForm.editView', 'Editar');

// === AI DASHBOARD KEYS ===
ensurePath(en, 'admin.aiDashboard.title', 'AI Service Dashboard');
ensurePath(en, 'admin.aiDashboard.subtitle', 'Monitor AI service health, performance, and queue metrics');
ensurePath(en, 'admin.aiDashboard.refresh', 'Refresh');
ensurePath(en, 'admin.aiDashboard.updated', 'Updated');
ensurePath(en, 'admin.aiDashboard.activeAlerts', 'Active Alerts');
ensurePath(en, 'admin.aiDashboard.hideAlerts', 'Hide alerts');
ensurePath(en, 'admin.aiDashboard.showAlerts', 'Show {count} alert');
ensurePath(en, 'admin.aiDashboard.showAlerts_plural', 'Show {count} alerts');
ensurePath(en, 'admin.aiDashboard.componentStatus', 'Component Status');
ensurePath(en, 'admin.aiDashboard.models', 'Models');
ensurePath(en, 'admin.aiDashboard.queueStats', 'Queue Statistics');
ensurePath(en, 'admin.aiDashboard.jobsByPriority', 'Jobs by Priority');
ensurePath(en, 'admin.aiDashboard.jobsByType', 'Jobs by Type');
ensurePath(en, 'admin.aiDashboard.autoRefreshInfo', 'Data refreshes every 2 seconds automatically');

ensurePath(es, 'admin.aiDashboard.title', 'Panel de Servicios de IA');
ensurePath(es, 'admin.aiDashboard.subtitle', 'Monitorea el estado, rendimiento y métricas de cola de los servicios de IA');
ensurePath(es, 'admin.aiDashboard.refresh', 'Actualizar');
ensurePath(es, 'admin.aiDashboard.updated', 'Actualizado');
ensurePath(es, 'admin.aiDashboard.activeAlerts', 'Alertas Activas');
ensurePath(es, 'admin.aiDashboard.hideAlerts', 'Ocultar alertas');
ensurePath(es, 'admin.aiDashboard.showAlerts', 'Mostrar {count} alerta');
ensurePath(es, 'admin.aiDashboard.showAlerts_plural', 'Mostrar {count} alertas');
ensurePath(es, 'admin.aiDashboard.componentStatus', 'Estado de Componentes');
ensurePath(es, 'admin.aiDashboard.models', 'Modelos');
ensurePath(es, 'admin.aiDashboard.queueStats', 'Estadísticas de Cola');
ensurePath(es, 'admin.aiDashboard.jobsByPriority', 'Trabajos por Prioridad');
ensurePath(es, 'admin.aiDashboard.jobsByType', 'Trabajos por Tipo');
ensurePath(es, 'admin.aiDashboard.autoRefreshInfo', 'Los datos se actualizan cada 2 segundos automáticamente');

// === AI DASHBOARD METRIC CARDS ===
ensurePath(en, 'admin.aiDashboard.metrics.totalJobs', 'Total Jobs');
ensurePath(en, 'admin.aiDashboard.metrics.totalJobsSubtitle', 'All time processed');
ensurePath(en, 'admin.aiDashboard.metrics.completedJobs', 'Completed Jobs');
ensurePath(en, 'admin.aiDashboard.metrics.completedJobsSubtitle', '{rate}% success rate');
ensurePath(en, 'admin.aiDashboard.metrics.failedJobs', 'Failed Jobs');
ensurePath(en, 'admin.aiDashboard.metrics.failedJobsSubtitle', '{rate}% error rate');
ensurePath(en, 'admin.aiDashboard.metrics.queueDepth', 'Queue Depth');
ensurePath(en, 'admin.aiDashboard.metrics.queueDepthSubtitle', '{count} currently processing');
ensurePath(en, 'admin.aiDashboard.metrics.throughput', 'Throughput');
ensurePath(en, 'admin.aiDashboard.metrics.throughputSubtitle', 'Jobs per minute');
ensurePath(en, 'admin.aiDashboard.metrics.avgLatency', 'Avg Latency');
ensurePath(en, 'admin.aiDashboard.metrics.avgLatencySubtitle', 'Response time');
ensurePath(en, 'admin.aiDashboard.metrics.healthyModels', 'Healthy Models');
ensurePath(en, 'admin.aiDashboard.metrics.healthyModelsSubtitle', 'of {total} registered');
ensurePath(en, 'admin.aiDashboard.metrics.degradedUnhealthy', 'Degraded/Unhealthy');
ensurePath(en, 'admin.aiDashboard.metrics.degradedUnhealthySubtitle', '{degraded} degraded, {unhealthy} unhealthy');

ensurePath(es, 'admin.aiDashboard.metrics.totalJobs', 'Trabajos Totales');
ensurePath(es, 'admin.aiDashboard.metrics.totalJobsSubtitle', 'Procesados históricamente');
ensurePath(es, 'admin.aiDashboard.metrics.completedJobs', 'Trabajos Completados');
ensurePath(es, 'admin.aiDashboard.metrics.completedJobsSubtitle', '{rate}% tasa de éxito');
ensurePath(es, 'admin.aiDashboard.metrics.failedJobs', 'Trabajos Fallidos');
ensurePath(es, 'admin.aiDashboard.metrics.failedJobsSubtitle', '{rate}% tasa de error');
ensurePath(es, 'admin.aiDashboard.metrics.queueDepth', 'Profundidad de Cola');
ensurePath(es, 'admin.aiDashboard.metrics.queueDepthSubtitle', '{count} procesando ahora');
ensurePath(es, 'admin.aiDashboard.metrics.throughput', 'Rendimiento');
ensurePath(es, 'admin.aiDashboard.metrics.throughputSubtitle', 'Trabajos por minuto');
ensurePath(es, 'admin.aiDashboard.metrics.avgLatency', 'Latencia Prom.'),
ensurePath(es, 'admin.aiDashboard.metrics.avgLatencySubtitle', 'Tiempo de respuesta');
ensurePath(es, 'admin.aiDashboard.metrics.healthyModels', 'Modelos Saludables');
ensurePath(es, 'admin.aiDashboard.metrics.healthyModelsSubtitle', 'de {total} registrados');
ensurePath(es, 'admin.aiDashboard.metrics.degradedUnhealthy', 'Degradado/No Saludable');
ensurePath(es, 'admin.aiDashboard.metrics.degradedUnhealthySubtitle', '{degraded} degradados, {unhealthy} no saludables');

// === AI DASHBOARD COMPONENTS ===
ensurePath(en, 'admin.aiDashboard.components.jobQueue', 'Job Queue');
ensurePath(en, 'admin.aiDashboard.components.workerPool', 'Worker Pool');
ensurePath(en, 'admin.aiDashboard.components.inferenceEngine', 'Inference Engine');
ensurePath(en, 'admin.aiDashboard.components.modelRegistry', 'Model Registry');

ensurePath(es, 'admin.aiDashboard.components.jobQueue', 'Cola de Trabajos');
ensurePath(es, 'admin.aiDashboard.components.workerPool', 'Pool de Workers');
ensurePath(es, 'admin.aiDashboard.components.inferenceEngine', 'Motor de Inferencia');
ensurePath(es, 'admin.aiDashboard.components.modelRegistry', 'Registro de Modelos');

// === AI DASHBOARD TABLE ===
ensurePath(en, 'admin.aiDashboard.table.model', 'Model');
ensurePath(en, 'admin.aiDashboard.table.status', 'Status');
ensurePath(en, 'admin.aiDashboard.table.successFailed', 'Success/Failed');
ensurePath(en, 'admin.aiDashboard.table.latency', 'Latency');
ensurePath(en, 'admin.aiDashboard.table.noModels', 'No models registered');
ensurePath(en, 'admin.aiDashboard.table.registered', '{count} registered');
ensurePath(en, 'admin.aiDashboard.table.successRate', '{rate}% success');

ensurePath(es, 'admin.aiDashboard.table.model', 'Modelo');
ensurePath(es, 'admin.aiDashboard.table.status', 'Estado');
ensurePath(es, 'admin.aiDashboard.table.successFailed', 'Éxito/Fallo');
ensurePath(es, 'admin.aiDashboard.table.latency', 'Latencia');
ensurePath(es, 'admin.aiDashboard.table.noModels', 'No hay modelos registrados');
ensurePath(es, 'admin.aiDashboard.table.registered', '{count} registrados');
ensurePath(es, 'admin.aiDashboard.table.successRate', '{rate}% éxito');

// === AI DASHBOARD STATUS ===
ensurePath(en, 'admin.aiDashboard.status.healthy', 'Healthy');
ensurePath(en, 'admin.aiDashboard.status.degraded', 'Degraded');
ensurePath(en, 'admin.aiDashboard.status.unhealthy', 'Unhealthy');
ensurePath(en, 'admin.aiDashboard.status.operational', 'Operational');
ensurePath(en, 'admin.aiDashboard.status.notAvailable', 'Not available');
ensurePath(en, 'admin.aiDashboard.status.pending', 'Pending');
ensurePath(en, 'admin.aiDashboard.status.processing', 'Processing');
ensurePath(en, 'admin.aiDashboard.status.completed', 'Completed');
ensurePath(en, 'admin.aiDashboard.status.failedJobs', 'Failed Jobs');
ensurePath(en, 'admin.aiDashboard.status.avgWaitTime', 'Avg Wait Time');
ensurePath(en, 'admin.aiDashboard.status.na', 'N/A');
ensurePath(en, 'admin.aiDashboard.status.last', 'Last');
ensurePath(en, 'admin.aiDashboard.status.noJobs', 'No jobs in queue');

ensurePath(es, 'admin.aiDashboard.status.healthy', 'Saludable');
ensurePath(es, 'admin.aiDashboard.status.degraded', 'Degradado');
ensurePath(es, 'admin.aiDashboard.status.unhealthy', 'No Saludable');
ensurePath(es, 'admin.aiDashboard.status.operational', 'Operativo');
ensurePath(es, 'admin.aiDashboard.status.notAvailable', 'No disponible');
ensurePath(es, 'admin.aiDashboard.status.pending', 'Pendientes');
ensurePath(es, 'admin.aiDashboard.status.processing', 'Procesando');
ensurePath(es, 'admin.aiDashboard.status.completed', 'Completados');
ensurePath(es, 'admin.aiDashboard.status.failedJobs', 'Trabajos Fallidos');
ensurePath(es, 'admin.aiDashboard.status.avgWaitTime', 'Tiempo Esp. Prom.');
ensurePath(es, 'admin.aiDashboard.status.na', 'N/A');
ensurePath(es, 'admin.aiDashboard.status.last', 'Último');
ensurePath(es, 'admin.aiDashboard.status.noJobs', 'No hay trabajos en cola');

// === AI DASHBOARD PRIORITY LABELS ===
ensurePath(en, 'admin.aiDashboard.priority.critical', 'Critical');
ensurePath(en, 'admin.aiDashboard.priority.high', 'High');
ensurePath(en, 'admin.aiDashboard.priority.normal', 'Normal');
ensurePath(en, 'admin.aiDashboard.priority.low', 'Low');
ensurePath(en, 'admin.aiDashboard.priority.background', 'Background');

ensurePath(es, 'admin.aiDashboard.priority.critical', 'Crítico');
ensurePath(es, 'admin.aiDashboard.priority.high', 'Alta');
ensurePath(es, 'admin.aiDashboard.priority.normal', 'Normal');
ensurePath(es, 'admin.aiDashboard.priority.low', 'Baja');
ensurePath(es, 'admin.aiDashboard.priority.background', 'Fondo');

// === CONTACT STATUS LABELS (for display in badges) ===
// Already has admin.pages.contact.statuses.* — we'll reuse those

// === SPECIFIC ERROR PAGES ===
const errorPages = {
  'achievementsPage': { en: { title: 'Error Loading Achievements', message: 'Could not load achievements.' }, es: { title: 'Error al cargar logros', message: 'No se pudieron cargar los logros.' } },
  'chaptersPage': { en: { title: 'Error Loading Chapters', message: 'Could not load chapters.' }, es: { title: 'Error al cargar capítulos', message: 'No se pudieron cargar los capítulos.' } },
  'clansPage': { en: { title: 'Error Loading Clans', message: 'Could not load clans.' }, es: { title: 'Error al cargar clanes', message: 'No se pudieron cargar los clanes.' } },
  'commentsPage': { en: { title: 'Error Loading Comments', message: 'Could not load comments.' }, es: { title: 'Error al cargar comentarios', message: 'No se pudieron cargar los comentarios.' } },
  'crowdfundingPage': { en: { title: 'Error Loading Crowdfunding', message: 'Could not load crowdfunding data.' }, es: { title: 'Error al cargar crowdfunding', message: 'No se pudieron cargar los datos de crowdfunding.' } },
  'dmcaPage': { en: { title: 'Error Loading DMCA', message: 'Could not load DMCA requests.' }, es: { title: 'Error al cargar DMCA', message: 'No se pudieron cargar las solicitudes DMCA.' } },
  'forumPage': { en: { title: 'Error Loading Forum', message: 'Could not load forum threads.' }, es: { title: 'Error al cargar foro', message: 'No se pudieron cargar los hilos del foro.' } },
  'kycPage': { en: { title: 'Error Loading KYC', message: 'Could not load KYC verifications.' }, es: { title: 'Error al cargar KYC', message: 'No se pudieron cargar las verificaciones KYC.' } },
  'rolesPage': { en: { title: 'Error Loading Roles', message: 'Could not load roles.' }, es: { title: 'Error al cargar roles', message: 'No se pudieron cargar los roles.' } },
  'subscriptionsPage': { en: { title: 'Error Loading Subscriptions', message: 'Could not load subscriptions.' }, es: { title: 'Error al cargar suscripciones', message: 'No se pudieron cargar las suscripciones.' } },
};

for (const [key, val] of Object.entries(errorPages)) {
  ensurePath(en, `admin.errorPages.${key}.title`, val.en.title);
  ensurePath(en, `admin.errorPages.${key}.message`, val.en.message);
  ensurePath(es, `admin.errorPages.${key}.title`, val.es.title);
  ensurePath(es, `admin.errorPages.${key}.message`, val.es.message);
}

// === ADMIN COMMON CONTACT KEYS ===
ensurePath(en, 'admin.contactStatus.markRead', 'Mark as read');
ensurePath(en, 'admin.contactStatus.close', 'Close without reply');
ensurePath(en, 'admin.contactStatus.markReadShort', 'Mark read');
ensurePath(en, 'admin.contactStatus.closeShort', 'Close');
ensurePath(en, 'admin.contactStatus.statusUpdated', 'Status updated');
ensurePath(en, 'admin.contactStatus.updateFailed', 'Failed to update message status');
ensurePath(en, 'admin.contactStatus.markedAs', 'Message marked as {status}.');

ensurePath(es, 'admin.contactStatus.markRead', 'Marcar como leído');
ensurePath(es, 'admin.contactStatus.close', 'Cerrar sin responder');
ensurePath(es, 'admin.contactStatus.markReadShort', 'Marcar leído');
ensurePath(es, 'admin.contactStatus.closeShort', 'Cerrar');
ensurePath(es, 'admin.contactStatus.statusUpdated', 'Estado actualizado');
ensurePath(es, 'admin.contactStatus.updateFailed', 'Error al actualizar estado del mensaje');
ensurePath(es, 'admin.contactStatus.markedAs', 'Mensaje marcado como {status}.');

// === ADMIN COMMON MISC ===
ensurePath(en, 'admin.common.theme', 'Theme');
ensurePath(en, 'admin.common.markRead', 'Mark read');
ensurePath(en, 'admin.common.close', 'Close');
ensurePath(en, 'admin.common.cancel', 'Cancel');
ensurePath(en, 'admin.common.save', 'Save');
ensurePath(en, 'admin.common.delete', 'Delete');
ensurePath(en, 'admin.common.edit', 'Edit');
ensurePath(en, 'admin.common.retry', 'Retry');
ensurePath(en, 'admin.common.byAuthor', 'by');
ensurePath(en, 'admin.common.covers', 'Has cover');
ensurePath(en, 'admin.common.created', 'Created');
ensurePath(en, 'admin.common.enLabel', 'EN');
ensurePath(en, 'admin.common.statusPublished', 'Published');
ensurePath(en, 'admin.common.statusScheduled', 'Scheduled');
ensurePath(en, 'admin.common.statusDraft', 'Draft');

ensurePath(es, 'admin.common.byAuthor', 'por');
ensurePath(es, 'admin.common.covers', 'Tiene portada');
ensurePath(es, 'admin.common.created', 'Creado');
ensurePath(es, 'admin.common.enLabel', 'EN');
ensurePath(es, 'admin.common.statusPublished', 'Publicado');
ensurePath(es, 'admin.common.statusScheduled', 'Programado');
ensurePath(es, 'admin.common.statusDraft', 'Borrador');

// === ADMIN RESTORE KEYS ===
ensurePath(en, 'admin.restoreForm.restoreAction', 'This action will restore the user account and lift active bans.');
ensurePath(en, 'admin.restoreForm.restoreConfirm', 'To confirm, type RESTORE in the field below.');
ensurePath(en, 'admin.restoreForm.restorePlaceholder', 'Type RESTORE to enable the button...');
ensurePath(en, 'admin.restoreForm.restoreReason', 'Restore reason');
ensurePath(en, 'admin.restoreForm.restoreReasonPlaceholder', 'Explain why this account is being restored...');

ensurePath(es, 'admin.restoreForm.restoreAction', 'Esta acción restaurará la cuenta del usuario y levantará los baneos activos.');
ensurePath(es, 'admin.restoreForm.restoreConfirm', 'Para confirmar, escribe RESTORE en el campo inferior.');
ensurePath(es, 'admin.restoreForm.restorePlaceholder', 'Escribe RESTORE para habilitar el botón...');
ensurePath(es, 'admin.restoreForm.restoreReason', 'Motivo de la restauración');
ensurePath(es, 'admin.restoreForm.restoreReasonPlaceholder', 'Explica por qué se restaura esta cuenta...');

// === ADMIN METADATA KEYS ===
ensurePath(en, 'admin.metadata.auditLog', 'Audit Log');
ensurePath(en, 'admin.metadata.auditLogs', 'Audit Logs');
ensurePath(en, 'admin.metadata.contact', 'Contact Messages');
ensurePath(en, 'admin.metadata.export', 'Export Data');
ensurePath(en, 'admin.metadata.roles', 'Role Management');
ensurePath(en, 'admin.metadata.bans', 'Bans & Suspensions');
ensurePath(en, 'admin.metadata.dmca', 'DMCA Takedowns');
ensurePath(en, 'admin.metadata.webhooks', 'Webhooks');
ensurePath(en, 'admin.metadata.webhookDeliveries', 'Webhook Deliveries');
ensurePath(en, 'admin.metadata.impersonate', 'Impersonate User');
ensurePath(en, 'admin.metadata.kyc', 'KYC Verifications');
ensurePath(en, 'admin.metadata.restore', 'Restore Content');
ensurePath(en, 'admin.metadata.cspReports', 'CSP Reports');
ensurePath(en, 'admin.metadata.emailTemplates', 'Email Templates');
ensurePath(en, 'admin.metadata.announcements', 'Announcements');
ensurePath(en, 'admin.metadata.searchAnalytics', 'Search Analytics');
ensurePath(en, 'admin.metadata.crowdfunding', 'Crowdfunding & Sponsorships');
ensurePath(en, 'admin.metadata.subscriptions', 'Subscriptions');
ensurePath(en, 'admin.metadata.genres', 'Genre Management');
ensurePath(en, 'admin.metadata.analytics', 'Analytics');
ensurePath(en, 'admin.metadata.anomalies', 'Anomaly Detection');
ensurePath(en, 'admin.metadata.realtime', 'Real-time Analytics');

ensurePath(es, 'admin.metadata.auditLog', 'Registro de Auditoría');
ensurePath(es, 'admin.metadata.auditLogs', 'Registros de Auditoría');
ensurePath(es, 'admin.metadata.contact', 'Mensajes de Contacto');
ensurePath(es, 'admin.metadata.export', 'Exportar Datos');
ensurePath(es, 'admin.metadata.roles', 'Gestión de Roles');
ensurePath(es, 'admin.metadata.bans', 'Baneos y Suspensiones');
ensurePath(es, 'admin.metadata.dmca', 'Solicitudes DMCA');
ensurePath(es, 'admin.metadata.webhooks', 'Webhooks');
ensurePath(es, 'admin.metadata.webhookDeliveries', 'Entregas de Webhooks');
ensurePath(es, 'admin.metadata.impersonate', 'Suplantar Usuario');
ensurePath(es, 'admin.metadata.kyc', 'Verificaciones KYC');
ensurePath(es, 'admin.metadata.restore', 'Restaurar Contenido');
ensurePath(es, 'admin.metadata.cspReports', 'Reportes CSP');
ensurePath(es, 'admin.metadata.emailTemplates', 'Plantillas Email');
ensurePath(es, 'admin.metadata.announcements', 'Anuncios');
ensurePath(es, 'admin.metadata.searchAnalytics', 'Analíticas de Búsqueda');
ensurePath(es, 'admin.metadata.crowdfunding', 'Crowdfunding y Patrocinios');
ensurePath(es, 'admin.metadata.subscriptions', 'Suscripciones');
ensurePath(es, 'admin.metadata.genres', 'Gestión de Géneros');
ensurePath(es, 'admin.metadata.analytics', 'Analíticas');
ensurePath(es, 'admin.metadata.anomalies', 'Detección de Anomalías');
ensurePath(es, 'admin.metadata.realtime', 'Analíticas en Tiempo Real');

// Write updated files
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(esPath, JSON.stringify(es, null, 2) + '\n');
console.log('✅ Locale keys added successfully');
