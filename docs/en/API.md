# Sorosave API Reference

Complete API reference for the Sorosave SDK.

## Core Classes

### SorosaveSDK

The main SDK class for interacting with the Sorosave protocol.

```typescript
class SorosaveSDK {
  constructor(config: SDKConfig);
  
  // Initialize the SDK
  initialize(): Promise<void>;
  
  // Group management
  groups: GroupManager;
  
  // User operations
  user: UserManager;
  
  // Utility methods
  utils: Utils;
}
```

### SDKConfig

Configuration options for the SDK.

```typescript
interface SDKConfig {
  network: 'testnet' | 'mainnet';
  horizonUrl?: string;
  contractId?: string;
  timeout?: number;
}
```

## GroupManager

Manages savings groups.

### Methods

#### `create(options: CreateGroupOptions): Promise<Group>`

Creates a new savings group.

**Parameters:**

```typescript
interface CreateGroupOptions {
  name: string;                    // Group name
  description?: string;            // Optional description
  targetAmount: number;            // Savings goal
  contributionAmount: number;      // Amount per contribution
  contributionPeriod: number;      // Days between contributions
  members: string[];               // Initial member addresses
  isPublic?: boolean;              // Whether group is public
}
```

**Returns:** `Promise<Group>`

**Example:**

```typescript
const group = await sdk.groups.create({
  name: "Vacation Fund",
  targetAmount: 10000,
  contributionAmount: 100,
  contributionPeriod: 7,
  members: [friend1, friend2]
});
```

#### `join(groupId: string): Promise<void>`

Joins an existing group.

**Parameters:**
- `groupId`: The unique group identifier

**Example:**

```typescript
await sdk.groups.join("group-123");
```

#### `contribute(groupId: string, amount: number): Promise<Transaction>`

Makes a contribution to a group.

**Parameters:**
- `groupId`: The group ID
- `amount`: Amount to contribute

**Returns:** `Promise<Transaction>`

**Example:**

```typescript
const tx = await sdk.groups.contribute("group-123", 100);
console.log('Transaction:', tx.hash);
```

#### `get(groupId: string): Promise<Group>`

Gets detailed information about a group.

**Parameters:**
- `groupId`: The group ID

**Returns:** `Promise<Group>`

**Example:**

```typescript
const group = await sdk.groups.get("group-123");
console.log(group.name, group.totalSaved);
```

#### `list(options?: ListOptions): Promise<Group[]>`

Lists available groups.

**Parameters:**

```typescript
interface ListOptions {
  filter?: 'public' | 'private' | 'all';
  limit?: number;
  offset?: number;
}
```

**Example:**

```typescript
const groups = await sdk.groups.list({
  filter: 'public',
  limit: 10
});
```

#### `leave(groupId: string): Promise<void>`

Leaves a group.

**Parameters:**
- `groupId`: The group ID

**Example:**

```typescript
await sdk.groups.leave("group-123");
```

## UserManager

Manages user account operations.

### Methods

#### `getAccount(): Promise<Account>`

Gets the current user's account information.

**Returns:** `Promise<Account>`

**Example:**

```typescript
const account = await sdk.user.getAccount();
console.log(account.address, account.balance);
```

#### `getGroups(): Promise<Group[]>`

Gets all groups the user is a member of.

**Returns:** `Promise<Group[]>`

**Example:**

```typescript
const myGroups = await sdk.user.getGroups();
myGroups.forEach(g => console.log(g.name));
```

#### `getContributions(options?: ContributionOptions): Promise<Contribution[]>`

Gets the user's contribution history.

**Parameters:**

```typescript
interface ContributionOptions {
  groupId?: string;    // Filter by specific group
  limit?: number;
  offset?: number;
}
```

**Returns:** `Promise<Contribution[]>`

**Example:**

```typescript
const contributions = await sdk.user.getContributions({
  groupId: "group-123",
  limit: 10
});
```

## Data Types

### Group

```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  totalSaved: number;
  contributionAmount: number;
  contributionPeriod: number;  // in days
  memberCount: number;
  members: Member[];
  createdAt: Date;
  nextContributionDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  isPublic: boolean;
}
```

### Member

```typescript
interface Member {
  address: string;
  joinedAt: Date;
  totalContributed: number;
  isAdmin: boolean;
}
```

### Account

```typescript
interface Account {
  address: string;
  balance: number;
  groups: string[];  // Group IDs
  totalContributed: number;
  totalSaved: number;
}
```

### Contribution

```typescript
interface Contribution {
  id: string;
  groupId: string;
  amount: number;
  timestamp: Date;
  transactionHash: string;
}
```

### Transaction

```typescript
interface Transaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  fee: number;
}
```

## Error Handling

All methods can throw the following errors:

### SDKError

Base error class for all SDK errors.

```typescript
class SDKError extends Error {
  code: string;
  details?: any;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INSUFFICIENT_BALANCE` | Account doesn't have enough funds |
| `GROUP_NOT_FOUND` | The specified group doesn't exist |
| `NOT_A_MEMBER` | User is not a member of the group |
| `INVALID_AMOUNT` | The contribution amount is invalid |
| `NETWORK_ERROR` | Connection to the network failed |
| `CONTRACT_ERROR` | Smart contract execution failed |
| `UNAUTHORIZED` | User is not authorized for this operation |

### Error Handling Example

```typescript
import { SDKError } from '@sorosave/sdk';

try {
  await sdk.groups.contribute("group-123", 100);
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        console.log('Not enough funds');
        break;
      case 'GROUP_NOT_FOUND':
        console.log('Group does not exist');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

## Events

The SDK emits events for various operations.

### Event Types

```typescript
type SDKEvent = 
  | 'initialized'
  | 'group:created'
  | 'group:joined'
  | 'contribution:made'
  | 'error';
```

### Event Handling

```typescript
sdk.on('group:created', (group) => {
  console.log('Created group:', group.name);
});

sdk.on('contribution:made', (contribution) => {
  console.log('Contributed:', contribution.amount);
});
```

## Constants

```typescript
// Default values
const DEFAULTS = {
  MIN_CONTRIBUTION: 1,
  MAX_MEMBERS: 50,
  MIN_CONTRIBUTION_PERIOD: 1,  // 1 day
  MAX_CONTRIBUTION_PERIOD: 365 // 1 year
};
```

## Advanced Usage

### Custom RPC Endpoints

```typescript
const sdk = new SorosaveSDK({
  network: 'mainnet',
  horizonUrl: 'https://custom-horizon.example.com',
  contractId: 'custom-contract-id'
});
```

### Timeout Configuration

```typescript
const sdk = new SorosaveSDK({
  network: 'testnet',
  timeout: 30000 // 30 seconds
});
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
