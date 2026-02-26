import * as StellarSdk from "@stellar/stellar-sdk";

export type BatchFailureMode = "abort" | "continue";

export interface BatchOperation {
  op: StellarSdk.xdr.Operation;
  order: number;
  mode: BatchFailureMode;
}

export interface BatchOperationOptions {
  order?: number;
  mode?: BatchFailureMode;
}

export class BatchBuilder {
  private operations: BatchOperation[] = [];
  private insertCursor = 0;

  addOperation(
    op: StellarSdk.xdr.Operation,
    options: BatchOperationOptions = {}
  ): this {
    this.operations.push({
      op,
      order: options.order ?? this.insertCursor,
      mode: options.mode ?? "abort",
    });

    this.insertCursor += 1;
    return this;
  }

  clear(): this {
    this.operations = [];
    this.insertCursor = 0;
    return this;
  }

  get size(): number {
    return this.operations.length;
  }

  get operationsSnapshot(): ReadonlyArray<BatchOperation> {
    return [...this.operations].sort((a, b) => {
      if (a.order === b.order) {
        return 0;
      }
      return a.order - b.order;
    });
  }

  toOperationList(): BatchOperation[] {
    return [...this.operationsSnapshot];
  }

  getFailureModeSummary(): Record<BatchFailureMode, number> {
    return this.operationsSnapshot.reduce(
      (acc, item) => {
        acc[item.mode] += 1;
        return acc;
      },
      { abort: 0, continue: 0 } as Record<BatchFailureMode, number>
    );
  }

  buildTransaction(
    account: StellarSdk.Account,
    networkPassphrase: string,
    timeout = 30
  ): StellarSdk.Transaction {
    if (this.operations.length === 0) {
      throw new Error("BatchBuilder has no operations.");
    }

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: `${this.operations.length * 100}`,
      networkPassphrase,
    }).setTimeout(timeout);

    for (const item of this.operationsSnapshot) {
      txBuilder.addOperation(item.op);
    }

    return txBuilder.build();
  }
}
