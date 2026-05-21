import type {
  IWebhookRepository,
  WebhookEndpointRecord,
  WebhookDeliveryRecord,
} from '@/core/services/IWebhookRepository';

export class WebhookDeliveryService {
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10000;

  constructor(private readonly repo: IWebhookRepository) {}

  async getSignatureHex(secret: string, body: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, bodyData);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  getSignature(secret: string, body: string): string {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(body);

    const key = crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = key.then((k) =>
      crypto.subtle.sign('HMAC', k, bodyData)
    );

    const hex = signature.then((sig) =>
      Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );

    let result = '';
    hex.then((h) => { result = h; });
    return result;
  }

  async deliver(
    endpoint: WebhookEndpointRecord,
    event: string,
    payload: unknown
  ): Promise<WebhookDeliveryRecord> {
    const deliveryId = crypto.randomUUID();
    const body = JSON.stringify({
      event,
      id: deliveryId,
      createdAt: new Date().toISOString(),
      data: payload,
    });

    const signature = await this.getSignatureHex(endpoint.secret, body);

    let lastError: string | null = null;
    let lastStatusCode: number | null = null;
    let lastResponseBody: string | null = null;
    let durationMs: number | null = null;
    let success = false;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Webhook-Delivery': deliveryId,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        durationMs = Date.now() - startTime;
        lastStatusCode = response.status;
        lastResponseBody = await response.text().catch(() => null);

        if (response.ok) {
          success = true;
          break;
        }

        lastError = `HTTP ${response.status}: ${lastResponseBody || 'Unknown error'}`;
      } catch (err: unknown) {
        durationMs = Date.now() - startTime;
        const message = err instanceof Error ? err.message : 'Unknown error';
        lastError = message;

        if (err instanceof TypeError && message.includes('fetch')) {
          lastError = 'Network error: Could not reach the endpoint';
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = 'Request timed out after 10 seconds';
        }
      }

      if (attempt < this.maxRetries) {
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    const delivery = await this.repo.createDelivery({
      endpointId: endpoint.id,
      event,
      payload: JSON.stringify(payload),
      status: success ? 'SUCCESS' : 'FAILED',
      statusCode: lastStatusCode,
      responseBody: lastResponseBody,
      durationMs,
      attemptCount: success ? 1 : this.maxRetries,
      error: success ? null : lastError,
    });

    if (success) {
      await this.repo.updateEndpointTrigger(endpoint.id);
    } else {
      await this.repo.incrementFailureCount(endpoint.id);
    }

    return delivery;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
