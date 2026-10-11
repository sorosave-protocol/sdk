import { describe, it, expect } from "vitest";
import { Networks, getNetworkConfig, createConfigFromNetwork } from "../src/networks";
import { NetworkConfig } from "../src/types";

describe("Networks Presets", () => {
  it("provides valid TESTNET configuration", () => {
    expect(Networks.TESTNET).toBeDefined();
    expect(Networks.TESTNET.name).toBe("TESTNET");
    expect(Networks.TESTNET.rpcUrl).toBe("https://soroban-testnet.stellar.org");
    expect(Networks.TESTNET.networkPassphrase).toBe("Test SDF Network ; September 2015");
    expect(Networks.TESTNET.horizonUrl).toBe("https://horizon-testnet.stellar.org");
    expect(Networks.TESTNET.friendbotUrl).toBe("https://friendbot.stellar.org");
  });

  it("provides valid MAINNET configuration", () => {
    expect(Networks.MAINNET).toBeDefined();
    expect(Networks.MAINNET.name).toBe("MAINNET");
    expect(Networks.MAINNET.rpcUrl).toBe("https://rpc.mainnet.stellar.org");
    expect(Networks.MAINNET.networkPassphrase).toBe("Public Global Stellar Network ; July 2015");
    expect(Networks.MAINNET.horizonUrl).toBe("https://horizon.stellar.org");
  });

  it("provides valid FUTURENET configuration", () => {
    expect(Networks.FUTURENET).toBeDefined();
    expect(Networks.FUTURENET.name).toBe("FUTURENET");
    expect(Networks.FUTURENET.rpcUrl).toBe("https://rpc-futurenet.stellar.org");
    expect(Networks.FUTURENET.networkPassphrase).toBe("Test SDF Future Network ; October 2022");
    expect(Networks.FUTURENET.horizonUrl).toBe("https://horizon-futurenet.stellar.org");
    expect(Networks.FUTURENET.friendbotUrl).toBe("https://friendbot-futurenet.stellar.org");
  });

  it("provides valid STANDALONE configuration", () => {
    expect(Networks.STANDALONE).toBeDefined();
    expect(Networks.STANDALONE.name).toBe("STANDALONE");
    expect(Networks.STANDALONE.rpcUrl).toBe("http://localhost:8000/soroban/rpc");
    expect(Networks.STANDALONE.networkPassphrase).toBe("Standalone Network ; February 2022");
    expect(Networks.STANDALONE.horizonUrl).toBe("http://localhost:8000");
  });
});

describe("getNetworkConfig", () => {
  it("resolves built-in preset by name", () => {
    const config = getNetworkConfig("TESTNET");
    expect(config).toEqual(Networks.TESTNET);
  });

  it("resolves custom NetworkConfig object", () => {
    const custom: NetworkConfig = {
      name: "CUSTOM",
      rpcUrl: "https://custom.rpc.stellar.org",
      networkPassphrase: "Custom Passphrase",
    };
    const resolved = getNetworkConfig(custom);
    expect(resolved).toEqual(custom);
  });

  it("throws descriptive error for invalid network name", () => {
    expect(() => getNetworkConfig("INVALID" as any)).toThrow(
      /Unknown network preset: INVALID/
    );
  });
});

describe("createConfigFromNetwork", () => {
  it("creates SoroSaveConfig from preset name defaulting to TESTNET", () => {
    const config = createConfigFromNetwork("C123");
    expect(config.contractId).toBe("C123");
    expect(config.rpcUrl).toBe(Networks.TESTNET.rpcUrl);
    expect(config.networkPassphrase).toBe(Networks.TESTNET.networkPassphrase);
    expect(config.network).toEqual(Networks.TESTNET);
  });

  it("creates SoroSaveConfig from MAINNET preset", () => {
    const config = createConfigFromNetwork("C456", "MAINNET");
    expect(config.contractId).toBe("C456");
    expect(config.rpcUrl).toBe(Networks.MAINNET.rpcUrl);
    expect(config.networkPassphrase).toBe(Networks.MAINNET.networkPassphrase);
    expect(config.network).toEqual(Networks.MAINNET);
  });

  it("creates SoroSaveConfig from custom NetworkConfig", () => {
    const custom: NetworkConfig = {
      name: "PRIVATE",
      rpcUrl: "http://private-rpc:8000",
      networkPassphrase: "Private Passphrase",
    };
    const config = createConfigFromNetwork("C789", custom);
    expect(config.contractId).toBe("C789");
    expect(config.rpcUrl).toBe("http://private-rpc:8000");
    expect(config.networkPassphrase).toBe("Private Passphrase");
    expect(config.network).toEqual(custom);
  });
});
