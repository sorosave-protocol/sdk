export enum GroupStatus {
  Forming = "Forming",
  Active = "Active",
  Completed = "Completed",
  Disputed = "Disputed",
  Paused = "Paused",
}

export interface SavingsGroup {
  id: number;
  name: string;
  admin: string;
  token: string;
  contributionAmount: bigint;
  cycleLength: number;
  maxMembers: number;
  members: string[];
  payoutOrder: string[];
  currentRound: number;
  totalRounds: number;
  status: GroupStatus;
  createdAt: number;
}

export interface RoundInfo {
  roundNumber: number;
  recipient: string;
  contributions: Map<string, boolean>;
  totalContributed: bigint;
  isComplete: boolean;
  deadline: number;
}

export interface Dispute {
  raisedBy: string;
  reason: string;
  raisedAt: number;
}

export interface CreateGroupParams {
  admin: string;
  name: string;
  token: string;
  contributionAmount: bigint;
  cycleLength: number;
  maxMembers: number;
}

export interface SoroSaveConfig {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
}

export interface TransactionResult<T = void> {
  result: T;
  txHash: string;
}

// ─── Event Types ──────────────────────────────────────────────────

export enum SoroSaveEventType {
  Contribution = "contribution",
  Payout = "payout",
  GroupCreated = "group_created",
  MemberJoined = "member_joined",
}

export interface ContributionEvent {
  type: SoroSaveEventType.Contribution;
  groupId: number;
  member: string;
  amount: bigint;
  round: number;
  ledger: number;
  timestamp: number;
  txHash: string;
}

export interface PayoutEvent {
  type: SoroSaveEventType.Payout;
  groupId: number;
  recipient: string;
  amount: bigint;
  round: number;
  ledger: number;
  timestamp: number;
  txHash: string;
}

export interface GroupCreatedEvent {
  type: SoroSaveEventType.GroupCreated;
  groupId: number;
  admin: string;
  name: string;
  token: string;
  ledger: number;
  timestamp: number;
  txHash: string;
}

export interface MemberJoinedEvent {
  type: SoroSaveEventType.MemberJoined;
  groupId: number;
  member: string;
  ledger: number;
  timestamp: number;
  txHash: string;
}

export type SoroSaveEvent =
  | ContributionEvent
  | PayoutEvent
  | GroupCreatedEvent
  | MemberJoinedEvent;

export type EventCallback<T extends SoroSaveEvent = SoroSaveEvent> = (
  event: T
) => void;

export interface EventListenerConfig {
  /** Soroban RPC server URL */
  rpcUrl: string;
  /** Contract ID to listen to */
  contractId: string;
  /** Network passphrase */
  networkPassphrase: string;
  /** Polling interval in milliseconds (default: 5000) */
  pollIntervalMs?: number;
  /** Starting ledger to poll from (default: latest) */
  startLedger?: number;
}
