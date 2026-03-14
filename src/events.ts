import * as StellarSdk from "@stellar/stellar-sdk";
import {
  SoroSaveEventType,
  SoroSaveEvent,
  EventCallback,
  EventListenerConfig,
  ContributionEvent,
  PayoutEvent,
  GroupCreatedEvent,
  MemberJoinedEvent,
} from "./types";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

/**
 * Maps Soroban contract topic symbols to SoroSaveEventType.
 */
const TOPIC_TO_EVENT_TYPE: Record<string, SoroSaveEventType> = {
  contribution: SoroSaveEventType.Contribution,
  contribute: SoroSaveEventType.Contribution,
  payout: SoroSaveEventType.Payout,
  distribute_payout: SoroSaveEventType.Payout,
  group_created: SoroSaveEventType.GroupCreated,
  create_group: SoroSaveEventType.GroupCreated,
  member_joined: SoroSaveEventType.MemberJoined,
  join_group: SoroSaveEventType.MemberJoined,
};

type SubscriptionId = string;

interface Subscription {
  id: SubscriptionId;
  eventType: SoroSaveEventType | "*";
  callback: EventCallback;
}

/**
 * SoroSaveEventListener
 *
 * Polls the Soroban RPC `getEvents` endpoint for contract events,
 * parses them into typed objects, and dispatches to registered callbacks.
 *
 * Tracks a cursor (latest seen ledger) so restarts resume from where
 * they left off rather than replaying or missing events.
 *
 * @example
 * ```ts
 * const listener = new SoroSaveEventListener({
 *   rpcUrl: "https://soroban-testnet.stellar.org",
 *   contractId: "CABC…",
 *   networkPassphrase: Networks.TESTNET,
 * });
 *
 * const subId = listener.onEvent("contribution", (event) => {
 *   console.log(`${event.member} contributed to group ${event.groupId}`);
 * });
 *
 * listener.start();
 *
 * // Later:
 * listener.unsubscribe(subId);
 * listener.stop();
 * ```
 */
export class SoroSaveEventListener {
  private server: StellarSdk.rpc.Server;
  private contractId: string;
  private pollIntervalMs: number;
  private subscriptions = new Map<SubscriptionId, Subscription>();
  private cursor: string | undefined;
  private startLedger: number | undefined;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private polling = false;
  private subCounter = 0;

  constructor(config: EventListenerConfig) {
    this.server = new StellarSdk.rpc.Server(config.rpcUrl);
    this.contractId = config.contractId;
    this.pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.startLedger = config.startLedger;
  }

  // ─── Public API ────────────────────────────────────────────────

  /**
   * Register a callback for a specific event type (or "*" for all).
   * Returns a subscription ID that can be passed to `unsubscribe()`.
   */
  onEvent(
    eventType: SoroSaveEventType | "*",
    callback: EventCallback
  ): SubscriptionId {
    const id = `sub_${++this.subCounter}`;
    this.subscriptions.set(id, { id, eventType, callback });
    return id;
  }

  /**
   * Remove a subscription by its ID.
   * Returns `true` if the subscription existed and was removed.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Remove all subscriptions.
   */
  unsubscribeAll(): void {
    this.subscriptions.clear();
  }

  /**
   * Start polling for events. Idempotent — calling while already
   * running is a no-op.
   */
  start(): void {
    if (this.timerId !== null) return;
    this.timerId = setInterval(() => this.poll(), this.pollIntervalMs);
    // Fire an initial poll immediately
    void this.poll();
  }

  /**
   * Stop polling. Does NOT clear subscriptions — call `unsubscribeAll()`
   * if you want a full teardown.
   */
  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Whether the listener is currently polling.
   */
  get isRunning(): boolean {
    return this.timerId !== null;
  }

  /**
   * Current number of active subscriptions.
   */
  get subscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * The latest cursor (paging token). Useful for persistence across restarts.
   */
  get latestCursor(): string | undefined {
    return this.cursor;
  }

  /**
   * Resume from a previously persisted cursor.
   */
  setCursor(cursor: string): void {
    this.cursor = cursor;
  }

  // ─── Internals ─────────────────────────────────────────────────

