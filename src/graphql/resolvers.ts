/**
 * GraphQL Resolvers for Sorosave Protocol
 */

import { GroupIndexer } from './groupIndexer';
import { Group } from './types';

const indexer = new GroupIndexer();

interface Context {
  indexer: GroupIndexer;
}

export const resolvers = {
  Query: {
    async group(_: any, { id }: { id: string }, context: Context) {
      return context.indexer.getGroup(id);
    },
    
    async groups(
      _: any,
      { 
        minMembers, 
        maxMembers, 
        minSavings, 
        createdAfter, 
        createdBefore,
        limit = 100,
        offset = 0 
      }: any,
      context: Context
    ) {
      const filter = {
        minMembers,
        maxMembers,
        minSavings: minSavings ? BigInt(minSavings) : undefined,
        createdAfter: createdAfter ? new Date(createdAfter) : undefined,
        createdBefore: createdBefore ? new Date(createdBefore) : undefined,
      };
      
      const results = await context.indexer.queryGroups(filter);
      return results.slice(offset, offset + limit);
    },
    
    async user(_: any, { address }: { address: string }, context: Context) {
      const groups = await context.indexer.getGroupsByMember(address);
      let totalSavings = 0n;
      
      // Calculate user's total savings across all groups
      for (const group of groups) {
        // This is simplified - in reality, you'd track individual contributions
        totalSavings += group.totalSavings / BigInt(group.members.length);
      }
      
      return {
        address,
        groups,
        totalSavings: totalSavings.toString(),
      };
    },
    
    async totalGroups(_: any, __: any, context: Context) {
      const groups = await context.indexer.queryGroups({});
      return groups.length;
    },
    
    async totalSavings(_: any, __: any, context: Context) {
      const total = await context.indexer.getTotalSavings();
      return total.toString();
    },
  },
  
  Group: {
    memberCount(parent: Group) {
      return parent.members.length;
    },
  },
};

export default resolvers;
