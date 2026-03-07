# Sorosave SDK - English Documentation

Complete documentation for the Sorosave Protocol SDK.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install @sorosave/sdk
# or
yarn add @sorosave/sdk
```

## Quick Start

```typescript
import { SorosaveSDK } from '@sorosave/sdk';

// Initialize SDK
const sdk = new SorosaveSDK({
  network: 'testnet', // or 'mainnet'
  horizonUrl: 'https://horizon-testnet.stellar.org'
});

// Initialize the SDK
await sdk.initialize();

// Get your account info
const account = await sdk.user.getAccount();
console.log('Account:', account.address);
```

## Core Concepts

### Savings Groups

Savings groups are the core feature of Sorosave. A group consists of:
- **Members**: Users who contribute to the group
- **Goal**: Target amount to save
- **Contribution**: Regular amount each member contributes
- **Period**: Time between contributions

### Smart Contracts

All operations are executed through Stellar smart contracts on the Soroban platform.

## API Reference

### SorosaveSDK Class

#### Constructor

```typescript
new SorosaveSDK(config: SDKConfig)
```

**Parameters:**
- `config.network`: 'testnet' | 'mainnet'
- `config.horizonUrl`: Optional custom Horizon URL
- `config.contractId`: Optional custom contract ID

#### Methods

##### initialize()

Initializes the SDK and loads necessary data.

```typescript
await sdk.initialize();
```

##### groups.create()

Creates a new savings group.

```typescript
const group = await sdk.groups.create({
  name: "Family Savings",
  description: "Saving for vacation",
  targetAmount: 10000,
  contributionAmount: 100,
  contributionPeriod: 7, // days
  members: ["address1", "address2"]
});
```

##### groups.join()

Join an existing group.

```typescript
await sdk.groups.join("group-id");
```

##### groups.contribute()

Make a contribution to a group.

```typescript
await sdk.groups.contribute("group-id", 100);
```

##### groups.get()

Get group details.

```typescript
const group = await sdk.groups.get("group-id");
console.log(group.totalSaved, group.memberCount);
```

##### user.getAccount()

Get current user account info.

```typescript
const account = await sdk.user.getAccount();
```

## Examples

### Example 1: Create and Join a Group

```typescript
import { SorosaveSDK } from '@sorosave/sdk';

async function main() {
  const sdk = new SorosaveSDK({ network: 'testnet' });
  await sdk.initialize();
  
  // Create a group
  const group = await sdk.groups.create({
    name: "Trip Fund",
    targetAmount: 5000,
    contributionAmount: 50,
    contributionPeriod: 7,
    members: [friendAddress]
  });
  
  console.log('Group created:', group.id);
}

main();
```

### Example 2: Make Regular Contributions

```typescript
// Contribute to your groups
const myGroups = await sdk.user.getGroups();

for (const group of myGroups) {
  await sdk.groups.contribute(group.id, group.contributionAmount);
  console.log(`Contributed to ${group.name}`);
}
```

### Example 3: Track Progress

```typescript
const group = await sdk.groups.get(groupId);
const progress = (group.totalSaved / group.targetAmount) * 100;

console.log(`Progress: ${progress.toFixed(1)}%`);
console.log(`Members: ${group.memberCount}`);
console.log(`Next contribution: ${group.nextContributionDate}`);
```

## Troubleshooting

### Common Issues

#### "Network Error"

Make sure you're connected to the correct network:
```typescript
const sdk = new SorosaveSDK({
  network: 'testnet' // Use 'mainnet' for production
});
```

#### "Insufficient Balance"

Ensure your account has enough XLM for transaction fees.

#### "Contract Not Found"

Verify the contract ID is correct:
```typescript
const sdk = new SorosaveSDK({
  network: 'testnet',
  contractId: 'your-contract-id'
});
```

### Getting Help

- Check our [FAQ](FAQ.md)
- Join our [Discord community](https://discord.gg/sorosave)
- Open an issue on [GitHub](https://github.com/sorosave-protocol/sdk/issues)

## TypeScript Support

The SDK includes full TypeScript definitions:

```typescript
import { SorosaveSDK, Group, User, SDKConfig } from '@sorosave/sdk';
```

## Next Steps

- Read the [API Reference](API.md)
- Check out [Code Examples](EXAMPLES.md)
- Learn about [Advanced Topics](ADVANCED.md)
