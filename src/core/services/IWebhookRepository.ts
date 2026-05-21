export interface WebhookEndpointRecord {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: string;
  isActive: boolean;
  description: string | null;
  lastTriggeredAt: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDeliveryRecord {
  id: string;
  endpointId: string;
  event: string;
  payload: string;
  status: string;
  statusCode: number | null;
  responseBody: string | null;
  durationMs: number | null;
  attemptCount: number;
  error: string | null;
  createdAt: Date;
}

export interface CreateWebhookEndpointData {
  userId: string;
  url: string;
  secret: string;
  events: string;
  description?: string | null;
}

export interface UpdateWebhookEndpointData {
  url?: string;
  secret?: string;
  events?: string;
  isActive?: boolean;
  description?: string | null;
}

export interface CreateWebhookDeliveryData {
  endpointId: string;
  event: string;
  payload: string;
  status: string;
  statusCode?: number | null;
  responseBody?: string | null;
  durationMs?: number | null;
  attemptCount?: number;
  error?: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IWebhookRepository {
  createEndpoint(data: CreateWebhookEndpointData): Promise<WebhookEndpointRecord>;
  updateEndpoint(id: string, data: UpdateWebhookEndpointData): Promise<WebhookEndpointRecord>;
  deleteEndpoint(id: string): Promise<void>;
  findEndpointById(id: string): Promise<WebhookEndpointRecord | null>;
  findEndpointsByUserId(userId: string): Promise<WebhookEndpointRecord[]>;
  findActiveEndpointsByEvent(event: string): Promise<WebhookEndpointRecord[]>;
  updateEndpointTrigger(id: string): Promise<void>;
  incrementFailureCount(id: string): Promise<void>;
  resetFailureCount(id: string): Promise<void>;

  createDelivery(data: CreateWebhookDeliveryData): Promise<WebhookDeliveryRecord>;
  findDeliveryById(id: string): Promise<WebhookDeliveryRecord | null>;
  findDeliveriesByEndpointId(endpointId: string, page?: number, limit?: number): Promise<PaginatedResult<WebhookDeliveryRecord>>;
  findDeliveries(page?: number, limit?: number, endpointId?: string, status?: string): Promise<PaginatedResult<WebhookDeliveryRecord>>;
  updateDelivery(id: string, data: Partial<CreateWebhookDeliveryData>): Promise<WebhookDeliveryRecord>;
}
