import { useState, useEffect, useCallback } from "react";
import { useSoroSaveClient } from "./context";

/**
 * Hook return type for useMemberGroups
 */
export interface UseMemberGroupsResult {
  /** Array of group IDs the member belongs to */
  groupIds: number[];
  /** Loading state */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to refetch member groups */
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch all groups a member belongs to.
 * 
 * @param address - The wallet address of the member
 * @returns Object containing group IDs, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * import { useMemberGroups } from "@sorosave/react";
 * 
 * function MemberGroups({ address }: { address: string }) {
 *   const { groupIds, loading, error, refetch } = useMemberGroups(address);
 * 
 *   if (loading) return <div>Loading your groups...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 * 
 *   return (
 *     <div>
 *       <h3>Your Groups ({groupIds.length})</h3>
 *       <ul>
 *         {groupIds.map(id => (
 *           <li key={id}>Group #{id}</li>
 *         ))}
 *       </ul>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemberGroups(address: string | null | undefined): UseMemberGroupsResult {
  const client = useSoroSaveClient();
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMemberGroups = useCallback(async () => {
    if (!address) {
      setGroupIds([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ids = await client.getMemberGroups(address);
      setGroupIds(ids);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setGroupIds([]);
    } finally {
      setLoading(false);
    }
  }, [client, address]);

  useEffect(() => {
    fetchMemberGroups();
  }, [fetchMemberGroups]);

  return {
    groupIds,
    loading,
    error,
    refetch: fetchMemberGroups,
  };
}