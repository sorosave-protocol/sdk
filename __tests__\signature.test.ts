import { generateSignature, verifySignature } from "../signature";

describe("generateSignature", () => {
  it("returns a sha256= prefixed hex string", () => {
    const sig = generateSignature('{"hello":"world"}', "mysecret");
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it("produces consistent output for the same input", () => {
    const payload = JSON.stringify({ event: "group.created" });
    const sig1 = generateSignature(payload, "secret123");
    const sig2 = generateSignature(payload, "secret123");
    expect(sig1).toBe(sig2);
  });

  it("produces different output for different secrets", () => {
    const payload = JSON.stringify({ event: "group.created" });
    const sig1 = generateSignature(payload, "secret-a");
    const sig2 = generateSignature(payload, "secret-b");
    expect(sig1).not.toBe(sig2);
  });
});

describe("verifySignature", () => {
  it("returns true for a valid signature", () => {
    const payload = JSON.stringify({ event: "group.created" });
    const secret = "test-secret-key";
    const sig = generateSignature(payload, secret);
    expect(verifySignature(payload, secret, sig)).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    const payload = JSON.stringify({ event: "group.created" });
    expect(verifySignature(payload, "test-secret", "sha256=invalidsig")).toBe(false);
  });

  it("returns false when payload is tampered with", () => {
    const secret = "test-secret-key";
    const original = JSON.stringify({ event: "group.created", groupId: 1 });
    const sig = generateSignature(original, secret);
    const tampered = JSON.stringify({ event: "group.created", groupId: 999 });
    expect(verifySignature(tampered, secret, sig)).toBe(false);
  });
});
