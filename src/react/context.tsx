import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { SoroSaveClient, type SoroSaveConfig } from "../index";

/**
 * Context for SoroSave SDK client
 */
interface SoroSaveContextValue {
  client: SoroSaveClient;
  config: SoroSaveConfig;
}

const SoroSaveContext = createContext<SoroSaveContextValue | null>(null);

/**
 * Provider props
 */
export interface SoroSaveProviderProps {
  children: ReactNode;
  config: SoroSaveConfig;
}

/**
 * SoroSave Provider Component
 * 
 * Wraps your React app to provide SoroSave SDK access to all child components.
 * 
 * @example
 * ```tsx
 * import { SoroSaveProvider } from "@sorosave/react";
 * 
 * function App() {
 *   return (
 *     <SoroSaveProvider config={{
 *       contractId: "YOUR_CONTRACT_ID",
 *       rpcUrl: "https://soroban-testnet.stellar.org",
 *       networkPassphrase: "Test SDF Network ; September 2015",
 *     }}>
 *       <YourApp />
 *     </SoroSaveProvider>
 *   );
 * }
 * ```
 */
export function SoroSaveProvider({ children, config }: SoroSaveProviderProps): React.ReactElement {
  const client = useMemo(() => new SoroSaveClient(config), [config]);
  
  const value = useMemo(() => ({
    client,
    config,
  }), [client, config]);

  return (
    <SoroSaveContext.Provider value={value}>
      {children}
    </SoroSaveContext.Provider>
  );
}

/**
 * Hook to access the SoroSave client from context
 * @throws Error if used outside of SoroSaveProvider
 */
export function useSoroSaveClient(): SoroSaveClient {
  const context = useContext(SoroSaveContext);
  if (!context) {
    throw new Error("useSoroSaveClient must be used within a SoroSaveProvider");
  }
  return context.client;
}

/**
 * Hook to access the SoroSave config from context
 */
export function useSoroSaveConfig(): SoroSaveConfig {
  const context = useContext(SoroSaveContext);
  if (!context) {
    throw new Error("useSoroSaveConfig must be used within a SoroSaveProvider");
  }
  return context.config;
}

export { SoroSaveContext };