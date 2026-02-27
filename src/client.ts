import * as StellarSdk from "@stellar/stellar-sdk";
import {
  SoroSaveConfig,
  SavingsGroup,
  RoundInfo,
  CreateGroupParams,
  GroupStatus,
  AccountSequence,
  SubmittedTransaction,
} from "./types";
import { WalletAdapter } from "./wallets";
import { BatchBuilder } from "./batch";

/**
 * SoroSave SDK Client
 *
 * Wraps the SoroSave Soroban smart contract with typed TypeScript methods.
 * Handles transaction building, simulation, and submission.
 */
export class SoroSaveClient {
  private server: StellarSdk.rpc.Server;
  private contractId: string;
  private networkPassphrase: string;
  private walletAdapter?: WalletAdapter;

  constructor(config: SoroSaveConfig, walletAdapter?: WalletAdapter) {
    this.server = new StellarSdk.rpc.Server(config.rpcUrl);
    this.contractId = config.contractId;
    this.networkPassphrase = config.networkPassphrase;
    this.walletAdapter = walletAdapter;
  }

  setWalletAdapter(walletAdapter: WalletAdapter): this {
    this.walletAdapter = walletAdapter;
    return this;
  }

  async buildAndSignTransaction(
    operation: StellarSdk.xdr.Operation,
    sourcePublicKey: string
  ): Promise<StellarSdk.Transaction> {
    const tx = await this.buildTransaction(operation, sourcePublicKey);

    if (!this.walletAdapter) {
      throw new Error("Wallet adapter is not configured.");
    }

    return this.walletAdapter.signTransaction(tx, this.networkPassphrase);
  }

  buildOffline(
    operation: StellarSdk.xdr.Operation,
    sourcePublicKey: string,
    sequenceNumber: AccountSequence
  ): string {
    return this.buildOfflineTransaction(
      operation,
      sourcePublicKey,
      sequenceNumber
    ).toXDR();
  }

  async submitSignedTransaction(
    signedXdr: string
  ): Promise<SubmittedTransaction> {
    const tx = new StellarSdk.Transaction(signedXdr, this.networkPassphrase);
    const submission = await this.server.sendTransaction(tx);
    const status =
      "status" in submission ? String(submission.status) : "PENDING";

    return {
      hash: submission.hash,
      status,
    };
  }

  createBatchBuilder(): BatchBuilder {
    return new BatchBuilder();
  }

  async buildBatchTransaction(
    sourcePublicKey: string,
    batch: BatchBuilder
  ): Promise<StellarSdk.Transaction> {
    const account = await this.server.getAccount(sourcePublicKey);
    return batch.buildTransaction(account, this.networkPassphrase);
  }

  // ─── Group Lifecycle ────────────────────────────────────────────

  /**
   * Create a new savings group.
   */
  async createGroup(
    params: CreateGroupParams,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "create_group",
      new StellarSdk.Address(params.admin).toScVal(),
      StellarSdk.nativeToScVal(params.name, { type: "string" }),
      new StellarSdk.Address(params.token).toScVal(),
      StellarSdk.nativeToScVal(params.contributionAmount, { type: "i128" }),
      StellarSdk.nativeToScVal(params.cycleLength, { type: "u64" }),
      StellarSdk.nativeToScVal(params.maxMembers, { type: "u32" })
    );

