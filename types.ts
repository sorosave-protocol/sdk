/**
 * Webhook notification service types
 */

/** Supported contract event types */
export type EventType =
  | "group.created"
  | "group.joined"
  | "group.contribution"
  | "group.payout"
  | "group.completed"
  | "group.cancelled"
  | "member.added"
  | "member.removed";

/** Registered webhook configuration */
export interface Webhook {
  /** Unique identifier for the webhook */
  id: string;
  /** The URL to POST event data to */
  url: string;
  /** Event types this webhook is subscribed to */
  events: EventType[];
  /** HMAC secret used to sign payloads */
  secret: string;
  /** Whether the webhook is active */
  active: boolean;
  /** ISO timestamp of when the webhook was created */
  createdAt: string;
  /** Optional description */
  description?: string;
}

/** Input for registering a new webhook */
export interface RegisterWebhookInput {
  /** The URL to POST event data to */
  url: string;
  /** Event types to subscribe to */
  events: EventType[];
  /** HMAC secret for payload signing */
  secret: string;
  /** Optional description */
  description?: string;
}

/** Payload sent to webhook endpoints */
export interface WebhookPayload {
  /** The webhook ID that triggered this delivery */
  webhookId: string;
  /** The event type */
  event: EventType;
  /** ISO timestamp of when the event occurred */
  timestamp: string;
  /** Unique delivery ID for idempotency */
  deliveryId: string;
  /** Event-specific data */
  data: Record<string, unknown>;
}

/** Result of a webhook delivery attempt */
export interface DeliveryResult {
  /** Delivery attempt ID */
  deliveryId: string;
  /** Webhook ID */
  webhookId: string;
  /** Whether the delivery succeeded */
  success: boolean;
  /** HTTP status code, if available */
  statusCode?: number;
  /** Number of attempts made */
  attempts: number;
  /** ISO timestamp of final attempt */
  completedAt: string;
  /** Error message, if delivery failed */
  error?: string;
}

/** Options for the WebhookService */
export interface WebhookServiceOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms between retries (default: 1000) */
  retryDelay?: number;
  /** Request timeout in ms (default: 5000) */
  timeout?: number;
}
