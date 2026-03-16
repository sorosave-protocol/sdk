import { WebhookStore } from "../store";

const sampleInput = {
  url: "https://example.com/hook",
  events: ["group.created" as const],
  secret: "supersecretkey",
};

describe("WebhookStore", () => {
  let store: WebhookStore;

  beforeEach(() => {
    store = new WebhookStore();
  });

  it("registers a webhook and returns it with a generated ID", () => {
    const wh = store.register(sampleInput);
    expect(wh.id).toBeDefined();
    expect(wh.url).toBe(sampleInput.url);
    expect(wh.active).toBe(true);
    expect(wh.createdAt).toBeDefined();
  });

  it("lists all webhooks", () => {
    store.register(sampleInput);
    store.register({ ...sampleInput, url: "https://example.com/hook2" });
    expect(store.list()).toHaveLength(2);
  });

  it("filters by event type", () => {
    store.register(sampleInput);
    store.register({
      ...sampleInput,
      url: "https://other.com/hook",
      events: ["group.payout"],
    });
    const filtered = store.list("group.created");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].url).toBe(sampleInput.url);
  });

  it("deletes a webhook by ID", () => {
    const wh = store.register(sampleInput);
    expect(store.delete(wh.id)).toBe(true);
    expect(store.get(wh.id)).toBeUndefined();
  });

  it("returns false when deleting non-existent webhook", () => {
    expect(store.delete("nonexistent")).toBe(false);
  });

  it("deactivates and reactivates a webhook", () => {
    const wh = store.register(sampleInput);
    expect(store.deactivate(wh.id)).toBe(true);
    expect(store.list("group.created")).toHaveLength(0); // filtered out

    expect(store.activate(wh.id)).toBe(true);
    expect(store.list("group.created")).toHaveLength(1);
  });
});
