# SoroSaveClient

Main client class for interacting with the SoroSave smart contract.

## Constructor

```typescript
constructor(config: SoroSaveConfig)
```

## Methods

### createGroup

Create a new savings group.

```typescript
async createGroup(
  params: CreateGroupParams,
  source: string
): Promise<Transaction>
```

**Parameters:**
- `params` - Group creation parameters
- `source` - Source account address

**Example:**

```typescript
const tx = await client.createGroup({
  admin: 'G...',
  name: 'My Savings Group',
  token: 'USDC_CONTRACT_ID',
  contributionAmount: 1000000000, // 100 USDC (7 decimals)
  cycleLength: 86400, // 1 day in seconds
  maxMembers: 5
}, sourceAddress);
```

### joinGroup

Join an existing group.

```typescript
async joinGroup(
  member: string,
  groupId: number,
  source: string
): Promise<Transaction>
```

### leaveGroup

Leave a group (only while forming).

```typescript
async leaveGroup(
  member: string,
  groupId: number,
  source: string
): Promise<Transaction>
```

### startGroup

Start the savings cycle.

```typescript
async startGroup(
  groupId: number,
  source: string
): Promise<Transaction>
```

### contribute

Make a contribution to the current cycle.

```typescript
async contribute(
  member: string,
  groupId: number,
  amount: bigint,
  source: string
): Promise<Transaction>
```

### distribute

Distribute funds to the recipient.

```typescript
async distribute(
  groupId: number,
  source: string
): Promise<Transaction>
```

### getGroup

Get group details.

```typescript
async getGroup(groupId: number): Promise<SavingsGroup>
```

### getGroups

List all groups.

```typescript
async getGroups(): Promise<SavingsGroup[]>
```
