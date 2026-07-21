// Event types for SoroSave protocol
export type EventType = 'contribution' | 'payout' | 'group_created' | 'member_joined';

export interface BaseEvent {
  id: string;
  type: EventType;
  ledger: number;
  createdAt: Date;
}

export interface ContributionEvent extends BaseEvent {
  type: 'contribution';
  groupId: number;
  memberAddress: string;
  amount: bigint;
  cycle: number;
}

export interface PayoutEvent extends BaseEvent {
  type: 'payout';
  groupId: number;
  recipientAddress: string;
  amount: bigint;
  cycle: number;
}

export interface GroupCreatedEvent extends BaseEvent {
  type: 'group_created';
  groupId: number;
  admin: string;
  name: string;
  token: string;
  contributionAmount: bigint;
  cycleLength: number;
  maxMembers: number;
}

export interface MemberJoinedEvent extends BaseEvent {
  type: 'member_joined';
  groupId: number;
  memberAddress: string;
}

export type Event = ContributionEvent | PayoutEvent | GroupCreatedEvent | MemberJoinedEvent;

export interface EventSubscription {
  unsubscribe: () => void;
}