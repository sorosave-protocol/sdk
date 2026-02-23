#!/usr/bin/env node

import { Command } from "commander";
import { SoroSaveClient } from "./client";
import { SoroSaveConfig, CreateGroupParams, GroupStatus } from "./types";
import * as StellarSdk from "@stellar/stellar-sdk";

const program = new Command();

// Global options
let config: SoroSaveConfig | null = null;

function getConfig(): SoroSaveConfig {
  if (!config) {
    const rpcUrl = program.opts().rpcUrl || process.env.SOROSAVE_RPC_URL || "https://soroban-testnet.stellar.org";
    const networkPassphrase = program.opts().network || process.env.SOROSAVE_NETWORK || "Test SDF Network ; September 2015";
    const contractId = program.opts().contractId || process.env.SOROSAVE_CONTRACT_ID;
    
    if (!contractId) {
      console.error("Error: Contract ID is required. Set --contractId or SOROSAVE_CONTRACT_ID");
      process.exit(1);
    }
    
    config = {
      rpcUrl,
      networkPassphrase,
      contractId,
    };
  }
  return config;
}

function getSource(): string {
  const secretKey = program.opts().secretKey || process.env.SOROSAVE_SECRET_KEY;
  if (!secretKey) {
    console.error("Error: Secret key is required. Set --secretKey or SOROSAVE_SECRET_KEY");
    process.exit(1);
  }
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    return keypair.publicKey();
  } catch (e) {
    console.error("Error: Invalid secret key");
    process.exit(1);
  }
}

// ─── Group Commands ────────────────────────────────────────────────

program
  .name("sorosave")
  .description("SoroSave CLI - Interact with SoroSave savings groups on Soroban")
  .option("-r, --rpcUrl <url>", "RPC URL", "https://soroban-testnet.stellar.org")
  .option("-n, --network <passphrase>", "Network passphrase", "Test SDF Network ; September 2015")
  .option("-c, --contractId <id>", "Contract ID")
  .option("-s, --secretKey <key>", "Secret key for signing transactions")
  .option("--json", "Output results as JSON");

// create-group
program
  .command("create-group")
  .description("Create a new savings group")
  .requiredOption("-a, --admin <address>", "Admin wallet address")
  .requiredOption("-n, --name <name>", "Group name")
  .requiredOption("-t, --token <address>", "Token contract address")
  .requiredOption("-A, --amount <amount>", "Contribution amount (in stroops)")
  .requiredOption("-c, --cycleLength <seconds>", "Cycle length in seconds")
  .requiredOption("-m, --maxMembers <count>", "Maximum number of members")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    const source = getSource();
    
    try {
      const params: CreateGroupParams = {
        admin: opts.admin,
        name: opts.name,
        token: opts.token,
        contributionAmount: BigInt(opts.amount),
        cycleLength: parseInt(opts.cycleLength),
        maxMembers: parseInt(opts.maxMembers),
      };
      
      const tx = await client.createGroup(params, source);
      
      if (program.opts().json) {
        console.log(JSON.stringify({
          success: true,
          transaction: tx.toXDR(),
          source: source,
        }, null, 2));
      } else {
        console.log("✅ Transaction built successfully");
        console.log(`   Source: ${source}`);
        console.log(`   Transaction XDR: ${tx.toXDR().slice(0, 50)}...`);
        console.log("\n💡 Sign and submit this transaction to complete the transaction");
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// join-group
program
  .command("join-group")
  .description("Join an existing group")
  .requiredOption("-g, --groupId <id>", "Group ID")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    const source = getSource();
    
    try {
      const groupId = parseInt(opts.groupId);
      const tx = await client.joinGroup(source, groupId, source);
      
      if (program.opts().json) {
        console.log(JSON.stringify({
          success: true,
          transaction: tx.toXDR(),
        }, null, 2));
      } else {
        console.log("✅ Join group transaction built");
        console.log(`   Group ID: ${groupId}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// contribute
program
  .command("contribute")
  .description("Contribute to the current round")
  .requiredOption("-g, --groupId <id>", "Group ID")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    const source = getSource();
    
    try {
      const groupId = parseInt(opts.groupId);
      const tx = await client.contribute(source, groupId, source);
      
      if (program.opts().json) {
        console.log(JSON.stringify({
          success: true,
          transaction: tx.toXDR(),
        }, null, 2));
      } else {
        console.log("✅ Contribution transaction built");
        console.log(`   Group ID: ${groupId}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// get-group
program
  .command("get-group")
  .description("Get group details")
  .requiredOption("-g, --groupId <id>", "Group ID")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    
    try {
      const groupId = parseInt(opts.groupId);
      const group = await client.getGroup(groupId);
      
      if (program.opts().json) {
        console.log(JSON.stringify(group, null, 2));
      } else {
        console.log(`📋 Group #${groupId}`);
        console.log(`   Name: ${group.name}`);
        console.log(`   Admin: ${group.admin}`);
        console.log(`   Token: ${group.token}`);
        console.log(`   Contribution: ${group.contributionAmount} stroops`);
        console.log(`   Cycle Length: ${group.cycleLength}s`);
        console.log(`   Max Members: ${group.maxMembers}`);
        console.log(`   Current Members: ${group.members.length}`);
        console.log(`   Status: ${group.status}`);
        console.log(`   Current Round: ${group.currentRound}/${group.totalRounds}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// list-groups (for member)
program
  .command("list-groups")
  .description("List all groups for a member")
  .requiredOption("-m, --member <address>", "Member wallet address")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    
    try {
      const groupIds = await client.getMemberGroups(opts.member);
      
      if (program.opts().json) {
        console.log(JSON.stringify({ groups: groupIds }, null, 2));
      } else {
        if (groupIds.length === 0) {
          console.log("No groups found for this member");
        } else {
          console.log(`📋 Groups for ${opts.member}:`);
          groupIds.forEach((id: number, i: number) => {
            console.log(`   ${i + 1}. Group #${id}`);
          });
        }
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// start-group (admin)
program
  .command("start-group")
  .description("Start a group (admin only)")
  .requiredOption("-g, --groupId <id>", "Group ID")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    const source = getSource();
    
    try {
      const groupId = parseInt(opts.groupId);
      const tx = await client.startGroup(source, groupId, source);
      
      if (program.opts().json) {
        console.log(JSON.stringify({
          success: true,
          transaction: tx.toXDR(),
        }, null, 2));
      } else {
        console.log("✅ Start group transaction built");
        console.log(`   Group ID: ${groupId}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// distribute-payout (admin)
program
  .command("distribute-payout")
  .description("Distribute payout to recipient (admin)")
  .requiredOption("-g, --groupId <id>", "Group ID")
  .action(async (opts) => {
    const cfg = getConfig();
    const client = new SoroSaveClient(cfg);
    const source = getSource();
    
    try {
      const groupId = parseInt(opts.groupId);
      const tx = await client.distributePayout(groupId, source);
      
      if (program.opts().json) {
        console.log(JSON.stringify({
          success: true,
          transaction: tx.toXDR(),
        }, null, 2));
      } else {
        console.log("✅ Distribute payout transaction built");
        console.log(`   Group ID: ${groupId}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse and execute
program.parse();
