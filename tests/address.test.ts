import { describe, it, expect } from "vitest";
import { isValidAddress, validateAddress } from "../src/utils";

describe("Address Validation Utility", () => {
  const VALID_PUBLIC_KEY = "GBZPEVAMYQ5W77QZ34F4L5K4F7J4X2Z4L5N6O7P8Q9R1S2T3U4V5W6X7"; // Sample 56-char Stellar G...
  const VALID_CONTRACT_ID = "CA3D5KRYMCMCZKPO7S7VXA34ICJA6WU6IIEZUMQL4UZGLSOAQ2TWPMC6"; // Real Soroban C... address
  const VALID_STELLAR_G = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

  describe("isValidAddress", () => {
    it("returns true for valid Stellar Ed25519 account public key (G...)", () => {
      expect(isValidAddress(VALID_STELLAR_G)).toBe(true);
    });

    it("returns true for valid Soroban contract address (C...)", () => {
      expect(isValidAddress(VALID_CONTRACT_ID)).toBe(true);
    });

    it("returns false for secret keys (S...)", () => {
      expect(isValidAddress("SBZPEVAMYQ5W77QZ34F4L5K4F7J4X2Z4L5N6O7P8Q9R1S2T3U4V5W6X7")).toBe(false);
    });

    it("returns false for invalid prefix", () => {
      expect(isValidAddress("ABZPEVAMYQ5W77QZ34F4L5K4F7J4X2Z4L5N6O7P8Q9R1S2T3U4V5W6X7")).toBe(false);
    });

    it("returns false for invalid length", () => {
      expect(isValidAddress("GA5ZSEJYB37JRC5AVCIA")).toBe(false);
      expect(isValidAddress("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVNEXTRA")).toBe(false);
    });

    it("returns false for lowercase letters", () => {
      expect(isValidAddress(VALID_STELLAR_G.toLowerCase())).toBe(false);
    });

    it("returns false for non-string inputs", () => {
      expect(isValidAddress(null)).toBe(false);
      expect(isValidAddress(undefined)).toBe(false);
      expect(isValidAddress(12345)).toBe(false);
      expect(isValidAddress({})).toBe(false);
      expect(isValidAddress("")).toBe(false);
      expect(isValidAddress("   ")).toBe(false);
    });
  });

  describe("validateAddress", () => {
    it("returns detailed result for valid account address", () => {
      const res = validateAddress(VALID_STELLAR_G);
      expect(res.isValid).toBe(true);
      expect(res.type).toBe("account");
      expect(res.error).toBeUndefined();
    });

    it("returns detailed result for valid contract address", () => {
      const res = validateAddress(VALID_CONTRACT_ID);
      expect(res.isValid).toBe(true);
      expect(res.type).toBe("contract");
      expect(res.error).toBeUndefined();
    });

    it("returns error message for empty address", () => {
      const res = validateAddress("");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("Address must be a non-empty string.");
    });

    it("returns descriptive error for invalid format", () => {
      const res = validateAddress("INVALID_ADDRESS_123");
      expect(res.isValid).toBe(false);
      expect(res.type).toBe("unknown");
      expect(res.error).toContain("Invalid Stellar address format");
    });
  });
});
