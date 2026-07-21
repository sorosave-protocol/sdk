import { SorobanRpc, TransactionBuilder, xdr, Address, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { ClientOptions, Group, CreateGroupOptions, OfflineTransactionOptions, OfflineTransaction, SignedTransaction, TransactionResult } from "./types";

export class SoroSaveClient {
  private rpcUrl: string;
  private contractId: string;
  private networkPassphrase: string;
  private server: SorobanRpc.Server;

  constructor(options: ClientOptions) {
    this.rpcUrl = options.rpcUrl;
    this.contractId = options.contractId;
    this.networkPassphrase = options.networkPassphrase;
    this.server = new SorobanRpc.Server(this.rpcUrl, { allowHttp: this.rpcUrl.startsWith("http://") });
  }

  // Existing methods...

  async buildOfflineTransfer(
    destination: string,
    amount: bigint,
    options: OfflineTransactionOptions
  ): Promise<OfflineTransaction> {
    const sourceAccount = await this.getAccount(options.sourcePublicKey);
    const sequenceNumber = options.sequenceNumber || sourceAccount.sequenceNumber();

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: options.fee || 100,
      networkPassphrase: this.networkPassphrase,
      timebounds: options.timebounds,
    })
      .addOperation({
        type: "payment",
        destination,
        amount: amount.toString(),
        asset: "native",
      })
      .setTimeout(30)
      .build();

    return {
      xdr: transaction.toXDR(),
      sequenceNumber,
    };
  }

  async buildOfflineContractInvoke(
    method: string,
    args: xdr.ScVal[],
    options: OfflineTransactionOptions
  ): Promise<OfflineTransaction> {
    const sourceAccount = await this.getAccount(options.sourcePublicKey);
    const sequenceNumber = options.sequenceNumber || sourceAccount.sequenceNumber();

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: options.fee || 100,
      networkPassphrase: this.networkPassphrase,
      timebounds: options.timebounds,
    })
      .addOperation({
        type: "invokeHostFunction",
        hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract({
          contractId: Address.fromString(this.contractId).toScAddress(),
          functionName: method,
          args: args,
        }),
      })
      .setTimeout(30)
      .build();

    return {
      xdr: transaction.toXDR(),
      sequenceNumber,
    };
  }

  async submitSignedTransaction(signedXdr: string): Promise<TransactionResult> {
    const transaction = new SorobanRpc.Transaction(signedXdr);
    const sendResponse = await this.server.sendTransaction(transaction);
    if (SorobanRpc.Api.isSendTransactionError(sendResponse)) {
      throw new Error(`Error sending transaction: ${sendResponse.error}`);
    }

    const getResponse = await this.server.getTransaction(sendResponse.hash);
    if (SorobanRpc.Api.isGetTransactionError(getResponse)) {
      throw new Error(`Error getting transaction: ${getResponse.error}`);
    }

    return {
      hash: sendResponse.hash,
      ledger: getResponse.ledger,
      result: getResponse,
    };
  }

  private async getAccount(publicKey: string): Promise<SorobanRpc.Api.Account> {
    const account = await this.server.getAccount(publicKey);
    return account;
  }
}