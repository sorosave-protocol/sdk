# Types

## Interfaces

### SoroSaveConfig

```typescript
interface SoroSaveConfig {
  rpcUrl: string;
  contractId: string;
  networkPassphrase: string;
}
```

### CreateGroupParams

```typescript
interface CreateGroupParams {
  admin: string;
  name: string;
  token: string;
  contributionAmount: bigint | number;
  cycleLength: number;
  maxMembers: number;
}
```

### SavingsGroup

```typescript
interface SavingsGroup {
  id: number;
  admin: string;
  name: string;
  token: string;
  contributionAmount: bigint;
  cycleLength: number;
  maxMembers: number;
  currentRound: number;
  status: GroupStatus;
  members: string[];
  createdAt: number;
}
```

### RoundInfo

```typescript
interface RoundInfo {
  roundNumber: number;
  recipient: string;
  contributionAmount: bigint;
  totalCollected: bigint;
  status: RoundStatus;
  contributions: Map<string, bigint>;
}
```

## Enums

### GroupStatus

```typescript
enum GroupStatus {
  Forming = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3
}
```

### RoundStatus

```typescript
enum RoundStatus {
  Pending = 0,
  Collecting = 1,
  Completed = 2
}
```
