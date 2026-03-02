/**
 * Webhook Notification Service
 * HTTP notifications for SoroSave contract events
 * 
 * Issue: https://github.com/sorosave-protocol/sdk/issues/54
 * Bounty: Yes
 */

import * as StellarSdk from "@stellar/stellar-sdk";

export type WebhookEventType = 'contribution' | 'payout' | 'group_created' | 'member_joined';

export interface WebhookConfig {
  id?: string;
  url: string;
  eventTypes: WebhookEventType[];
  secret?: string;
  createdAt?: number;
}

export interface WebhookPayload {
  eventType: WebhookEventType;
  groupId: number;
  timestamp: number;
  data: Record<string, unknown>;
  signature?: string;
}

interface WebhookDelivery {
  webhookId: string;
  payload: WebhookPayload;
  attempt: number;
  maxAttempts: number;
  lastError?: string;
}

/**
 * Webhook Management API
 */
export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private webhookCounter = 0;
  private deliveryQueue: WebhookDelivery[] = [];
  private isProcessing = false;

  /**
   * Register a new webhook
   */
  register(config: Omit<WebhookConfig, 'id' | 'createdAt'>): string {
    const id = `webhook_${++this.webhookCounter}_${Date.now()}`;
    
    const webhook: WebhookConfig = {
      ...config,
      id,
      createdAt: Date.now(),
    };

    this.webhooks.set(id, webhook);
    return id;
  }

  /**
   * List all registered webhooks
   */
  list(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * List webhooks for a specific event type
   */
  listByEventType(eventType: WebhookEventType): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(w => 
      w.eventTypes.includes(eventType)
    );
  }

  /**
   * Delete a webhook
   */
  delete(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  /**
   * Get a specific webhook
   */
  get(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * Update a webhook
   */
  update(webhookId: string, updates: Partial<Omit<WebhookConfig, 'id' | 'createdAt'>>): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    this.webhooks.set(webhookId, { ...webhook, ...updates });
    return true;
  }

  /**
   * Trigger webhooks for an event
   */
  async trigger(eventType: WebhookEventType, groupId: number, data: Record<string, unknown>): Promise<void> {
    const webhooks = this.listByEventType(eventType);
    
    const payload: WebhookPayload = {
      eventType,
      groupId,
      timestamp: Date.now(),
      data,
    };

    for (const webhook of webhooks) {
      // Add HMAC signature if secret is configured
      if (webhook.secret) {
        payload.signature = this.generateSignature(payload, webhook.secret);
      }

      // Queue for delivery with retry logic
      this.queueDelivery(webhook.id!, payload);
    }

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Queue a webhook delivery
   */
  private queueDelivery(webhookId: string, payload: WebhookPayload): void {
    this.deliveryQueue.push({
      webhookId,
      payload,
      attempt: 0,
      maxAttempts: 3,
    });
  }

  /**
   * Process delivery queue with retry logic
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue[0];
      const webhook = this.webhooks.get(delivery.webhookId);

      if (!webhook) {
        this.deliveryQueue.shift();
        continue;
      }

      delivery.attempt++;

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': delivery.payload.signature || '',
            'X-Webhook-Event': delivery.payload.eventType,
          },
          body: JSON.stringify(delivery.payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success - remove from queue
        this.deliveryQueue.shift();

      } catch (error) {
        delivery.lastError = error instanceof Error ? error.message : 'Unknown error';

        if (delivery.attempt >= delivery.maxAttempts) {
          // Max retries reached - remove from queue
          console.error(`Webhook delivery failed after ${delivery.maxAttempts} attempts:`, delivery.lastError);
          this.deliveryQueue.shift();
        } else {
          // Move to end of queue for retry
          this.deliveryQueue.shift();
          this.deliveryQueue.push(delivery);
          
          // Wait before retry (exponential backoff)
          await this.sleep(Math.pow(2, delivery.attempt) * 1000);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get delivery queue status
   */
  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.deliveryQueue.length,
      processing: this.isProcessing,
    };
  }

  /**
   * Clear all webhooks
   */
  clear(): void {
    this.webhooks.clear();
    this.deliveryQueue = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create webhook manager
 */
export function createWebhookManager(): WebhookManager {
  return new WebhookManager();
}
