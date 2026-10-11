import * as StellarSdk from "@stellar/stellar-sdk";
import { GroupStatus } from "./types";

export interface AddressValidationResult {
  isValid: boolean;
  type?: "account" | "contract" | "muxed" | "unknown";
  error?: string;
}

/**
 * Validate whether a string is a valid Stellar public key (G...) or Soroban contract address (C...).
 *
 * @param address The address string to validate
 * @returns boolean true if valid, false otherwise
 */
export function isValidAddress(address: unknown): boolean {
  return validateAddress(address).isValid;
}

/**
 * Detailed validation for a Stellar address or contract identifier.
 * Validates G... public keys, C... contract addresses, and M... muxed accounts.
 *
 * @param address The address string to validate
 * @returns AddressValidationResult with isValid boolean, detected type, and optional error message
 */
export function validateAddress(address: unknown): AddressValidationResult {
  if (typeof address !== "string" || !address.trim()) {
    return {
      isValid: false,
      type: "unknown",
      error: "Address must be a non-empty string.",
    };
  }

  const trimmed = address.trim();

  // Try parsing with StellarSdk.Address
  try {
    if (StellarSdk && StellarSdk.Address) {
      const parsed = StellarSdk.Address.fromString(trimmed);
      const str = parsed.toString();
      const isContract = str.startsWith("C");
      return {
        isValid: true,
        type: isContract ? "contract" : "account",
      };
    }
  } catch {
    // Falls through to StrKey / regex checks if Address.fromString fails
  }

  // StrKey check for Ed25519 public key or contract
  try {
    if (StellarSdk && StellarSdk.StrKey) {
      if (StellarSdk.StrKey.isValidEd25519PublicKey && StellarSdk.StrKey.isValidEd25519PublicKey(trimmed)) {
        return { isValid: true, type: "account" };
      }
      if (StellarSdk.StrKey.isValidContract && StellarSdk.StrKey.isValidContract(trimmed)) {
        return { isValid: true, type: "contract" };
      }
      if (StellarSdk.StrKey.isValidMed25519PublicKey && StellarSdk.StrKey.isValidMed25519PublicKey(trimmed)) {
        return { isValid: true, type: "muxed" };
      }
    }
  } catch {}

  // Regex format validation fallback
  if (/^G[A-Z2-7]{55}$/.test(trimmed)) {
    return { isValid: true, type: "account" };
  }
  if (/^C[A-Z2-7]{55}$/.test(trimmed)) {
    return { isValid: true, type: "contract" };
  }
  if (/^M[A-Z2-7]{68}$/.test(trimmed)) {
    return { isValid: true, type: "muxed" };
  }

  return {
    isValid: false,
    type: "unknown",
    error: `Invalid Stellar address format: "${trimmed}". Expected a G... account address or C... contract identifier.`,
  };
}

/**
 * Format a raw token amount to a human-readable string.
 * Soroban tokens typically use 7 decimal places.
 */
export function formatAmount(
  amount: bigint,
  decimals: number = 7
): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fractional = amount % divisor;

  if (fractional === 0n) {
    return whole.toString();
  }

  const fractionalStr = fractional.toString().padStart(decimals, "0");
  const trimmed = fractionalStr.replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}

/**
 * Parse a human-readable amount to raw token units.
 */
export function parseAmount(
  amount: string,
  decimals: number = 7
): bigint {
  const parts = amount.split(".");
  const whole = BigInt(parts[0]) * BigInt(10 ** decimals);

  if (parts.length === 1) {
    return whole;
  }

  const fractionalStr = parts[1].padEnd(decimals, "0").slice(0, decimals);
  return whole + BigInt(fractionalStr);
}

/**
 * Get a human-readable label for a group status.
 */
export function getStatusLabel(status: GroupStatus): string {
  const labels: Record<GroupStatus, string> = {
    [GroupStatus.Forming]: "Accepting Members",
    [GroupStatus.Active]: "Active",
    [GroupStatus.Completed]: "Completed",
    [GroupStatus.Disputed]: "Under Dispute",
    [GroupStatus.Paused]: "Paused",
  };
  return labels[status];
}

/**
 * Shorten a Stellar address for display.
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Calculate the total pot size for a group.
 */
export function calculatePotSize(
  contributionAmount: bigint,
  memberCount: number
): bigint {
  return contributionAmount * BigInt(memberCount);
}

/**
 * Calculate which round a specific member will receive their payout.
 */
export function getPayoutRound(
  payoutOrder: string[],
  memberAddress: string
): number | null {
  const index = payoutOrder.indexOf(memberAddress);
  return index === -1 ? null : index + 1;
}
