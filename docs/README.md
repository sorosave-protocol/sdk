# Sorosave SDK Documentation

A comprehensive multi-language documentation site for the Sorosave Protocol SDK.

## 🌍 Languages

- [English](docs/en/README.md) - Complete API documentation
- [中文 (Chinese)](docs/cn/README.md) - 中文文档
- [Español (Spanish)](docs/es/README.md) - Documentación en español
- [Français (French)](docs/fr/README.md) - Documentation en français

## 📚 Documentation Structure

```
docs/
├── en/           # English documentation
│   ├── README.md
│   ├── API.md
│   ├── EXAMPLES.md
│   └── TROUBLESHOOTING.md
├── cn/           # Chinese documentation
│   ├── README.md
│   ├── API.md
│   ├── EXAMPLES.md
│   └── TROUBLESHOOTING.md
├── es/           # Spanish documentation
│   └── README.md
└── fr/           # French documentation
    └── README.md
```

## 🚀 Quick Start

```typescript
import { SorosaveSDK } from '@sorosave/sdk';

const sdk = new SorosaveSDK({
  network: 'testnet'
});

await sdk.initialize();
```

## 📖 Quick Links

- [Installation Guide](docs/en/README.md#installation)
- [API Reference](docs/en/API.md)
- [Code Examples](docs/en/EXAMPLES.md)
- [Troubleshooting](docs/en/TROUBLESHOOTING.md)

## 🤝 Contributing

We welcome contributions to improve our documentation! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
