---
id: introduction
title: Introduction
sidebar_position: 1
slug: /
---

# SoroSave SDK

The **SoroSave SDK** is a TypeScript library for interacting with the SoroSave smart contracts deployed on Stellar's [Soroban](https://soroban.stellar.org) smart contract platform.

## What is SoroSave?

SoroSave is a decentralized savings group protocol built on Stellar's Soroban blockchain. It enables groups of people to pool resources and take turns receiving payouts — similar to traditional rotating savings and credit associations (ROSCAs), but trustless and on-chain.

## What does the SDK provide?

- **`SoroSaveClient`** — Core client class for all contract interactions
- **React Hooks** — Pre-built hooks for `useGroup`, `useContribute`, `useMemberGroups`
- **Generated Types** — Auto-generated TypeScript types from the contract ABI
- **Utility Functions** — Helpers for common operations

## Key Features

| Feature | Description |
|---------|-------------|
| 🔒 Type Safe | Full TypeScript support with generated types |
| ⚛️ React Ready | Built-in hooks for React applications |
| ⚡ Auto-Generated | Contract bindings generated from on-chain ABI |
| 🌐 Soroban Native | Built specifically for the Soroban platform |
| 📦 Modular | Import only what you need |

## Next Steps

- [Installation](./installation) — Install the SDK
- [Getting Started](./getting-started) — Your first integration
- [Configuration](./configuration) — Configuration options
- [API Reference](/api/) — Full API documentation
