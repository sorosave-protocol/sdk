# SoroSave SDK

TypeScript SDK for interacting with the SoroSave smart contracts on Soroban.

## Installation

```bash
npm install @sorosave/sdk
```

### React Hooks

If you're using React, you can also install the peer dependency:

```bash
npm install react @sorosave/sdk
```

## Usage

### Core SDK

```typescript
import { SoroSaveClient } from "@sorosave/sdk";

const client = new SoroSaveClient({
  rpcUrl: "https://soroban-testnet.stellar.org",
  contractId: "YOUR_CONTRACT_ID",
  networkPassphrase: "Test SDF Network ; September 2015",
});

const tx = await client.createGroup({
  admin: "G...",
  name: "My Savings Group",
  token: "TOKEN_ADDRESS",
  contributionAmount: 1000000n,
  cycleLength: 86400,
  maxMembers: 5,
}, sourcePublicKey);

const group = await client.getGroup(1);
```

### React Hooks

The SDK includes React hooks for easy frontend integration:

```tsx
import { 
  SoroSaveProvider, 
  useGroup, 
  useContribute, 
  useMemberGroups 
} from "@sorosave/react";

// 1. Wrap your app with the provider
function App() {
  return (
    <SoroSaveProvider config={{
      contractId: "YOUR_CONTRACT_ID",
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    }}>
      <YourApp />
    </SoroSaveProvider>
  );
}

// 2. Use hooks in your components
function GroupInfo({ groupId }: { groupId: number }) {
  const { group, loading, error, refetch } = useGroup(groupId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div>
      <h2>{group.name}</h2>
      <p>Members: {group.members.length}/{group.maxMembers}</p>
      <p>Status: {group.status}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// 3. Contribute to a group
function ContributeButton({ groupId, memberAddress }: { 
  groupId: number; 
  memberAddress: string 
}) {
  const { contribute, loading, error } = useContribute();

  const handleContribute = async () => {
    const keypair = StellarSdk.Keypair.fromSecret("YOUR_SECRET_KEY");
    await contribute({
      member: memberAddress,
      groupId,
      sourceKeypair: keypair,
    });
  };

  return (
    <button onClick={handleContribute} disabled={loading}>
      {loading ? "Contributing..." : "Contribute"}
    </button>
  );
}

// 4. Get all groups for a member
function MemberGroups({ address }: { address: string }) {
  const { groupIds, loading, refetch } = useMemberGroups(address);

  return (
    <div>
      <h3>Your Groups ({groupIds.length})</h3>
      <ul>
        {groupIds.map(id => <li key={id}>Group #{id}</li>)}
      </ul>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `useGroup(groupId)` | Fetch and monitor a savings group by ID |
| `useContribute()` | Mutation hook for making contributions |
| `useMemberGroups(address)` | Get all groups a member belongs to |
| `useSoroSaveClient()` | Access the raw SDK client |
| `useSoroSaveConfig()` | Access the current configuration |

## API

### Core SDK Methods

- `createGroup()` — Create a new savings group
- `joinGroup()` — Join an existing group
- `leaveGroup()` — Leave a group (while forming)
- `startGroup()` — Start the group (admin only)
- `contribute()` — Contribute to the current round
- `distributePayout()` — Distribute pot to recipient
- `pauseGroup()` / `resumeGroup()` — Admin controls
- `raiseDispute()` — Raise a dispute
- `getGroup()` — Get group details
- `getRoundStatus()` — Get round info
- `getMemberGroups()` — Get all groups for a member

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Protocol architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to contribute

## License

MIT