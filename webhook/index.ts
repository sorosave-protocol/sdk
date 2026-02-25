/**
 * Webhook Notification Service for Sorosave Protocol
 * Sends HTTP notifications when contract events occur
 */

import crypto from "crypto";
import fetch from "node-fetch";
import { EventEmitter } from "events";

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: Date;
  retryCount: number;
}

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: Date;
  id: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: "pending" | "success" | "failed";
  attempts: number;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class WebhookService extends EventEmitter {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private maxRetries: number = 3;
  private retryDelays: number[] = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor() {
    super();
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(
    url: string,
    events: string[],
    secret?: string
  ): Promise<WebhookConfig> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid webhook URL");
    }

    // Validate events
    if (!events.length) {
      throw new Error("At least one event type is required");
    }

    const webhook: WebhookConfig = {
      id: this.generateId(),
      url,
      events,
      secret,
      active: true,
      createdAt: new Date(),
      retryCount: 0,
    };

    this.webhooks.set(webhook.id, webhook);
    this.emit("webhook:registered", webhook);

    return webhook;
  }

  /**
   * List all registered webhooks
   */
  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get a specific webhook by ID
   */
  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Delete a webhook
   */
  deleteWebhook(id: string): boolean {
    const deleted = this.webhooks.delete(id);
    if (deleted) {
      this.emit("webhook:deleted", { id });
    }
    return deleted;
  }

  /**
   * Update webhook status
   */
  updateWebhookStatus(id: string, active: boolean): WebhookConfig | undefined {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      webhook.active = active;
      this.emit("webhook:updated", webhook);
    }
    return webhook;
  }

  /**
   * Trigger an event and send to matching webhooks
   */
  async triggerEvent(type: string, data: any): Promise<void> {
    const event: WebhookEvent = {
      type,
      data,
      timestamp: new Date(),
      id: this.generateId(),
    };

    this.emit("event:triggered", event);

    // Find matching webhooks
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.active && webhook.events.includes(type)
    );

    // Send to all matching webhooks
    await Promise.all(
      matchingWebhooks.map((webhook) => this.sendWebhook(webhook, event))
    );
  }

  /**
   * Send webhook notification with retry logic
   */
  private async sendWebhook(
    webhook: WebhookConfig,
    event: WebhookEvent
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: this.generateId(),
      webhookId: webhook.id,
      eventId: event.id,
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);

    // Attempt delivery with retries
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      delivery.attempts = attempt + 1;

      try {
        const response = await this.executeDelivery(webhook, event);

        delivery.status = "success";
        delivery.responseStatus = response.status;
        delivery.completedAt = new Date();

        this.emit("delivery:success", { delivery, webhook, event });
        return delivery;
      } catch (error) {
        delivery.error = error instanceof Error ? error.message : String(error);

        if (attempt < this.maxRetries) {
          // Wait before retry
          await this.delay(this.retryDelays[attempt]);
        } else {
          // All retries exhausted
          delivery.status = "failed";
          delivery.completedAt = new Date();
          this.emit("delivery:failed", { delivery, webhook, event });
        }
      }
    }

    return delivery;
  }

  /**
   * Execute a single delivery attempt
   */
  private async executeDelivery(
    webhook: WebhookConfig,
    event: WebhookEvent
  ): Promise<{ status: number; body: string }> {
    const payload = JSON.stringify({
      event: event.type,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      id: event.id,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Sorosave-Webhook/1.0",
      "X-Webhook-ID": webhook.id,
      "X-Event-ID": event.id,
      "X-Delivery-ID": this.generateId(),
    };

    // Add HMAC signature if secret is configured
    if (webhook.secret) {
      const signature = this.generateSignature(payload, webhook.secret);
      headers["X-Webhook-Signature"] = signature;
    }

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payload,
      timeout: 30000, // 30 second timeout
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${body}`);
    }

    return { status: response.status, body };
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return `sha256=${hmac.digest("hex")}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Get delivery history for a webhook
   */
  getDeliveries(webhookId?: string): WebhookDelivery[] {
    const deliveries = Array.from(this.deliveries.values());
    if (webhookId) {
      return deliveries.filter((d) => d.webhookId === webhookId);
    }
    return deliveries;
  }

  /**
   * Get a specific delivery
   */
  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const webhookService = new WebhookService();
export default webhookService;
