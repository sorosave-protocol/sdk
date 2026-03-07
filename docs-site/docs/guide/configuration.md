# Configuration

## SoroSaveConfig Interface

```typescript
interface SoroSaveConfig {
  rpcUrl: string;           // Soroban RPC endpoint
  contractId: string;       // Contract address (C...)
  networkPassphrase: string; // Network identifier
}
```

## Network Configurations

### Testnet

```typescript
const testnetConfig = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'CONTRACT_ID',
  networkPassphrase: 'Test SDF Network ; September 2015'
};
```

### Futurenet

```typescript
const futurenetConfig = {
  rpcUrl: 'https://rpc-futurenet.stellar.org',
  contractId: 'CONTRACT_ID',
  networkPassphrase: 'Test SDF Future Network'
};
```

### Mainnet

```typescript
const mainnetConfig = {
  rpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
  contractId: 'CONTRACT_ID',
  networkPassphrase: 'Public Global Stellar Network ; September 2015'
};
```

## Advanced Configuration

### Custom RPC Options

```typescript
const client = new SoroSaveClient({
  rpcUrl: 'https://custom-rpc.example.com',
  contractId: 'CONTRACT_ID',
  networkPassphrase: 'Network Passphrase'
}, {
  timeout: 30000,
  headers: {
    'X-API-Key': 'your-api-key'
  }
});
```
