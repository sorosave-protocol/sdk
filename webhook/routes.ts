/**
 * Webhook Management API
 * REST API for managing webhooks
 */

import { Router, Request, Response } from "express";
import { webhookService } from "./index";

const router = Router();

/**
 * POST /webhooks
 * Register a new webhook
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: "Missing required fields: url, events",
      });
    }

    const webhook = await webhookService.registerWebhook(url, events, secret);

    res.status(201).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /webhooks
 * List all webhooks
 */
router.get("/", (req: Request, res: Response) => {
  const webhooks = webhookService.listWebhooks();
  res.json({
    success: true,
    data: webhooks,
  });
});

/**
 * GET /webhooks/:id
 * Get a specific webhook
 */
router.get("/:id", (req: Request, res: Response) => {
  const webhook = webhookService.getWebhook(req.params.id);

  if (!webhook) {
    return res.status(404).json({
      success: false,
      error: "Webhook not found",
    });
  }

  res.json({
    success: true,
    data: webhook,
  });
});

/**
 * DELETE /webhooks/:id
 * Delete a webhook
 */
router.delete("/:id", (req: Request, res: Response) => {
  const deleted = webhookService.deleteWebhook(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "Webhook not found",
    });
  }

  res.json({
    success: true,
    message: "Webhook deleted successfully",
  });
});

/**
 * PATCH /webhooks/:id
 * Update webhook status
 */
router.patch("/:id", (req: Request, res: Response) => {
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "Missing required field: active (boolean)",
    });
  }

  const webhook = webhookService.updateWebhookStatus(req.params.id, active);

  if (!webhook) {
    return res.status(404).json({
      success: false,
      error: "Webhook not found",
    });
  }

  res.json({
    success: true,
    data: webhook,
  });
});

/**
 * GET /webhooks/:id/deliveries
 * Get delivery history for a webhook
 */
router.get("/:id/deliveries", (req: Request, res: Response) => {
  const webhook = webhookService.getWebhook(req.params.id);

  if (!webhook) {
    return res.status(404).json({
      success: false,
      error: "Webhook not found",
    });
  }

  const deliveries = webhookService.getDeliveries(req.params.id);

  res.json({
    success: true,
    data: deliveries,
  });
});

/**
 * POST /webhooks/test
 * Test webhook delivery
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { url, secret } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: url",
      });
    }

    // Send test event
    const testEvent = {
      type: "test",
      data: { message: "This is a test event" },
      timestamp: new Date(),
      id: `test-${Date.now()}`,
    };

    // Create temporary webhook for testing
    const webhook = await webhookService.registerWebhook(url, ["test"], secret);

    // Trigger test event
    await webhookService.triggerEvent("test", testEvent.data);

    // Clean up test webhook
    webhookService.deleteWebhook(webhook.id);

    res.json({
      success: true,
      message: "Test event sent successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