    return this.buildTransaction(op, source);
  }

  createGroupBuildOffline(
    params: CreateGroupParams,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "create_group",
      new StellarSdk.Address(params.admin).toScVal(),
      StellarSdk.nativeToScVal(params.name, { type: "string" }),
      new StellarSdk.Address(params.token).toScVal(),
      StellarSdk.nativeToScVal(params.contributionAmount, { type: "i128" }),
      StellarSdk.nativeToScVal(params.cycleLength, { type: "u64" }),
      StellarSdk.nativeToScVal(params.maxMembers, { type: "u32" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  /**
   * Join an existing group.
   */
  async joinGroup(
    member: string,
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "join_group",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  joinGroupBuildOffline(
    member: string,
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "join_group",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  /**
   * Leave a group (only while forming).
   */
  async leaveGroup(
    member: string,
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "leave_group",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  leaveGroupBuildOffline(
    member: string,
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "leave_group",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  /**
   * Start the group (admin only).
   */
  async startGroup(
    admin: string,
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "start_group",
      new StellarSdk.Address(admin).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  startGroupBuildOffline(
    admin: string,
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "start_group",
      new StellarSdk.Address(admin).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  // ─── Contributions ──────────────────────────────────────────────

  /**
   * Contribute to the current round.
   */
  async contribute(
    member: string,
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "contribute",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  contributeBuildOffline(
    member: string,
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "contribute",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  // ─── Payouts ────────────────────────────────────────────────────

  /**
   * Distribute the pot to the current round's recipient.
   */
  async distributePayout(
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "distribute_payout",
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  distributePayoutBuildOffline(
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "distribute_payout",
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  // ─── Admin ──────────────────────────────────────────────────────

  /**
   * Pause a group.
   */
  async pauseGroup(
    admin: string,
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "pause_group",
      new StellarSdk.Address(admin).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  pauseGroupBuildOffline(
    admin: string,
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "pause_group",
      new StellarSdk.Address(admin).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  /**
   * Resume a paused group.
   */
  async resumeGroup(
    admin: string,
    groupId: number,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "resume_group",
      new StellarSdk.Address(admin).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildTransaction(op, source);
  }

  resumeGroupBuildOffline(
    admin: string,
    groupId: number,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "resume_group",
      new StellarSdk.Address(admin).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  /**
   * Raise a dispute.
   */
  async raiseDispute(
    member: string,
    groupId: number,
    reason: string,
    source: string
  ): Promise<StellarSdk.Transaction> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "raise_dispute",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" }),
      StellarSdk.nativeToScVal(reason, { type: "string" })
    );

    return this.buildTransaction(op, source);
  }

  raiseDisputeBuildOffline(
    member: string,
    groupId: number,
    reason: string,
    source: string,
    sequenceNumber: AccountSequence
  ): string {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "raise_dispute",
      new StellarSdk.Address(member).toScVal(),
      StellarSdk.nativeToScVal(groupId, { type: "u64" }),
      StellarSdk.nativeToScVal(reason, { type: "string" })
    );

    return this.buildOffline(op, source, sequenceNumber);
  }

  // ─── Read-Only Queries ──────────────────────────────────────────

  /**
   * Get group details. Returns parsed SavingsGroup object.
   */
  async getGroup(groupId: number): Promise<SavingsGroup> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "get_group",
      StellarSdk.nativeToScVal(groupId, { type: "u64" })
    );

    const result = await this.simulateTransaction(op);
    return this.parseGroup(result);
  }

  /**
   * Get round status.
   */
  async getRoundStatus(groupId: number, round: number): Promise<RoundInfo> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "get_round_status",
      StellarSdk.nativeToScVal(groupId, { type: "u64" }),
      StellarSdk.nativeToScVal(round, { type: "u32" })
    );

    const result = await this.simulateTransaction(op);
    return this.parseRound(result);
  }

  /**
   * Get all groups for a member.
   */
  async getMemberGroups(member: string): Promise<number[]> {
    const contract = new StellarSdk.Contract(this.contractId);
    const op = contract.call(
      "get_member_groups",
      new StellarSdk.Address(member).toScVal()
    );

    const result = await this.simulateTransaction(op);
    return StellarSdk.scValToNative(result) as number[];
  }

  // ─── Internal Helpers ───────────────────────────────────────────

  private async buildTransaction(
    operation: StellarSdk.xdr.Operation,
    sourcePublicKey: string
  ): Promise<StellarSdk.Transaction> {
    const account = await this.server.getAccount(sourcePublicKey);
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30);

    const tx = txBuilder.build();

    const simulated = await this.server.simulateTransaction(tx);

    if (
      StellarSdk.rpc.Api.isSimulationError(simulated)
    ) {
      throw new Error(
        `Simulation failed: ${simulated.error}`
      );
    }

    return StellarSdk.rpc.assembleTransaction(
      tx,
      simulated
    ).build();
  }

  private buildOfflineTransaction(
    operation: StellarSdk.xdr.Operation,
    sourcePublicKey: string,
    sequenceNumber: AccountSequence
  ): StellarSdk.Transaction {
    const sequence = this.normalizeSequence(sequenceNumber);
    const account = new StellarSdk.Account(sourcePublicKey, sequence);

    return new StellarSdk.TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();
  }

  private normalizeSequence(sequenceNumber: AccountSequence): string {
    if (typeof sequenceNumber === "bigint") {
      return sequenceNumber.toString();
    }

    if (typeof sequenceNumber === "number") {
      if (!Number.isFinite(sequenceNumber) || sequenceNumber < 0) {
        throw new Error("Sequence number must be a positive finite number.");
      }
      return Math.floor(sequenceNumber).toString();
    }

    if (!/^\d+$/.test(sequenceNumber)) {
      throw new Error("Sequence number must be a numeric string.");
    }

    return sequenceNumber;
  }

  private async simulateTransaction(
    operation: StellarSdk.xdr.Operation
  ): Promise<StellarSdk.xdr.ScVal> {
    // Use a dummy source for read-only queries
    const keypair = StellarSdk.Keypair.random();
    const account = new StellarSdk.Account(keypair.publicKey(), "0");

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulated = await this.server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    const successResult = simulated as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse;
    if (!successResult.result) {
      throw new Error("No result from simulation");
    }

    return successResult.result.retval;
  }

  private parseGroup(scVal: StellarSdk.xdr.ScVal): SavingsGroup {
    const raw = StellarSdk.scValToNative(scVal) as Record<string, unknown>;
    return {
      id: Number(raw.id),
      name: String(raw.name),
      admin: String(raw.admin),
      token: String(raw.token),
      contributionAmount: BigInt(raw.contribution_amount as string),
      cycleLength: Number(raw.cycle_length),
      maxMembers: Number(raw.max_members),
      members: raw.members as string[],
      payoutOrder: raw.payout_order as string[],
      currentRound: Number(raw.current_round),
      totalRounds: Number(raw.total_rounds),
      status: this.parseStatus(raw.status),
      createdAt: Number(raw.created_at),
    };
  }

  private parseRound(scVal: StellarSdk.xdr.ScVal): RoundInfo {
    const raw = StellarSdk.scValToNative(scVal) as Record<string, unknown>;
    return {
      roundNumber: Number(raw.round_number),
      recipient: String(raw.recipient),
      contributions: new Map(
        Object.entries(raw.contributions as Record<string, boolean>)
      ),
      totalContributed: BigInt(raw.total_contributed as string),
      isComplete: Boolean(raw.is_complete),
      deadline: Number(raw.deadline),
    };
  }

  private parseStatus(status: unknown): GroupStatus {
    const statusStr = String(status);
    const statusMap: Record<string, GroupStatus> = {
      Forming: GroupStatus.Forming,
      Active: GroupStatus.Active,
      Completed: GroupStatus.Completed,
      Disputed: GroupStatus.Disputed,
      Paused: GroupStatus.Paused,
    };
    return statusMap[statusStr] || GroupStatus.Forming;
  }
}