  /**
   * Single poll cycle — fetch events from RPC, parse, and dispatch.
   * Protected against re-entrance via `this.polling` flag.
   */
  private async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    try {
      const events = await this.fetchEvents();
      for (const raw of events) {
        const parsed = this.parseEvent(raw);
        if (parsed) {
          this.dispatch(parsed);
        }
      }
    } catch {
      // Swallow transient network errors; the next tick will retry.
    } finally {
      this.polling = false;
    }
  }

  private async fetchEvents(): Promise<StellarSdk.rpc.Api.EventResponse[]> {
    const filters: StellarSdk.rpc.Api.EventFilter[] = [
      {
        type: "contract",
        contractIds: [this.contractId],
      },
    ];

    // Build request params based on whether we have a cursor or need startLedger
    let response: StellarSdk.rpc.Api.GetEventsResponse;

    if (this.cursor) {
      response = await this.server.getEvents({
        filters,
        cursor: this.cursor,
        limit: 100,
      });
    } else {
      // Need startLedger for initial query
      const ledger = this.startLedger ?? await this.resolveLatestLedger();
      response = await this.server.getEvents({
        startLedger: ledger,
        filters,
        limit: 100,
      });
    }

    // Advance cursor to the latest event's paging token
    if (response.events.length > 0) {
      const lastEvent = response.events[response.events.length - 1];
      this.cursor = lastEvent.pagingToken;
    }

    return response.events;
  }

  private async resolveLatestLedger(): Promise<number> {
    const info = await this.server.getLatestLedger();
    return info.sequence;
  }

  /**
   * Parse a raw Soroban event into a typed SoroSaveEvent, or `null`
   * if the topic is unrecognised.
   */
  parseEvent(
    raw: StellarSdk.rpc.Api.EventResponse
  ): SoroSaveEvent | null {
    const topic = this.extractTopicSymbol(raw);
    if (!topic) return null;

    const eventType = TOPIC_TO_EVENT_TYPE[topic];
    if (!eventType) return null;

    const txHash = raw.id ?? "";
    const ledger = raw.ledger;
    const timestamp = raw.ledgerClosedAt
      ? new Date(raw.ledgerClosedAt).getTime()
      : 0;

    // Parse body values based on event type
    const values = this.extractValues(raw);

    switch (eventType) {
      case SoroSaveEventType.Contribution:
        return {
          type: SoroSaveEventType.Contribution,
          groupId: this.toNumber(values[0]),
          member: this.toAddress(values[1]),
          amount: this.toBigInt(values[2]),
          round: this.toNumber(values[3]),
          ledger,
          timestamp,
          txHash,
        } satisfies ContributionEvent;

      case SoroSaveEventType.Payout:
        return {
          type: SoroSaveEventType.Payout,
          groupId: this.toNumber(values[0]),
          recipient: this.toAddress(values[1]),
          amount: this.toBigInt(values[2]),
          round: this.toNumber(values[3]),
          ledger,
          timestamp,
          txHash,
        } satisfies PayoutEvent;

      case SoroSaveEventType.GroupCreated:
        return {
          type: SoroSaveEventType.GroupCreated,
          groupId: this.toNumber(values[0]),
          admin: this.toAddress(values[1]),
          name: this.toString(values[2]),
          token: this.toAddress(values[3]),
          ledger,
          timestamp,
          txHash,
        } satisfies GroupCreatedEvent;

      case SoroSaveEventType.MemberJoined:
        return {
          type: SoroSaveEventType.MemberJoined,
          groupId: this.toNumber(values[0]),
          member: this.toAddress(values[1]),
          ledger,
          timestamp,
          txHash,
        } satisfies MemberJoinedEvent;

      default:
        return null;
    }
  }

  private dispatch(event: SoroSaveEvent): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.eventType === "*" || sub.eventType === event.type) {
        try {
          sub.callback(event);
        } catch {
          // Don't let a subscriber error break the dispatch loop
        }
      }
    }
  }

  // ─── ScVal Helpers ─────────────────────────────────────────────

  private extractTopicSymbol(
    raw: StellarSdk.rpc.Api.EventResponse
  ): string | null {
    const topic = raw.topic;
    if (!topic || topic.length === 0) return null;

    try {
      const val = this.toScVal(topic[0]);
      if (!val) return null;
      const native = StellarSdk.scValToNative(val);
      return typeof native === "string" ? native : null;
    } catch {
      return null;
    }
  }

  private extractValues(
    raw: StellarSdk.rpc.Api.EventResponse
  ): StellarSdk.xdr.ScVal[] {
    const values: StellarSdk.xdr.ScVal[] = [];

    // Topic segments beyond the first one are additional indexed params
    if (raw.topic) {
      for (let i = 1; i < raw.topic.length; i++) {
        try {
          const val = this.toScVal(raw.topic[i]);
          if (val) values.push(val);
        } catch {
          // skip unparseable topics
        }
      }
    }

    // The value field contains the non-indexed data
    if (raw.value) {
      try {
        const bodyVal = this.toScVal(raw.value);
        if (bodyVal) {
          // If it's a map or vec, flatten into individual values
          const native = StellarSdk.scValToNative(bodyVal);
          if (Array.isArray(native)) {
            for (const item of native) {
              values.push(StellarSdk.nativeToScVal(item));
            }
          } else {
            values.push(bodyVal);
          }
        }
      } catch {
        // skip unparseable body
      }
    }

    return values;
  }

  /**
   * Coerce a topic/value entry to ScVal.
   * The SDK types say xdr.ScVal but the RPC may return base64 strings.
   */
  private toScVal(
    input: StellarSdk.xdr.ScVal | string
  ): StellarSdk.xdr.ScVal | null {
    if (typeof input === "string") {
      try {
        return StellarSdk.xdr.ScVal.fromXDR(input, "base64");
      } catch {
        return null;
      }
    }
    return input;
  }

  private toNumber(val: StellarSdk.xdr.ScVal | undefined): number {
    if (!val) return 0;
    try {
      return Number(StellarSdk.scValToNative(val));
    } catch {
      return 0;
    }
  }

  private toBigInt(val: StellarSdk.xdr.ScVal | undefined): bigint {
    if (!val) return 0n;
    try {
      const native = StellarSdk.scValToNative(val);
      return BigInt(native);
    } catch {
      return 0n;
    }
  }

  private toAddress(val: StellarSdk.xdr.ScVal | undefined): string {
    if (!val) return "";
    try {
      return String(StellarSdk.scValToNative(val));
    } catch {
      return "";
    }
  }

  private toString(val: StellarSdk.xdr.ScVal | undefined): string {
    if (!val) return "";
    try {
      return String(StellarSdk.scValToNative(val));
    } catch {
      return "";
    }
  }
}
