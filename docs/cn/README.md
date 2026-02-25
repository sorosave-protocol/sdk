# Sorosave SDK - 中文文档

Sorosave Protocol SDK 的完整中文文档。

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 参考](#api-参考)
- [示例代码](#示例代码)
- [常见问题](#常见问题)

## 安装

```bash
npm install @sorosave/sdk
# 或
yarn add @sorosave/sdk
```

## 快速开始

```typescript
import { SorosaveSDK } from '@sorosave/sdk';

// 初始化 SDK
const sdk = new SorosaveSDK({
  network: 'testnet', // 或 'mainnet'
  horizonUrl: 'https://horizon-testnet.stellar.org'
});

// 初始化
await sdk.initialize();

// 获取账户信息
const account = await sdk.user.getAccount();
console.log('账户:', account.address);
```

## 核心概念

### 储蓄小组

储蓄小组是 Sorosave 的核心功能。一个小组包含：
- **成员**: 参与储蓄的用户
- **目标**: 需要储蓄的总金额
- **贡献**: 每位成员定期贡献的金额
- **周期**: 两次贡献之间的时间间隔

### 智能合约

所有操作都通过 Stellar Soroban 平台上的智能合约执行。

## API 参考

### SorosaveSDK 类

#### 构造函数

```typescript
new SorosaveSDK(config: SDKConfig)
```

**参数:**
- `config.network`: 'testnet' | 'mainnet'
- `config.horizonUrl`: 可选的自定义 Horizon URL
- `config.contractId`: 可选的自定义合约 ID

#### 方法

##### initialize()

初始化 SDK 并加载必要数据。

```typescript
await sdk.initialize();
```

##### groups.create()

创建一个新的储蓄小组。

```typescript
const group = await sdk.groups.create({
  name: "家庭储蓄",           // 小组名称
  description: "旅游基金",    // 描述
  targetAmount: 10000,        // 目标金额
  contributionAmount: 100,    // 每次贡献金额
  contributionPeriod: 7,      // 贡献周期（天）
  members: ["地址1", "地址2"] // 成员地址
});
```

##### groups.join()

加入现有小组。

```typescript
await sdk.groups.join("小组ID");
```

##### groups.contribute()

向小组贡献。

```typescript
await sdk.groups.contribute("小组ID", 100);
```

##### groups.get()

获取小组详情。

```typescript
const group = await sdk.groups.get("小组ID");
console.log(group.totalSaved, group.memberCount);
```

##### user.getAccount()

获取当前用户账户信息。

```typescript
const account = await sdk.user.getAccount();
```

## 示例代码

### 示例 1: 创建并加入小组

```typescript
import { SorosaveSDK } from '@sorosave/sdk';

async function main() {
  const sdk = new SorosaveSDK({ network: 'testnet' });
  await sdk.initialize();
  
  // 创建小组
  const group = await sdk.groups.create({
    name: "旅游基金",
    targetAmount: 5000,
    contributionAmount: 50,
    contributionPeriod: 7,
    members: [朋友地址]
  });
  
  console.log('小组已创建:', group.id);
}

main();
```

### 示例 2: 定期贡献

```typescript
// 向你的小组贡献
const myGroups = await sdk.user.getGroups();

for (const group of myGroups) {
  await sdk.groups.contribute(group.id, group.contributionAmount);
  console.log(`已向 ${group.name} 贡献`);
}
```

### 示例 3: 追踪进度

```typescript
const group = await sdk.groups.get(小组ID);
const progress = (group.totalSaved / group.targetAmount) * 100;

console.log(`进度: ${progress.toFixed(1)}%`);
console.log(`成员数: ${group.memberCount}`);
console.log(`下次贡献: ${group.nextContributionDate}`);
```

## 常见问题

### 网络错误

确保连接到正确的网络：
```typescript
const sdk = new SorosaveSDK({
  network: 'testnet' // 生产环境使用 'mainnet'
});
```

### 余额不足

确保账户有足够的 XLM 支付交易费用。

### 合约未找到

验证合约 ID 是否正确：
```typescript
const sdk = new SorosaveSDK({
  network: 'testnet',
  contractId: '你的合约ID'
});
```

### 获取帮助

- 查看我们的 [FAQ](FAQ_CN.md)
- 加入 [Discord 社区](https://discord.gg/sorosave)
- 在 [GitHub](https://github.com/sorosave-protocol/sdk/issues) 上提交问题

## TypeScript 支持

SDK 包含完整的 TypeScript 定义：

```typescript
import { SorosaveSDK, Group, User, SDKConfig } from '@sorosave/sdk';
```

## 下一步

- 阅读 [API 参考](API_CN.md)
- 查看 [代码示例](EXAMPLES_CN.md)
- 了解 [高级主题](ADVANCED_CN.md)
