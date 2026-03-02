# SoroSave SDK Documentation

Welcome to the SoroSave SDK documentation.

## Installation

```bash
npm install @sorosave/sdk
```

## Quick Start

```typescript
import { SoroSaveClient } from '@sorosave/sdk';

const client = new SoroSaveClient({
  contractId: '...',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
});
```

## Features

- Event subscription
- Webhook notifications
- GraphQL API
- Offline transactions

## API Reference

See the full API documentation below.
