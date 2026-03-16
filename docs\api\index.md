---
id: index
title: API Overview
sidebar_position: 1
---

# API Reference

Complete API reference for the SoroSave SDK.

## Modules

### Core SDK (`@sorosave/sdk`)

| Export | Description |
|--------|-------------|
| [`SoroSaveClient`](./client) | Main client class for contract interactions |
| [Types](./types) | TypeScript type definitions |
| [Utils](./utils) | Utility functions |

### React SDK (`@sorosave/react`)

| Export | Description |
|--------|-------------|
| `SoroSaveProvider` | React context provider |
| `useGroup(groupId)` | Hook for fetching a savings group |
| `useContribute()` | Mutation hook for making contributions |
| `useMemberGroups(address)` | Hook for fetching all groups for an address |
| `useSoroSave()` | Hook for accessing the SDK client directly |

## Quick Reference

### Creating a Group

