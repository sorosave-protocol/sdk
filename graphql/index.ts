/**
 * GraphQL API for Sorosave Protocol
 * Wraps contract queries for efficient frontend data fetching
 */

import { ApolloServer, gql } from "apollo-server-express";
import DataLoader from "dataloader";
import { PubSub } from "graphql-subscriptions";
import { SorosaveSDK } from "../src/index";

// Initialize SDK
const sdk = new SorosaveSDK({ network: "testnet" });

// PubSub for subscriptions
const pubsub = new PubSub();

// GraphQL Schema
export const typeDefs = gql`
  enum GroupStatus {
    FORMING
    ACTIVE
    COMPLETED
    CANCELLED
  }

  type Member {
    address: String!
    joinedAt: String!
    totalContributed: Float!
    isAdmin: Boolean!
  }

  type GroupActivity {
    contributions24h: Int!
    membersJoined7d: Int!
    totalTransactions: Int!
  }

  type Group {
    id: ID!
    name: String!
    description: String
    targetAmount: Float!
    totalSaved: Float!
    contributionAmount: Float!
    contributionPeriod: Int!
    memberCount: Int!
    maxMembers: Int!
    token: String!
    createdAt: String!
    status: GroupStatus!
    isPublic: Boolean!
    members: [Member!]!
    activity: GroupActivity!
    nextContributionDate: String
    progress: Float!
  }

  type Round {
    number: Int!
    startDate: String!
    endDate: String!
    recipient: String
    amount: Float
    status: String!
  }

  type RoundStatus {
    groupId: ID!
    currentRound: Int!
    totalRounds: Int!
    rounds: [Round!]!
    nextPayoutDate: String
    nextPayoutAmount: Float
  }

  type UserGroup {
    group: Group!
    totalContributed: Float!
    isAdmin: Boolean!
    joinedAt: String!
  }

  type Query {
    # Group queries
    group(id: ID!): Group
    groups(
      filter: GroupFilter
      limit: Int = 20
      offset: Int = 0
    ): GroupConnection!
    
    # Member queries
    memberGroups(address: String!): [UserGroup!]!
    
    # Round queries
    roundStatus(groupId: ID!): RoundStatus!
  }

  input GroupFilter {
    status: GroupStatus
    token: String
    minMembers: Int
    isPublic: Boolean
  }

  type GroupConnection {
    items: [Group!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Subscription {
    # Real-time updates
    groupUpdated(groupId: ID!): Group!
    newGroupCreated: Group!
    memberJoined(groupId: ID!): Member!
    contributionMade(groupId: ID!): ContributionEvent!
  }

  type ContributionEvent {
    groupId: ID!
    member: String!
    amount: Float!
    timestamp: String!
    round: Int!
  }
`;

// DataLoaders for batching
const createLoaders = () => ({
  groupLoader: new DataLoader(async (ids: string[]) => {
    // Batch load groups
    const groups = await Promise.all(
      ids.map((id) => sdk.groups.get(id).catch(() => null))
    );
    return groups;
  }),

  memberLoader: new DataLoader(async (keys: string[]) => {
    // keys are in format "groupId:memberAddress"
    const results = await Promise.all(
      keys.map(async (key) => {
        const [groupId, address] = key.split(":");
        const group = await sdk.groups.get(groupId).catch(() => null);
        if (!group) return null;
        return group.members.find((m) => m.address === address);
      })
    );
    return results;
  }),
});

// Resolvers
export const resolvers = {
  Query: {
    group: async (_: any, { id }: { id: string }, { loaders }: any) => {
      return loaders.groupLoader.load(id);
    },

    groups: async (
      _: any,
      {
        filter,
        limit,
        offset,
      }: { filter?: any; limit: number; offset: number },
      { sdk }: any
    ) => {
      // Get all groups
      const allGroups = await sdk.groups.list({ limit: 1000 });

      // Apply filters
      let filtered = allGroups;
      if (filter) {
        if (filter.status) {
          filtered = filtered.filter((g) => g.status === filter.status);
        }
        if (filter.token) {
          filtered = filtered.filter((g) => g.token === filter.token);
        }
        if (filter.minMembers) {
          filtered = filtered.filter(
            (g) => g.memberCount >= filter.minMembers
          );
        }
        if (filter.isPublic !== undefined) {
          filtered = filtered.filter((g) => g.isPublic === filter.isPublic);
        }
      }

      // Paginate
      const paginated = filtered.slice(offset, offset + limit);

      return {
        items: paginated,
        totalCount: filtered.length,
        hasMore: offset + limit < filtered.length,
      };
    },

    memberGroups: async (
      _: any,
      { address }: { address: string },
      { sdk }: any
    ) => {
      const groups = await sdk.user.getGroups(address);
      return groups.map((group: any) => ({
        group,
        totalContributed: group.members.find((m: any) => m.address === address)
          ?.totalContributed || 0,
        isAdmin:
          group.members.find((m: any) => m.address === address)?.isAdmin ||
          false,
        joinedAt:
          group.members.find((m: any) => m.address === address)?.joinedAt ||
          new Date().toISOString(),
      }));
    },

    roundStatus: async (
      _: any,
      { groupId }: { groupId: string },
      { sdk }: any
    ) => {
      const group = await sdk.groups.get(groupId);
      const rounds = await sdk.groups.getRounds(groupId);

      return {
        groupId,
        currentRound: rounds.currentRound,
        totalRounds: rounds.totalRounds,
        rounds: rounds.items,
        nextPayoutDate: rounds.nextPayoutDate,
        nextPayoutAmount: rounds.nextPayoutAmount,
      };
    },
  },

  Group: {
    progress: (parent: any) => {
      return (parent.totalSaved / parent.targetAmount) * 100;
    },

    members: async (parent: any, _: any, { loaders }: any) => {
      // Use DataLoader to batch member loads
      return parent.members;
    },

    activity: (parent: any) => {
      return (
        parent.activity || {
          contributions24h: 0,
          membersJoined7d: 0,
          totalTransactions: 0,
        }
      );
    },
  },

  Subscription: {
    groupUpdated: {
      subscribe: (_: any, { groupId }: { groupId: string }) => {
        return pubsub.asyncIterator(`GROUP_UPDATED_${groupId}`);
      },
    },

    newGroupCreated: {
      subscribe: () => {
        return pubsub.asyncIterator("NEW_GROUP_CREATED");
      },
    },

    memberJoined: {
      subscribe: (_: any, { groupId }: { groupId: string }) => {
        return pubsub.asyncIterator(`MEMBER_JOINED_${groupId}`);
      },
    },

    contributionMade: {
      subscribe: (_: any, { groupId }: { groupId: string }) => {
        return pubsub.asyncIterator(`CONTRIBUTION_MADE_${groupId}`);
      },
    },
  },
};

// Context function
export const createContext = () => {
  return {
    sdk,
    loaders: createLoaders(),
    pubsub,
  };
};

// Create Apollo Server
export const createApolloServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    subscriptions: {
      path: "/subscriptions",
    },
    introspection: true,
    playground: true,
  });
};

export default createApolloServer;
