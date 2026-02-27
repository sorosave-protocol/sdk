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

export type AccountSequence = string | number | bigint;

export interface TransactionResult<T = void> {
  result: T;
  txHash: string;
}

export interface SubmittedTransaction {
  hash: string;
  status: string;
}
