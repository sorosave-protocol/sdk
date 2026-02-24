# Bounty Submission: SoroSave SDK CLI Tool (Issue #36)

**Bounty Issue:** https://github.com/sorosave-protocol/sdk/issues/36  

## What I built

A complete **Node.js CLI tool** built with `Commander.js` that allows users to interact with the SoroSave protocol directly from their terminal.

### Commands Implemented
- `create-group`: Initialize a new savings group on-chain.
- `join-group`: Participate in an existing group.
- `contribute`: Submit contributions for the current round.
- `get-group`: Fetch detailed group status and metadata.
- `list-groups`: List all groups a specific public key is participating in.

### Technical Highlights
- **Stellar SDK Integration**: Seamless handling of keys, networks (Testnet/Mainnet), and transaction signing.
- **Flexible Output**: Supports both human-readable text and machine-readable JSON (via `--json`).
- **Configuration**: Uses environment variables (`SOROSAVE_SECRET`, `SOROSAVE_CONTRACT_ID`) or CLI flags for easy automation.

### Installation
```bash
npm link
```

### Usage Examples
```bash
# Create a group
sorosave create-group "Tech Savings" "TOKEN_ADDRESS" 1000 86400 5 --secret S...

# Get group info in JSON
sorosave get-group 1 --json
```

## Reviewer requirements checklist

1) **Add CLI entry point using commander or yargs** ✅
- Implemented in `src/cli.ts` using `commander`.

2) **Commands: create-group, join-group, contribute, get-group, list-groups** ✅
- All core protocol interactions mapped to CLI commands.

3) **Package bin configuration** ✅
- Added `"bin": { "sorosave": "./dist/cli.js" }` to `package.json`.
