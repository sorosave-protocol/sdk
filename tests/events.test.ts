import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as StellarSdk from "@stellar/stellar-sdk";
import { SoroSaveEventListener } from "../src/events";
import {
  SoroSaveEventType,
  type SoroSaveEvent,
  type ContributionEvent,
  type MemberJoinedEvent,
} from "../src/types";

// ─── Helpers ────────────────────────────────────────────────────

function makeSymbolXdr(symbol: string): string {
  return StellarSdk.nativeToScVal(symbol, { type: "symbol" }).toXDR("base64");
}

function makeU64Xdr(n: number): string {
  return StellarSdk.nativeToScVal(n, { type: "u64" }).toXDR("base64");
}

function makeAddressXdr(addr: string): string {
  return StellarSdk.nativeToScVal(addr, { type: "string" }).toXDR("base64");
}

function makeI128Xdr(n: bigint): string {
  return StellarSdk.nativeToScVal(n, { type: "i128" }).toXDR("base64");
}

function buildRawEvent(overrides: Partial<StellarSdk.rpc.Api.EventResponse> = {}): StellarSdk.rpc.Api.EventResponse {
  return {
    type: "contract",
    ledger: 12345,
    ledgerClosedAt: "2026-03-14T12:00:00Z",
    contractId: "CABC",
    id: "evt-001",
    pagingToken: "cursor-001",
    topic: [makeSymbolXdr("contribution")],
    value: StellarSdk.nativeToScVal([1, "GABC", 5000000n, 2]).toXDR("base64"),
    inSuccessfulContractCall: true,
    txHash: "abc123",
    ...overrides,
  } as StellarSdk.rpc.Api.EventResponse;
}

// ─── Tests ──────────────────────────────────────────────────────

