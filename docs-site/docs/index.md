---
slug: /
title: Home
hide_table_of_contents: true
---

# SoroSave SDK

**Group Savings on Soroban**

TypeScript SDK for decentralized savings groups (Ajo, Susu, Chit Fund).

- Create and manage rotating savings groups on the Stellar blockchain
- Smart contract-based trustless savings with on-chain transparency
- Simple TypeScript API for web and mobile applications
- Comprehensive guides, API reference, and tutorials

## Quick Start

```bash
npm install @sorosave/sdk
```

```typescript
import { SoroSaveClient } from '@sorosave/sdk';

const client = new SoroSaveClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'CONTRACT_ID',
  networkPassphrase: 'Test SDF Network ; September 2015'
});
```

[**Get Started**](./guide/getting-started.md) | [**View on GitHub**](https://github.com/sorosave-protocol/sdk)