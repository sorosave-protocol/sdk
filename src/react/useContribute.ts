import { useState, useCallback } from "react";
import { useSoroSaveClient, useSoroSaveConfig } from "./context";
import type { TransactionResult } from "../types";
import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Contribute mutation parameters
 */
export interface ContributeParams {
  member: string;
  groupId: number;
  sourceKeypair: StellarSdk.Keypair;
}

/**
 * Hook return type for useContribute
 */
export interface UseContributeResult {
  /** Function to execute the contribution */
  contribute: (params: ContributeParams) => Promise<TransactionResult<void>>;
  /** Loading state for the mutation */
  loading: boolean;
  /** Error if mutation failed */
  error: Error | null;
  /** Reset state */
  reset: () => void;
}

/**
 * React hook to contribute to a savings group.
 * 
 * This hook returns a mutation function for making contributions to a group.
 * It handles transaction building, signing, and submission.
 * 
 * @returns Object containing contribute function, loading state, error, and reset function
 * 
 * @example
 * ```tsx
 * import { useContribute } from "@sorosave/react";
 * import * as StellarSdk from "@stellar/stellar-sdk";
 * 
 * function ContributeButton({ groupId, memberAddress }: { groupId: number; memberAddress: string }) {
 *   const { contribute, loading, error } = useContribute();
 *   const [txHash, setTxHash] = useState<string | null>(null);
 * 
 *   const handleContribute = async () => {
 *     const keypair = StellarSdk.Keypair.fromSecret("YOUR_SECRET_KEY");
 *     
 *     const result = await contribute({
 *       member: memberAddress,
 *       groupId,
 *       sourceKeypair: keypair,
 *     });
 *     
 *     setTxHash(result.txHash);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleContribute} disabled={loading}>
 *         {loading ? "Contributing..." : "Contribute"}
 *       </button>
 *       {error && <div>Error: {error.message}</div>}
 *       {txHash && <div>Transaction: {txHash}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useContribute(): UseContributeResult {
  const client = useSoroSaveClient();
  const config = useSoroSaveConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contribute = useCallback(async (params: ContributeParams): Promise<TransactionResult<void>> => {
    setLoading(true);
    setError(null);

    try {
      // Build the contribution transaction
      const tx = await client.contribute(
        params.member,
        params.groupId,
        params.sourceKeypair.publicKey()
      );

      // Sign the transaction
      tx.sign(params.sourceKeypair);

      // Submit to the network
      const server = new StellarSdk.rpc.Server(config.rpcUrl);
      const response = await server.sendTransaction(tx);

      // Extract transaction hash from response
      const txHash = response.hash;

      // Poll for transaction completion
      const maxAttempts = 30;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const status = await server.getTransaction(txHash);
          if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
            return { result: undefined, txHash };
          } else if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
            throw new Error(`Transaction failed on-chain`);
          }
        } catch {
          // Transaction not yet found, continue polling
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      return { result: undefined, txHash };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client, config.rpcUrl]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    contribute,
    loading,
    error,
    reset,
  };
}