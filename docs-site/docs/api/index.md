# API Reference

The SoroSave SDK exports the following modules:

## Modules

- [`SoroSaveClient`](./client.md) - Main client class
- [`Types`](./types.md) - TypeScript interfaces and types
- [`Utils`](./utils.md) - Utility functions

## Usage

```typescript
import { SoroSaveClient } from '@sorosave/sdk';
import type { CreateGroupParams, SavingsGroup } from '@sorosave/sdk';
```

## Client Methods

| Method | Description |
|--------|-------------|
| `createGroup()` | Create a new savings group |
| `joinGroup()` | Join an existing group |
| `leaveGroup()` | Leave a group (while forming) |
| `startGroup()` | Start the savings cycle |
| `contribute()` | Make a contribution |
| `distribute()` | Distribute funds to recipient |
| `getGroup()` | Get group details |
| `getGroups()` | List all groups |
