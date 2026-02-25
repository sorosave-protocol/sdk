/**
 * @sorosave/react
 * 
 * React hooks for the SoroSave SDK - Decentralized Group Savings Protocol on Soroban
 * 
 * @example
 * ```tsx
 * import { 
 *   SoroSaveProvider, 
 *   useGroup, 
 *   useContribute, 
 *   useMemberGroups 
 * } from "@sorosave/react";
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

// Context and Provider
export { 
  SoroSaveProvider, 
  useSoroSaveClient, 
  useSoroSaveConfig,
  type SoroSaveProviderProps 
} from "./context";

// Hooks
export { useGroup, type UseGroupResult } from "./useGroup";
export { useContribute, type UseContributeResult, type ContributeParams } from "./useContribute";
export { useMemberGroups, type UseMemberGroupsResult } from "./useMemberGroups";

// Re-export types for convenience
export type { 
  SavingsGroup, 
  RoundInfo, 
  GroupStatus, 
  CreateGroupParams,
  SoroSaveConfig,
  TransactionResult,
} from "../types";