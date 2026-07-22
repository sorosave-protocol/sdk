import { SorobanRpc } from "@stellar/stellar-sdk";

export interface ClientOptions {
  rpcUrl: string;
  contractId: string;
  networkPassphrase: string;
}

export interface Group {
  id: number;
  admin: string;
  name: string;
  token: string;
  contributionAmount: bigint;
  cycleLength: number;
  maxMembers: number;
  status: "active" | "completed" | "cancelled";
  members: string[];
}

export interface CreateGroupOptions {
  admin: string;
  name: string;
  token: string;
  contributionAmount: bigint;
  cycleLength: number;
  maxMembers: number;
}

export interface OfflineTransactionOptions {
  sourcePublicKey: string;
  sequenceNumber?: number;
  fee?: number;
  memo?: string;
  timebounds?: {
    minTime?: number;
    maxTime?: number;
  };
}

export interface OfflineTransaction {
  xdr: string;
  sequenceNumber: number;
}

export interface SignedTransaction {
  xdr: string;
}

export interface TransactionResult {
  hash: string;
  ledger: number;
  result: SorobanRpc.Api.GetTransactionResponse;
}