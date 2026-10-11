import { NetworkConfig, NetworkName, SoroSaveConfig } from "./types";

/**
 * Built-in Stellar and Soroban network presets.
 * Provides standard RPC endpoints, Horizon URLs, and network passphrases.
 */
export const Networks = {
  TESTNET: {
    name: "TESTNET",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
  },
  MAINNET: {
    name: "MAINNET",
    rpcUrl: "https://rpc.mainnet.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; July 2015",
    horizonUrl: "https://horizon.stellar.org",
  },
  FUTURENET: {
    name: "FUTURENET",
    rpcUrl: "https://rpc-futurenet.stellar.org",
    networkPassphrase: "Test SDF Future Network ; October 2022",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    friendbotUrl: "https://friendbot-futurenet.stellar.org",
  },
  STANDALONE: {
    name: "STANDALONE",
    rpcUrl: "http://localhost:8000/soroban/rpc",
    networkPassphrase: "Standalone Network ; February 2022",
    horizonUrl: "http://localhost:8000",
    friendbotUrl: "http://localhost:8000/friendbot",
  },
} as const;

/**
 * Resolve a network preset or custom NetworkConfig object.
 *
 * @param networkOrConfig Name of standard network preset ("TESTNET" | "MAINNET" | "FUTURENET" | "STANDALONE") or custom NetworkConfig
 * @returns Fully resolved NetworkConfig
 */
export function getNetworkConfig(
  networkOrConfig: NetworkName | NetworkConfig
): NetworkConfig {
  if (typeof networkOrConfig === "string") {
    const config = Networks[networkOrConfig];
    if (!config) {
      throw new Error(`Unknown network preset: ${networkOrConfig}. Expected one of: TESTNET, MAINNET, FUTURENET, STANDALONE`);
    }
    return config;
  }
  return networkOrConfig;
}

/**
 * Create a SoroSaveConfig configuration using a network preset or custom config.
 *
 * @param contractId Deployed SoroSave contract ID
 * @param network Network preset or configuration (defaults to TESTNET)
 * @returns Fully populated SoroSaveConfig object
 */
export function createConfigFromNetwork(
  contractId: string,
  network: NetworkName | NetworkConfig = "TESTNET"
): SoroSaveConfig {
  const net = getNetworkConfig(network);
  return {
    contractId,
    rpcUrl: net.rpcUrl,
    networkPassphrase: net.networkPassphrase,
    network: net,
  };
}
