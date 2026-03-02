/**
 * Event Subscription System
 * Real-time event listener for SoroSave contract events
 * 
 * Issue: https://github.com/sorosave-protocol/sdk/issues/33
 * Bounty: Yes
 */

import * as StellarSdk from "@stellar/stellar-sdk";

export type EventType = 'contribution' | 'payout' | 'group_created' | 'member_joined';

export interface EventData {
  type: EventType;
  groupId: number;
  timestamp: number;
  data: Record<string, unknown>;
}

export type EventCallback = (event: EventData) => void;

interface Subscription {
  id: string;
  eventType: EventType;
  callback: EventCallback;
  createdAt: number;
}

interface EventPollerConfig {
  horizonUrl: string;
  contractId: string;
  pollIntervalMs: number;
  networkPassphrase: string;
}

/**
 * Event Subscription Manager
 * Allows subscribing to SoroSave contract events in real-time
 */
export class EventSubscriptionManager {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private pollerInterval?: ReturnType<typeof setInterval>;
  private lastCursor?: string;
  private config: EventPollerConfig;
  private subscriptionCounter = 0;

  constructor(config: EventPollerConfig) {
    this.config = config;
    // Initialize subscription arrays for each event type
    ['contribution', 'payout', 'group_created', 'member_joined'].forEach(type => {
      this.subscriptions.set(type, []);
    });
  }

  /**
   * Subscribe to a specific event type
   * @param eventType - The type of event to listen for
   * @param callback - Function to call when event occurs
   * @returns Subscription ID for later unsubscription
   */
  onEvent(eventType: EventType, callback: EventCallback): string {
    const id = `sub_${++this.subscriptionCounter}_${Date.now()}`;
    
    const subscription: Subscription = {
      id,
      eventType,
      callback,
      createdAt: Date.now(),
    };

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(subscription);
    this.subscriptions.set(eventType, existing);

    return id;
  }

  /**
   * Unsubscribe from an event
   * @param subscriptionId - The ID returned from onEvent()
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Unsubscribe all listeners for a specific event type
   */
  unsubscribeAll(eventType?: EventType): void {
    if (eventType) {
      this.subscriptions.set(eventType, []);
    } else {
      // Clear all
      this.subscriptions.forEach((_, key) => {
        this.subscriptions.set(key, []);
      });
    }
  }

  /**
   * Start polling for events
   * Call this after setting up subscriptions
   */
  startPolling(): void {
    if (this.pollerInterval) {
      return; // Already polling
    }

    this.pollerInterval = setInterval(() => {
      this.pollEvents();
    }, this.config.pollIntervalMs);

    // Also poll immediately
    this.pollEvents();
  }

  /**
   * Stop polling for events
   */
  stopPolling(): void {
    if (this.pollerInterval) {
      clearInterval(this.pollerInterval);
      this.pollerInterval = undefined;
    }
  }

  /**
   * Poll Horizon for new events
   */
  private async pollEvents(): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.horizonUrl}/events?type=contract&contract_id=${this.config.contractId}&cursor=${this.lastCursor || 'now'}`
      );

      if (!response.ok) {
        console.error('Failed to poll events:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.events && Array.isArray(data.events)) {
        for (const event of data.events) {
          this.lastCursor = event.id;
          this.processEvent(event);
        }
      }
    } catch (error) {
      console.error('Error polling events:', error);
    }
  }

  /**
   * Process a single event and notify subscribers
   */
  private processEvent(rawEvent: Record<string, unknown>): void {
    const eventType = this.parseEventType(rawEvent);
    if (!eventType) return;

    const eventData: EventData = {
      type: eventType,
      groupId: this.extractGroupId(rawEvent),
      timestamp: Date.now(),
      data: this.parseEventData(rawEvent, eventType),
    };

    // Notify all subscribers for this event type
    const subs = this.subscriptions.get(eventType) || [];
    for (const sub of subs) {
      try {
        sub.callback(eventData);
      } catch (error) {
        console.error(`Error in event callback for ${eventType}:`, error);
      }
    }
  }

  /**
   * Parse event type from raw Horizon event
   */
  private parseEventType(rawEvent: Record<string, unknown>): EventType | null {
    const topic = rawEvent.topic as string[];
    if (!topic || topic.length < 2) return null;

    const eventTopic = topic[1] as string;
    
    // Map contract topics to event types
    const topicMap: Record<string, EventType> = {
      'contribution': 'contribution',
      'payout': 'payout',
      'group_created': 'group_created',
      'member_joined': 'member_joined',
    };

    return topicMap[eventTopic] || null;
  }

  /**
   * Extract group ID from event
   */
  private extractGroupId(rawEvent: Record<string, unknown>): number {
    const topic = rawEvent.topic as string[];
    if (!topic || topic.length < 3) return 0;

    const groupIdStr = topic[2] as string;
    return parseInt(groupIdStr, 10) || 0;
  }

  /**
   * Parse event data into typed objects
   */
  private parseEventData(rawEvent: Record<string, unknown>, eventType: EventType): Record<string, unknown> {
    const value = rawEvent.value as Record<string, unknown>;
    
    switch (eventType) {
      case 'contribution':
        return {
          member: value.member,
          amount: value.amount,
          round: value.round,
        };
      case 'payout':
        return {
          recipient: value.recipient,
          amount: value.amount,
          round: value.round,
        };
      case 'group_created':
        return {
          admin: value.admin,
          groupName: value.name,
          token: value.token,
        };
      case 'member_joined':
        return {
          member: value.member,
          groupId: value.group_id,
        };
      default:
        return value;
    }
  }

  /**
   * Get list of active subscriptions
   */
  getSubscriptions(): { eventType: EventType; count: number }[] {
    const result: { eventType: EventType; count: number }[] = [];
    for (const [type, subs] of this.subscriptions.entries()) {
      result.push({
        eventType: type as EventType,
        count: subs.length,
      });
    }
    return result;
  }
}

/**
 * Factory function to create event subscription manager
 */
export function createEventSubscriptionManager(
  rpcUrl: string,
  contractId: string,
  networkPassphrase: string,
  pollIntervalMs: number = 5000
): EventSubscriptionManager {
  return new EventSubscriptionManager({
    horizonUrl: rpcUrl,
    contractId,
    pollIntervalMs,
    networkPassphrase,
  });
}
