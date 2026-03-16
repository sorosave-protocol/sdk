import { createServer, IncomingMessage, ServerResponse } from "http";
import {
  WebhookService,
} from "./service";
import { RegisterWebhookInput, EventType } from "./types";
import { verifySignature } from "./signature";

/**
 * Lightweight HTTP management API for the WebhookService.
 *
 * Routes:
 *  POST   /webhooks          — Register a webhook
 *  GET    /webhooks          — List all webhooks
 *  GET    /webhooks/:id      — Get a single webhook
 *  DELETE /webhooks/:id      — Delete a webhook
 *  POST   /webhooks/:id/activate   — Activate webhook
 *  POST   /webhooks/:id/deactivate — Deactivate webhook
 *  POST   /webhooks/test     — Dispatch a test event
 *
 * @example
 * 