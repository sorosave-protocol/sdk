/**
 * GraphQL Schema for Sorosave Protocol
 * Provides flexible querying for frontend applications
 */

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Group {
    id: ID!
    name: String!
    members: [String!]!
    totalSavings: String!
    createdAt: String!
    updatedAt: String!
    memberCount: Int!
  }

  type User {
    address: String!
    groups: [Group!]!
    totalSavings: String!
  }

  type Query {
    # Group queries
    group(id: ID!): Group
    groups(
      minMembers: Int
      maxMembers: Int
      minSavings: String
      createdAfter: String
      createdBefore: String
      limit: Int
      offset: Int
    ): [Group!]!
    
    # User queries
    user(address: String!): User
    
    # Stats
    totalGroups: Int!
    totalSavings: String!
  }

  type Mutation {
    # Group mutations would go here
    createGroup(name: String!, members: [String!]!): Group
  }
`;

export default typeDefs;
