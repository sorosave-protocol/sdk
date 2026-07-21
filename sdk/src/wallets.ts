import { SorobanRpc, TransactionBuilder, xdr } from "@stellar/stellar-sdk";

export interface WalletAdapter {
  /**
   * Signs a transaction using the connected wallet
   * @param transaction The transaction to sign
   * @param networkPassphrase The network passphrase
   * @returns The signed transaction
   */
  signTransaction(transaction: TransactionBuilder, networkPassphrase: string): Promise<TransactionBuilder>;

  /**
   * Gets the public key of the connected wallet
   * @returns The public key
   */
  getPublicKey(): Promise<string>;

  /**
   * Checks if the wallet is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): Promise<boolean>;

  /**
   * Connects to the wallet
   */
  connect(): Promise<void>;

  /**
   * Disconnects from the wallet
   */
  disconnect(): Promise<void>;
}

export class FreighterAdapter implements WalletAdapter {
  private freighter: any;

  constructor() {
    if (typeof window !== 'undefined' && (window as any).freighterApi) {
      this.freighter = (window as any).freighterApi;
    } else {
      throw new Error("Freighter wallet not found");
    }
  }

  async signTransaction(transaction: TransactionBuilder, networkPassphrase: string): Promise<TransactionBuilder> {
    try {
      const signedTx = await this.freighter.signTransaction(transaction.toXDR(), {
        networkPassphrase,
      });
      return TransactionBuilder.fromXDR(signedTx, networkPassphrase);
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPublicKey(): Promise<string> {
    try {
      const publicKey = await this.freighter.getPublicKey();
      return publicKey;
    } catch (error) {
      throw new Error(`Failed to get public key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      return await this.freighter.isConnected();
    } catch (error) {
      console.error("Error checking connection status:", error);
      return false;
    }
  }

  async connect(): Promise<void> {
    try {
      await this.freighter.connect();
    } catch (error) {
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.freighter.disconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  }
}