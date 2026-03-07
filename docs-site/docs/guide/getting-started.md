# Getting Started

SoroSave SDK provides a TypeScript interface for interacting with the SoroSave smart contract on Soroban. This guide will help you get started with creating and managing decentralized savings groups.

## What is SoroSave?

SoroSave is a decentralized group savings protocol built on Soroban (Stellar's smart contract platform). It enables communities to create rotating savings groups, commonly known as:

- **Ajo** (Nigeria)
- **Susu** (Caribbean/Ghana)
- **Chit Fund** (India)
- **Tandas** (Latin America)

## Prerequisites

- Node.js 18+
- Basic knowledge of TypeScript/JavaScript
- Stellar wallet (Freighter, xBull, or Albedo)
- Some XLM for transaction fees

## Installation

```bash
npm install @sorosave/sdk @stellar/stellar-sdk
```

## Basic Setup

```typescript
import { SoroSaveClient } from '@sorosave/sdk';

const client = new SoroSaveClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'YOUR_CONTRACT_ID',
  networkPassphrase: 'Test SDF Network ; September 2015'
});
```

## Next Steps

- [Installation Guide](/guide/installation) - Detailed setup instructions
- [Configuration](/guide/configuration) - SDK configuration options
- [Tutorial: Group Lifecycle](/tutorial/group-lifecycle) - Complete walkthrough
