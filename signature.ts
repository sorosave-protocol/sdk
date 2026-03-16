import { createHmac } from "crypto";

/**
 * Generates an HMAC-SHA256 signature for a webhook payload.
 *
 * The signature is computed over the raw JSON string of the payload
 * and provided as a hex digest, prefixed with `sha256=`.
 *
 * @param payload - The raw JSON payload string
 * @param secret  - The webhook's HMAC secret
 * @returns Signature string in the form `sha256=<hex>`
 */
export function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Verifies an HMAC-SHA256 signature against a payload.
 *
 * Uses a timing-safe comparison to prevent timing attacks.
 *
 * @param payload   - The raw JSON payload string
 * @param secret    - The webhook's HMAC secret
 * @param signature - The signature to verify (in `sha256=<hex>` format)
 * @returns true if the signature is valid, false otherwise
 */
export function verifySignature(
  payload: string,
  secret: string,
  signature: string
): boolean {
  const expected = generateSignature(payload, secret);
  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
