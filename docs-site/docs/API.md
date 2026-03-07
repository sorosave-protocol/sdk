# Sorosave SDK API Documentation

## Installation

```bash
npm install @sorosave/sdk
```

## Quick Start

```typescript
import { SorosaveSDK } from '@sorosave/sdk';

const sdk = new SorosaveSDK({
  network: 'testnet',
  // config options
});

// Initialize
await sdk.initialize();
```

## Core APIs

### Group Management

#### Create Group
```typescript
const group = await sdk.groups.create({
  name: "My Savings Group",
  members: ["address1", "address2"],
  contributionAmount: 100
});
```

#### Get Group
```typescript
const group = await sdk.groups.get("group-id");
console.log(group.name, group.totalSavings);
```

#### List Groups
```typescript
const groups = await sdk.groups.list({
  filter: { minMembers: 2 },
  limit: 10
});
```

### User Operations

#### Get User Savings
```typescript
const savings = await sdk.user.getSavings("user-address");
```

#### Get User Groups
```typescript
const groups = await sdk.user.getGroups("user-address");
```

## Error Handling

```typescript
try {
  await sdk.groups.create({...});
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    // Handle insufficient balance
  }
}
```

## TypeScript Types

```typescript
interface Group {
  id: string;
  name: string;
  members: string[];
  totalSavings: bigint;
  createdAt: Date;
}

interface User {
  address: string;
  groups: Group[];
  totalContributed: bigint;
}
```

## Examples

See `/examples` directory for complete working examples.
