import { WebhookService } from "../service";

describe("WebhookService", () => {
  let service: WebhookService;

  beforeEach(() => {
    service = new WebhookService({ maxRetries: 1, retryDelay: 10 });
  });

  describe("register", () => {
    it("registers a valid webhook", () => {
      const wh = service.register({
        url: "https://example.com/hook",
        events: ["group.created"],
        secret: "supersecretkey",
      });
      expect(wh.id).toBeDefined();
      expect(wh.active).toBe(true);
    });

    it("throws for an invalid URL", () => {
      expect(() =>
        service.register({
          url: "not-a-url",
          events: ["group.created"],
          secret: "supersecretkey",
        })
      ).toThrow("Invalid webhook URL");
    });

    it("throws for empty events array", () => {
      expect(() =>
        service.register({
          url: "https://example.com/hook",
          events: [],
          secret: "supersecretkey",
        })
      ).toThrow("At least one event type");
    });

    it("throws for a secret shorter than 8 characters", () => {
      expect(() =>
        service.register({
          url: "https://example.com/hook",
          events: ["group.created"],
          secret: "short",
        })
      ).toThrow("Secret must be at least 8 characters");
    });
  });

  describe("list / get / delete", () => {
    it("lists registered webhooks", () => {
      service.register({
        url: "https://example.com/hook",
        events: ["group.created"],
        secret: "supersecretkey",
      });
      expect(service.list()).toHaveLength(1);
    });

    it("gets a webhook by ID", () => {
      const wh = service.register({
        url: "https://example.com/hook",
        events: ["group.created"],
        secret: "supersecretkey",
      });
      expect(service.get(wh.id)).toEqual(wh);
    });

    it("deletes a webhook", () => {
      const wh = service.register({
        url: "https://example.com/hook",
        events: ["group.created"],
        secret: "supersecretkey",
      });
      expect(service.delete(wh.id)).toBe(true);
      expect(service.get(wh.id)).toBeUndefined();
    });
  });

  describe("dispatch", () => {
    it("returns empty array when no webhooks are registered", async () => {
      const results = await service.dispatch("group.created", { groupId: 1 });
      expect(results).toHaveLength(0);
    });

    it("delivers to matching webhooks and records failure for unreachable URLs", async () => {
      service.register({
        url: "http://localhost:19999/unreachable",
        events: ["group.created"],
        secret: "supersecretkey",
      });
      const results = await service.dispatch("group.created", { groupId: 1 });
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].attempts).toBeGreaterThanOrEqual(1);
    });

    it("does not deliver to webhooks not subscribed to the event", async () => {
      service.register({
        url: "https://example.com/hook",
        events: ["group.payout"],
        secret: "supersecretkey",
      });
      const results = await service.dispatch("group.created", { groupId: 1 });
      expect(results).toHaveLength(0);
    });
  });
});
