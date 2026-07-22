import { ServerApi } from '@stellar/stellar-sdk';
import { EventListener } from './events';
import { Event, EventType, EventSubscription } from './types';

// ... existing code ...

export class SoroSaveClient {
  private eventListener: EventListener;

  constructor(config: SoroSaveClientConfig) {
    // ... existing constructor code ...
    this.eventListener = new EventListener(config.rpcUrl);
  }

  // ... existing methods ...

  /**
   * Subscribe to contract events
   * @param eventType Type of event to subscribe to
   * @param callback Function to call when event occurs
   * @returns Subscription object with unsubscribe method
   */
  public onEvent(
    eventType: EventType,
    callback: (event: Event) => void
  ): EventSubscription {
    return this.eventListener.subscribe(
      eventType,
      callback,
      this.contractId
    );
  }
}