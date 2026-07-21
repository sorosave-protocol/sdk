import { Server, ServerApi } from '@stellar/stellar-sdk';
import { Event, EventType, EventSubscription } from './types';

export class EventListener {
  private server: ServerApi;
  private pollInterval: number;
  private activeSubscriptions: Map<string, EventSubscription> = new Map();

  constructor(rpcUrl: string, pollInterval: number = 5000) {
    this.server = new Server(rpcUrl);
    this.pollInterval = pollInterval;
  }

  public subscribe(
    eventType: EventType,
    callback: (event: Event) => void,
    contractId: string
  ): EventSubscription {
    const subscriptionId = `${eventType}-${contractId}`;
    const existingSubscription = this.activeSubscriptions.get(subscriptionId);

    if (existingSubscription) {
      return existingSubscription;
    }

    let lastLedger: number | null = null;
    let isActive = true;

    const pollEvents = async () => {
      if (!isActive) return;

      try {
        const events = await this.fetchEvents(eventType, contractId, lastLedger);
        events.forEach(callback);
        if (events.length > 0) {
          lastLedger = events[events.length - 1].ledger;
        }
      } catch (error) {
        console.error(`Error fetching ${eventType} events:`, error);
      } finally {
        if (isActive) {
          setTimeout(pollEvents, this.pollInterval);
        }
      }
    };

    pollEvents();

    const subscription: EventSubscription = {
      unsubscribe: () => {
        isActive = false;
        this.activeSubscriptions.delete(subscriptionId);
      }
    };

    this.activeSubscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  private async fetchEvents(
    eventType: EventType,
    contractId: string,
    lastLedger: number | null
  ): Promise<Event[]> {
    const events: Event[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.server
        .events()
        .forContract(contractId)
        .eventType(eventType)
        .cursor(cursor || 'now')
        .order('asc')
        .limit(200)
        .call();

      const newEvents = response.records
        .filter(record => !lastLedger || record.ledger > lastLedger)
        .map(record => this.parseEvent(record, eventType));

      events.push(...newEvents);
      cursor = response.next();
    } while (cursor && events.length < 200);

    return events;
  }

  private parseEvent(record: any, eventType: EventType): Event {
    const baseEvent = {
      id: record.id,
      type: eventType,
      ledger: record.ledger,
      createdAt: new Date(record.created_at)
    };

    switch (eventType) {
      case 'contribution':
        return {
          ...baseEvent,
          groupId: Number(record.data.group_id),
          memberAddress: record.data.member_address,
          amount: BigInt(record.data.amount),
          cycle: Number(record.data.cycle)
        };
      case 'payout':
        return {
          ...baseEvent,
          groupId: Number(record.data.group_id),
          recipientAddress: record.data.recipient_address,
          amount: BigInt(record.data.amount),
          cycle: Number(record.data.cycle)
        };
      case 'group_created':
        return {
          ...baseEvent,
          groupId: Number(record.data.group_id),
          admin: record.data.admin,
          name: record.data.name,
          token: record.data.token,
          contributionAmount: BigInt(record.data.contribution_amount),
          cycleLength: Number(record.data.cycle_length),
          maxMembers: Number(record.data.max_members)
        };
      case 'member_joined':
        return {
          ...baseEvent,
          groupId: Number(record.data.group_id),
          memberAddress: record.data.member_address
        };
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
}