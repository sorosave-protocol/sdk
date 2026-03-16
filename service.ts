import {
  Webhook,
  RegisterWebhookInput,
  DeliveryResult,
  EventType,
  WebhookServiceOptions,
} from "./types";
import { WebhookStore } from "./store";
import { WebhookDelivery } from "./delivery";

/**
 * WebhookService — the main entry point for the webhook notification system.
 *
 * Responsibilities:
 *  - Register, list, and delete webhook endpoints
 *  - Dispatch events to all subscribed, active webhooks
 *  - Handle retry logic via WebhookDelivery
 *
 * @example
 * 