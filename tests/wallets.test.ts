import * as StellarSdk from "@stellar/stellar-sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SoroSaveClient } from "../src/client";
import { FreighterAdapter, type WalletAdapter } from "../src/wallets";

function buildTx(): StellarSdk.Transaction {
  const keypair = StellarSdk.Keypair.random();
  const account = new StellarSdk.Account(keypair.publicKey(), "1");
  return new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.setOptions({}))
    .setTimeout(30)
    .build();
}

function setFreighter(api: unknown) {
  (globalThis as unknown as { freighterApi?: unknown }).freighterApi = api;
}

describe("FreighterAdapter", () => {
  afterEach(() => {
    delete (globalThis as unknown as { freighterApi?: unknown }).freighterApi;
  });

  it("reports unavailable when the Freighter API is missing", async () => {
    const adapter = new FreighterAdapter();
    expect(await adapter.isAvailable()).toBe(false);
    await expect(adapter.getAddress()).rejects.toThrow("unavailable");
  });

  it("reports availability from isConnected", async () => {
    setFreighter({ isConnected: vi.fn().mockResolvedValue(true) });
    expect(await new FreighterAdapter().isAvailable()).toBe(true);
  });

  it("returns false when isConnected throws", async () => {
    setFreighter({ isConnected: vi.fn().mockRejectedValue(new Error("boom")) });
    expect(await new FreighterAdapter().isAvailable()).toBe(false);
  });

  it("handles string and object address payloads", async () => {
    setFreighter({ getAddress: vi.fn().mockResolvedValue("GABC") });
    expect(await new FreighterAdapter().getAddress()).toBe("GABC");

    setFreighter({ getAddress: vi.fn().mockResolvedValue({ address: "GXYZ" }) });
    expect(await new FreighterAdapter().getAddress()).toBe("GXYZ");
  });

  it("throws when Freighter returns an address error", async () => {
    setFreighter({
      getAddress: vi.fn().mockResolvedValue({ address: "", error: "denied" }),
    });
    await expect(new FreighterAdapter().getAddress()).rejects.toThrow();
  });

  it("signs a transaction from a string payload", async () => {
    const tx = buildTx();
    const signTransaction = vi.fn().mockResolvedValue(tx.toXDR());
    setFreighter({ signTransaction });

    const signed = await new FreighterAdapter().signTransaction(
      tx,
      StellarSdk.Networks.TESTNET
    );

    expect(signTransaction).toHaveBeenCalledTimes(1);
    expect(signed.hash().toString("hex")).toBe(tx.hash().toString("hex"));
  });

  it("signs a transaction from an object payload", async () => {
    const tx = buildTx();
    setFreighter({
      signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: tx.toXDR() }),
    });

    const signed = await new FreighterAdapter().signTransaction(
      tx,
      StellarSdk.Networks.TESTNET
    );
    expect(signed.hash().toString("hex")).toBe(tx.hash().toString("hex"));
  });

  it("throws when signTransaction is not exposed", async () => {
    setFreighter({});
    await expect(
      new FreighterAdapter().signTransaction(buildTx(), StellarSdk.Networks.TESTNET)
    ).rejects.toThrow("signTransaction");
  });

  it("does not support auth entry signing", async () => {
    await expect(new FreighterAdapter().signAuthEntry()).rejects.toThrow();
  });
});

describe("SoroSaveClient wallet adapter", () => {
  const config = {
    contractId: "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE",
    rpcUrl: "https://127.0.0.1:12345",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  };

  it("accepts an adapter in the constructor and uses it to sign", async () => {
    const tx = buildTx();
    const signTransaction = vi.fn().mockImplementation(async (t) => t);
    const adapter: WalletAdapter = {
      name: "mock",
      capabilities: {
        supportsSignTransaction: true,
        supportsSignAuth: false,
        networkSupport: ["testnet"],
      },
      isAvailable: vi.fn().mockResolvedValue(true),
      getAddress: vi.fn().mockResolvedValue("GABC"),
      signTransaction,
    };

    const client = new SoroSaveClient(config, adapter);
    vi.spyOn(client as any, "buildTransaction").mockResolvedValue(tx);

    const result = await client.buildAndSignTransaction({} as never, "GABC");

    expect(result).toBe(tx);
    expect(signTransaction).toHaveBeenCalledWith(tx, config.networkPassphrase);
  });

  it("throws when no adapter is configured", async () => {
    const client = new SoroSaveClient(config);
    vi.spyOn(client as any, "buildTransaction").mockResolvedValue(buildTx());

    await expect(
      client.buildAndSignTransaction({} as never, "GABC")
    ).rejects.toThrow("Wallet adapter is not configured");
  });
});
