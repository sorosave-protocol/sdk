import { randomUUID } from "crypto";
import { Webhook, WebhookPayload, DeliveryResult, EventType, WebhookServiceOptions } from "./types";
import { generateSignature } from "./signature";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Handles the delivery of webhook payloads to registered URLs,
 * including retry logic and HMAC signing.
 */
export class WebhookDelivery {
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;

  constructor(options: WebhookServiceOptions = {}) {
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY_MS;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Deliver an event payload to a single webhook endpoint.
   * Retries up to `maxRetries` times on failure with exponential back-off.
   *
   * @param webhook - The target webhook
   * @param event   - The event type being delivered
   * @param data    - The event-specific data
   * @returns A DeliveryResult describing the outcome
   */
  async deliver(
    webhook: Webhook,
    event: EventType,
    data: Record<string, unknown>
  ): Promise<DeliveryResult> {
    const deliveryId = randomUUID();
    const payload: WebhookPayload = {
      webhookId: webhook.id,
      event,
      timestamp: new Date().toISOString(),
      deliveryId,
      data,
    };

    const body = JSON.stringify(payload);
    const signature = generateSignature(body, webhook.secret);

    let lastError: string | undefined;
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.attemptDelivery(webhook.url, body, signature, deliveryId);
        lastStatusCode = result.statusCode;

        if (result.ok) {
          return {
            deliveryId,
            webhookId: webhook.id,
            success: true,
            statusCode: result.statusCode,
            attempts: attempt,
            completedAt: new Date().toISOString(),
          };
        }

        lastError = `HTTP ${result.statusCode}`;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      // Wait before retrying (exponential back-off, skip wait on last attempt)
      if (attempt < this.maxRetries) {
        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }

    return {
      deliveryId,
      webhookId: webhook.id,
      success: false,
      statusCode: lastStatusCode,
      attempts: this.maxRetries,
      completedAt: new Date().toISOString(),
      error: lastError,
    };
  }

  /**
   * Perform a single HTTP POST attempt.
   */
  private async attemptDelivery(
    url: string,
    body: string,
    signature: string,
    deliveryId: string
  ): Promise<{ ok: boolean; statusCode: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SoroSave-Signature": signature,
          "X-SoroSave-Delivery": deliveryId,
          "User-Agent": "SoroSave-Webhook/1.0",
        },
        body,
        signal: controller.signal,
      });

      return { ok: response.ok, statusCode: response.status };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Sleep for the specified number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
