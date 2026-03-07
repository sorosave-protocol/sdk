# Installation

## NPM

```bash
npm install @sorosave/sdk @stellar/stellar-sdk
```

## Yarn

```bash
yarn add @sorosave/sdk @stellar/stellar-sdk
```

## PNPM

```bash
pnpm add @sorosave/sdk @stellar/stellar-sdk
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

## Environment Setup

Create a `.env` file:

```env
SOROSAVE_RPC_URL=https://soroban-testnet.stellar.org
SOROSAVE_CONTRACT_ID=YOUR_CONTRACT_ID
SOROSAVE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

## Verification

```typescript
import { SoroSaveClient } from '@sorosave/sdk';

const client = new SoroSaveClient({
  rpcUrl: process.env.SOROSAVE_RPC_URL!,
  contractId: process.env.SOROSAVE_CONTRACT_ID!,
  networkPassphrase: process.env.SOROSAVE_NETWORK_PASSPHRASE!
});

console.log('SDK initialized successfully!');
```
