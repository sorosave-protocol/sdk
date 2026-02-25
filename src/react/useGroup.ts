import { useState, useEffect, useCallback } from "react";
import { useSoroSaveClient } from "./context";
import type { SavingsGroup } from "../types";

/**
 * Hook return type for useGroup
 */
export interface UseGroupResult {
  /** The group data, null if not loaded or not found */
  group: SavingsGroup | null;
  /** Loading state */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to refetch group data */
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch and monitor a savings group by ID.
 * 
 * @param groupId - The ID of the group to fetch
 * @returns Object containing group data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * import { useGroup } from "@sorosave/react";
 * 
 * function GroupInfo({ groupId }: { groupId: number }) {
 *   const { group, loading, error, refetch } = useGroup(groupId);
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!group) return <div>Group not found</div>;
 * 
 *   return (
 *     <div>
 *       <h2>{group.name}</h2>
 *       <p>Members: {group.members.length}/{group.maxMembers}</p>
 *       <p>Status: {group.status}</p>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGroup(groupId: number | null | undefined): UseGroupResult {
  const client = useSoroSaveClient();
  const [group, setGroup] = useState<SavingsGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroup = useCallback(async () => {
    if (groupId === null || groupId === undefined) {
      setGroup(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await client.getGroup(groupId);
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [client, groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return {
    group,
    loading,
    error,
    refetch: fetchGroup,
  };
}