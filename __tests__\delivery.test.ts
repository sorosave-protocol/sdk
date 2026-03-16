import { WebhookDelivery } from "../delivery";
import { Webhook } from "../types";

const mockWebhook: Webhook = {
  id: "test-webhook-id",
  url: "http://localhost:19998/hook",
  events: ["group.created"],
  secret: "supersecretkey",
  active: true,
  createdAt: new Date().toISOString(),
};

describe("WebhookDelivery", () => {
  it("returns a failed DeliveryResult when endpoint is unreachable", async () => {
    const delivery = new WebhookDelivery({ maxRetries: 2, retryDelay: 10, timeout: 200 });
    const result = await delivery.deliver(mockWebhook, "group.created", { groupId: 1 });

    expect(result.success).toBe(false);
    expect(result.webhookId).toBe(mockWebhook.id);
    expect(result.attempts).toBe(2);
    expect(result.error).toBeDefined();
    expect(result.deliveryId).toBeDefined();
    expect(result.completedAt).toBeDefined();
  });

  it("includes a deliveryId in results", async () => {
    const delivery = new WebhookDelivery({ maxRetries: 1, retryDelay: 10, timeout: 200 });
    const result = await delivery.deliver(mockWebhook, "group.created", {});
    expect(typeof result.deliveryId).toBe("string");
    expect(result.deliveryId.length).toBeGreaterThan(0);
  });
});