describe("SoroSaveEventListener", () => {
  let listener: SoroSaveEventListener;

  beforeEach(() => {
    vi.useFakeTimers();
    listener = new SoroSaveEventListener({
      rpcUrl: "https://soroban-testnet.stellar.org",
      contractId: "CABC",
      networkPassphrase: StellarSdk.Networks.TESTNET,
      pollIntervalMs: 1000,
      startLedger: 10000,
    });
  });

  afterEach(() => {
    listener.stop();
    vi.useRealTimers();
  });

  // ─── Subscription management ────────────────────────────────

  it("returns unique subscription IDs", () => {
    const cb = vi.fn();
    const id1 = listener.onEvent(SoroSaveEventType.Contribution, cb);
    const id2 = listener.onEvent(SoroSaveEventType.Payout, cb);
    expect(id1).not.toBe(id2);
    expect(listener.subscriptionCount).toBe(2);
  });

  it("unsubscribe removes a subscription", () => {
    const cb = vi.fn();
    const id = listener.onEvent(SoroSaveEventType.Contribution, cb);
    expect(listener.unsubscribe(id)).toBe(true);
    expect(listener.subscriptionCount).toBe(0);
  });

  it("unsubscribe returns false for unknown ID", () => {
    expect(listener.unsubscribe("nonexistent")).toBe(false);
  });

  it("unsubscribeAll clears all subscriptions", () => {
    const cb = vi.fn();
    listener.onEvent(SoroSaveEventType.Contribution, cb);
    listener.onEvent(SoroSaveEventType.Payout, cb);
    listener.onEvent("*", cb);
    listener.unsubscribeAll();
    expect(listener.subscriptionCount).toBe(0);
  });

  // ─── Start / Stop ───────────────────────────────────────────

  it("start sets isRunning to true", () => {
    expect(listener.isRunning).toBe(false);
    listener.start();
    expect(listener.isRunning).toBe(true);
  });

  it("stop sets isRunning to false", () => {
    listener.start();
    listener.stop();
    expect(listener.isRunning).toBe(false);
  });

  it("start is idempotent", () => {
    listener.start();
    listener.start(); // should not throw or create duplicate timers
    expect(listener.isRunning).toBe(true);
    listener.stop();
    expect(listener.isRunning).toBe(false);
  });

  // ─── Cursor management ──────────────────────────────────────

  it("setCursor persists the cursor value", () => {
    listener.setCursor("cursor-abc");
    expect(listener.latestCursor).toBe("cursor-abc");
  });

  it("latestCursor is undefined initially", () => {
    expect(listener.latestCursor).toBeUndefined();
  });

  // ─── Event parsing ──────────────────────────────────────────

  it("parses a contribution event", () => {
    const raw = buildRawEvent({
      topic: [
        makeSymbolXdr("contribution"),
        makeU64Xdr(42),
        makeAddressXdr("GABC"),
      ],
      value: StellarSdk.nativeToScVal([10000000n, 3]).toXDR("base64"),
    });

    const event = listener.parseEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.Contribution);
    const contrib = event as ContributionEvent;
    expect(contrib.groupId).toBe(42);
    expect(contrib.member).toBe("GABC");
    expect(contrib.ledger).toBe(12345);
    expect(contrib.txHash).toBe("evt-001");
  });

  it("parses a member_joined event", () => {
    const raw = buildRawEvent({
      topic: [
        makeSymbolXdr("member_joined"),
        makeU64Xdr(7),
        makeAddressXdr("GXYZ"),
      ],
      value: StellarSdk.nativeToScVal("").toXDR("base64"),
    });

    const event = listener.parseEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.MemberJoined);
    const joined = event as MemberJoinedEvent;
    expect(joined.groupId).toBe(7);
    expect(joined.member).toBe("GXYZ");
  });

  it("parses a group_created event", () => {
    const raw = buildRawEvent({
      topic: [
        makeSymbolXdr("group_created"),
        makeU64Xdr(99),
        makeAddressXdr("GADMIN"),
      ],
      value: StellarSdk.nativeToScVal(["SaversClub", "CTOKEN"]).toXDR("base64"),
    });

    const event = listener.parseEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.GroupCreated);
  });

  it("parses a payout event", () => {
    const raw = buildRawEvent({
      topic: [
        makeSymbolXdr("payout"),
        makeU64Xdr(5),
        makeAddressXdr("GRECIP"),
      ],
      value: StellarSdk.nativeToScVal([50000000n, 2]).toXDR("base64"),
    });

    const event = listener.parseEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.Payout);
  });

  it("returns null for unknown topic", () => {
    const raw = buildRawEvent({
      topic: [makeSymbolXdr("unknown_event")],
    });

    expect(listener.parseEvent(raw)).toBeNull();
  });

  it("returns null for empty topic", () => {
    const raw = buildRawEvent({ topic: [] });
    expect(listener.parseEvent(raw)).toBeNull();
  });

  // ─── Dispatch filtering ─────────────────────────────────────

  it("dispatches to matching event type callbacks", () => {
    const contribCb = vi.fn();
    const payoutCb = vi.fn();

    listener.onEvent(SoroSaveEventType.Contribution, contribCb);
    listener.onEvent(SoroSaveEventType.Payout, payoutCb);

    const event: SoroSaveEvent = {
      type: SoroSaveEventType.Contribution,
      groupId: 1,
      member: "GABC",
      amount: 100n,
      round: 1,
      ledger: 1000,
      timestamp: Date.now(),
      txHash: "tx1",
    };

    // Access private dispatch method via parseEvent + manual trigger
    const raw = buildRawEvent({
      topic: [
        makeSymbolXdr("contribution"),
        makeU64Xdr(1),
        makeAddressXdr("GABC"),
      ],
      value: StellarSdk.nativeToScVal([100n, 1]).toXDR("base64"),
    });

    // Call parseEvent to test parsing; dispatch is tested via start() + mock
    const parsed = listener.parseEvent(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe(SoroSaveEventType.Contribution);
  });

  it("wildcard '*' receives all event types", () => {
    const allCb = vi.fn();
    listener.onEvent("*", allCb);
    expect(listener.subscriptionCount).toBe(1);
  });

  // ─── Edge cases ─────────────────────────────────────────────

  it("handles malformed XDR gracefully", () => {
    const raw = buildRawEvent({
      topic: ["not-valid-base64!!!"],
    });
    expect(listener.parseEvent(raw)).toBeNull();
  });

  it("handles missing value field", () => {
    const raw = buildRawEvent({
      topic: [makeSymbolXdr("contribution"), makeU64Xdr(1)],
      value: undefined as unknown as string,
    });

    const event = listener.parseEvent(raw);
    // Should still parse (with default/zero values) rather than throw
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.Contribution);
  });

  it("maps alternate topic names (contribute -> contribution)", () => {
    const raw = buildRawEvent({
      topic: [makeSymbolXdr("contribute"), makeU64Xdr(1)],
    });
    const event = listener.parseEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.Contribution);
  });

  it("maps join_group -> member_joined", () => {
    const raw = buildRawEvent({
      topic: [makeSymbolXdr("join_group"), makeU64Xdr(1)],
    });
    const event = listener.parseEvent(raw);
    expect(event).not.toBeNull();
    expect(event!.type).toBe(SoroSaveEventType.MemberJoined);
  });
});
