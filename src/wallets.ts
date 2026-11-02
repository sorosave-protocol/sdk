import * as StellarSdk from "@stellar/stellar-sdk";

export interface WalletCapabilities {
  supportsSignTransaction: boolean;
  supportsSignAuth: boolean;
  networkSupport: string[];
}

export interface WalletAdapter {
  name: string;
  capabilities: WalletCapabilities;
  isAvailable(): Promise<boolean>;
  getAddress(): Promise<string>;
  signTransaction(
    transaction: StellarSdk.Transaction,
    networkPassphrase: string
  ): Promise<StellarSdk.Transaction>;
  signAuthEntry?(
    authEntry: string,
    networkPassphrase: string
  ): Promise<string>;
}

type FreighterAddressPayload = string | { address?: string; error?: unknown };
type FreighterSignPayload = string | { signedTxXdr?: string; signedXdr?: string };

type GlobalRuntime = {
  freighterApi?: {
    isConnected: () => Promise<boolean>;
    getAddress: () => Promise<FreighterAddressPayload>;
    signTransaction?: (args: {
      xdr: string;
      network: string;
      networkPassphrase: string;
    }) => Promise<FreighterSignPayload>;
  };
};

function extractAddress(payload: FreighterAddressPayload): string {
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    if (payload.error) {
      throw new Error("Freighter API failed to return an address.");
    }
    if (typeof payload.address === "string" && payload.address.length > 0) {
      return payload.address;
    }
  }

  throw new Error("Freighter API returned unexpected address payload.");
}

function extractSignedXdr(payload: FreighterSignPayload): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload.signedTxXdr && typeof payload.signedTxXdr === "string") {
    return payload.signedTxXdr;
  }

  if (payload.signedXdr && typeof payload.signedXdr === "string") {
    return payload.signedXdr;
  }

  throw new Error("Freighter API returned unexpected sign payload.");
}

export class FreighterAdapter implements WalletAdapter {
  name = "freighter";
  capabilities: WalletCapabilities = {
    supportsSignTransaction: true,
    supportsSignAuth: false,
    networkSupport: ["testnet", "public"],
  };

  private resolveApi() {
    return (globalThis as unknown as GlobalRuntime).freighterApi;
  }

  async isAvailable(): Promise<boolean> {
    const api = this.resolveApi();
    if (!api) {
      return false;
    }

    try {
      return await api.isConnected();
    } catch {
      return false;
    }
  }

  async getAddress(): Promise<string> {
    const api = this.resolveApi();
    if (!api) {
      throw new Error("Freighter API is unavailable in this runtime.");
    }

    return extractAddress(await api.getAddress());
  }

  async signTransaction(
    transaction: StellarSdk.Transaction,
    networkPassphrase: string
  ): Promise<StellarSdk.Transaction> {
    const api = this.resolveApi();
    if (!api) {
      throw new Error("Freighter API is unavailable in this runtime.");
    }

    if (typeof api.signTransaction !== "function") {
      throw new Error("Freighter API does not expose signTransaction in this environment.");
    }

    const response = await api.signTransaction({
      xdr: transaction.toXDR(),
      network: networkPassphrase,
      networkPassphrase,
    });

    const signedXdr = extractSignedXdr(response);

    const builderAny = StellarSdk.TransactionBuilder as unknown as {
      fromXDR?: (xdr: string, networkPassphrase: string) => StellarSdk.Transaction;
    };
    if (typeof builderAny.fromXDR === "function") {
      return builderAny.fromXDR(
        signedXdr,
        networkPassphrase
      ) as StellarSdk.Transaction;
    }

    const txAny = transaction.constructor as {
      fromXDR?: (xdr: string, networkPassphrase: string) => StellarSdk.Transaction;
    };

    if (typeof txAny.fromXDR !== "function") {
      throw new Error("Unable to parse signed XDR in this SDK/runtime.");
    }

    return txAny.fromXDR(signedXdr, networkPassphrase);
  }

  async signAuthEntry(): Promise<string> {
    throw new Error(
      "FreighterAdapter only supports transaction signing for now."
    );
  }
}
