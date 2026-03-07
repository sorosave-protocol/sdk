# Complete Savings Group Lifecycle

This tutorial walks you through the complete lifecycle of a savings group using the SoroSave SDK.

## Overview

A savings group (Ajo/Susu/Chit Fund) lifecycle consists of:

1. **Creation** - Admin creates the group
2. **Formation** - Members join the group
3. **Activation** - Group starts the savings cycle
4. **Contribution** - Members contribute each cycle
5. **Distribution** - Funds are distributed to the recipient
6. **Completion** - All rounds complete, group finishes

## Prerequisites

```typescript
import { SoroSaveClient } from '@sorosave/sdk';

const client = new SoroSaveClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'CONTRACT_ID',
  networkPassphrase: 'Test SDF Network ; September 2015'
});
```

## Step 1: Create a Group

The admin creates a new savings group.

```typescript
// Admin's account
const adminAddress = 'GADMIN...';

// Create group transaction
const createTx = await client.createGroup({
  admin: adminAddress,
  name: 'Family Savings Circle',
  token: 'USDC_CONTRACT_ID', // USDC token contract
  contributionAmount: 1000000000n, // 100 USDC (7 decimals)
  cycleLength: 86400, // 1 day in seconds
  maxMembers: 5
}, adminAddress);

// Sign and submit
const signedTx = await wallet.signTransaction(createTx);
const result = await server.submitTransaction(signedTx);

console.log('Group created! ID:', result.returnValue);
```

## Step 2: Members Join

Invitees join the group during the formation phase.

```typescript
const groupId = 1; // From creation result

// Member 1 joins
const member1Tx = await client.joinGroup(
  'GMEMBER1...',
  groupId,
  'GMEMBER1...'
);
await wallet.signAndSubmit(member1Tx);

// Member 2 joins
const member2Tx = await client.joinGroup(
  'GMEMBER2...',
  groupId,
  'GMEMBER2...'
);
await wallet.signAndSubmit(member2Tx);

// Continue for all members...
console.log('All members joined!');
```

## Step 3: Start the Group

Once all members have joined, the admin starts the group.

```typescript
const startTx = await client.startGroup(groupId, adminAddress);
await wallet.signAndSubmit(startTx);

console.log('Group is now active!');
```

## Step 4: Weekly Contributions

Each cycle, all members contribute.

```typescript
// Round 1
const contributeTx = await client.contribute(
  'GMEMBER1...',
  groupId,
  1000000000n, // 100 USDC
  'GMEMBER1...'
);
await wallet.signAndSubmit(contributeTx);

console.log('Contribution made for Round 1!');
```

## Step 5: Distribution

After all members contribute, distribute to the recipient.

```typescript
const distributeTx = await client.distribute(groupId, adminAddress);
await wallet.signAndSubmit(distributeTx);

console.log('Funds distributed to Round 1 recipient!');
```

## Step 6: Repeat for All Rounds

The cycle repeats for each member.

```typescript
const group = await client.getGroup(groupId);

for (let round = 1; round <= group.maxMembers; round++) {
  // Each member contributes
  for (const member of group.members) {
    const tx = await client.contribute(member, groupId, 1000000000n, member);
    await wallet.signAndSubmit(tx);
  }
  
  // Distribute to current round's recipient
  const distTx = await client.distribute(groupId, adminAddress);
  await wallet.signAndSubmit(distTx);
  
  console.log(`Round ${round} completed!`);
}

console.log('All rounds completed! Group finished.');
```

## Complete Example

```typescript
import { SoroSaveClient } from '@sorosave/sdk';

async function runSavingsGroup() {
  const client = new SoroSaveClient({ /* config */ });
  
  // 1. Create
  const groupId = await createGroup(client);
  
  // 2. Join
  await joinMembers(client, groupId);
  
  // 3. Start
  await startGroup(client, groupId);
  
  // 4-6. Run cycles
  await runAllCycles(client, groupId);
  
  console.log('Savings group completed successfully!');
}

runSavingsGroup().catch(console.error);
```

## Next Steps

- [API Reference](/api/) - Explore all available methods
- [Configuration](/guide/configuration) - Advanced setup options
