/**
 * GraphQL API Layer for SoroSave SDK
 * Efficient frontend data fetching with batching
 * 
 * Issue: https://github.com/sorosave-protocol/sdk/issues/51
 * Bounty: Yes
 */

import { SoroSaveClient, type SavingsGroup, type RoundInfo } from '../src/client';

// GraphQL Schema Definition
export const typeDefs = `
  type SavingsGroup {
    id: ID!
    name: String!
    admin: String!
    token: String!
    contributionAmount: String!
    cycleLength: Int!
    maxMembers: Int!
    members: [String!]!
    payoutOrder: [String!]!
    currentRound: Int!
    totalRounds: Int!
    status: GroupStatus!
    createdAt: Int!
  }

  enum GroupStatus {
    Forming
    Active
    Completed
    Disputed
    Paused
  }

  type RoundInfo {
    roundNumber: Int!
    recipient: String!
    contributions: [String!]!
    totalContributed: String!
    isComplete: Boolean!
    deadline: Int!
  }

  type GroupList {
    groups: [SavingsGroup!]!
    totalCount: Int!
  }

  type Query {
    group(groupId: ID!): SavingsGroup
    groups(limit: Int, offset: Int): GroupList
    memberGroups(member: String!): [ID!]!
    roundStatus(groupId: ID!, round: Int!): RoundInfo
  }

  type Subscription {
    groupUpdated(groupId: ID!): SavingsGroup
    newContribution(groupId: ID!): ContributionEvent
    newPayout(groupId: ID!): PayoutEvent
  }

  type ContributionEvent {
    groupId: ID!
    member: String!
    amount: String!
    round: Int!
  }

  type PayoutEvent {
    groupId: ID!
    recipient: String!
    amount: String!
    round: Int!
  }
`;

// GraphQL Resolvers
export interface Resolvers {
  Query: {
    group: (parent: unknown, args: { groupId: string }, context: { client: SoroSaveClient }) => Promise<SavingsGroup | null>;
    groups: (parent: unknown, args: { limit?: number; offset?: number }, context: { client: SoroSaveClient }) => Promise<{ groups: SavingsGroup[]; totalCount: number }>;
    memberGroups: (parent: unknown, args: { member: string }, context: { client: SoroSaveClient }) => Promise<number[]>;
    roundStatus: (parent: unknown, args: { groupId: string; round: number }, context: { client: SoroSaveClient }) => Promise<RoundInfo | null>;
  };
}

export const resolvers: Resolvers = {
  Query: {
    group: async (_parent, { groupId }, { client }) => {
      try {
        return await client.getGroup(parseInt(groupId, 10));
      } catch (error) {
        console.error('Error fetching group:', error);
        return null;
      }
    },
    
    groups: async (_parent, { limit = 10, offset = 0 }, { client }) => {
      // This would typically fetch from an indexer or database
      // For now, return mock structure
      const groups: SavingsGroup[] = [];
      return {
        groups: groups.slice(offset, offset + limit),
        totalCount: groups.length,
      };
    },
    
    memberGroups: async (_parent, { member }, { client }) => {
      try {
        return await client.getMemberGroups(member);
      } catch (error) {
        console.error('Error fetching member groups:', error);
        return [];
      }
    },
    
    roundStatus: async (_parent, { groupId, round }, { client }) => {
      try {
        return await client.getRoundStatus(parseInt(groupId, 10), round);
      } catch (error) {
        console.error('Error fetching round status:', error);
        return null;
      }
    },
  },
};

// DataLoader for batching contract calls
export class ContractDataLoader {
  private groupIds: number[] = [];
  private roundIds: { groupId: number; round: number }[] = [];
  private client: SoroSaveClient;

  constructor(client: SoroSaveClient) {
    this.client = client;
  }

  loadGroup(groupId: number): Promise<SavingsGroup> {
    this.groupIds.push(groupId);
    return this.batchGroups().then(groups => groups[groupId]);
  }

  loadRoundStatus(groupId: number, round: number): Promise<RoundInfo> {
    this.roundIds.push({ groupId, round });
    return this.batchRoundStatuses().then(statuses => {
      const key = `${groupId}-${round}`;
      return statuses[key];
    });
  }

  private async batchGroups(): Promise<Record<number, SavingsGroup>> {
    const uniqueIds = [...new Set(this.groupIds)];
    this.groupIds = [];
    
    const results: Record<number, SavingsGroup> = {};
    
    // Process in parallel but limit concurrency
    const batchSize = 5;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const promises = batch.map(async (id) => {
        try {
          const group = await this.client.getGroup(id);
          results[id] = group;
        } catch (error) {
          console.error(`Error loading group ${id}:`, error);
        }
      });
      await Promise.all(promises);
    }
    
    return results;
  }

  private async batchRoundStatuses(): Promise<Record<string, RoundInfo>> {
    const uniqueIds = [...new Set(this.roundIds.map(r => `${r.groupId}-${r.round}`))];
    this.roundIds = [];
    
    const results: Record<string, RoundInfo> = {};
    
    const batchSize = 5;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const promises = batch.map(async (key) => {
        const [groupId, round] = key.split('-').map(Number);
        try {
          const status = await this.client.getRoundStatus(groupId, round);
          results[key] = status;
        } catch (error) {
          console.error(`Error loading round status ${key}:`, error);
        }
      });
      await Promise.all(promises);
    }
    
    return results;
  }
}

// Factory function to create GraphQL server
export function createGraphQLServer(client: SoroSaveClient) {
  return {
    typeDefs,
    resolvers: {
      ...resolvers,
      Query: {
        ...resolvers.Query,
      },
    },
    context: { client },
  };
}

export { typeDefs as schema, resolvers };
