import { Webhook, RegisterWebhookInput, EventType } from "./types";
import { randomUUID } from "crypto";

/**
 * In-memory store for webhook registrations.
 * Can be extended to use a persistent backend.
 */
export class WebhookStore {
  private webhooks: Map<string, Webhook> = new Map();

  /**
   * Register a new webhook.
   * @param input - Webhook registration input
   * @returns The created webhook
   */
  register(input: RegisterWebhookInput): Webhook {
    const webhook: Webhook = {
      id: randomUUID(),
      url: input.url,
      events: input.events,
      secret: input.secret,
      active: true,
      createdAt: new Date().toISOString(),
      description: input.description,
    };
    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  /**
   * List all registered webhooks, optionally filtered by event type.
   * @param event - Optional event type filter
   * @returns Array of matching webhooks
   */
  list(event?: EventType): Webhook[] {
    const all = Array.from(this.webhooks.values());
    if (!event) return all;
    return all.filter((wh) => wh.active && wh.events.includes(event));
  }

  /**
   * Get a webhook by ID.
   * @param id - Webhook ID
   * @returns The webhook or undefined
   */
  get(id: string): Webhook | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Delete a webhook by ID.
   * @param id - Webhook ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    return this.webhooks.delete(id);
  }

  /**
   * Deactivate a webhook without deleting it.
   * @param id - Webhook ID
   * @returns true if deactivated, false if not found
   */
  deactivate(id: string): boolean {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;
    webhook.active = false;
    return true;
  }

  /**
   * Activate a previously deactivated webhook.
   * @param id - Webhook ID
   * @returns true if activated, false if not found
   */
  activate(id: string): boolean {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;
    webhook.active = true;
    return true;
  }
}
