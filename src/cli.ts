#!/usr/bin/env node
import { Command } from "commander";
import * as StellarSdk from "@stellar/stellar-sdk";
import { SoroSaveClient } from "./client";
import { CreateGroupParams } from "./types";

const program = new Command();

program
  .name("sorosave")
  .description("CLI for interacting with SoroSave contracts")
  .version("0.1.0");

program
  .option("-s, --secret <key>", "Secret key for transactions")
  .option("-n, --network <name>", "Network to use (testnet, mainnet)", "testnet")
  .option("-j, --json", "Output results in JSON format", false);

async function getClient() {
  const options = program.opts();
  const secret = options.secret || process.env.SOROSAVE_SECRET;
  
  if (!secret) {
    throw new Error("Secret key is required (via --secret or SOROSAVE_SECRET env var)");
  }

  const keypair = StellarSdk.Keypair.fromSecret(secret);
  const isMainnet = options.network === "mainnet";

  const config = {
    rpcUrl: isMainnet ? "https://soroban-rpc.mainnet.stellar.org" : "https://soroban-testnet.stellar.org",
    contractId: process.env.SOROSAVE_CONTRACT_ID || "TODO_CONTRACT_ID",
    networkPassphrase: isMainnet ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET,
  };

  const client = new SoroSaveClient(config);
  return { client, keypair, options };
}

function handleOutput(data: any, isJson: boolean) {
  if (isJson) {
    console.log(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
  } else {
    console.log(data);
  }
}

program
  .command("create-group")
  .description("Create a new savings group")
  .argument("<name>", "Name of the group")
  .argument("<token>", "Token address")
  .argument("<amount>", "Contribution amount")
  .argument("<cycle>", "Cycle length in seconds")
  .argument("<maxMembers>", "Maximum number of members")
  .action(async (name, token, amount, cycle, maxMembers) => {
    try {
      const { client, keypair, options } = await getClient();
      const params: CreateGroupParams = {
        admin: keypair.publicKey(),
        name,
        token,
        contributionAmount: BigInt(amount),
        cycleLength: BigInt(cycle),
        maxMembers: parseInt(maxMembers),
      };

      const tx = await client.createGroup(params, keypair.publicKey());
      tx.sign(keypair);
      // Note: Implementation of transaction submission would go here
      handleOutput({ message: "Group creation transaction built and signed", name }, options.json);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  });

program
  .command("join-group")
  .description("Join an existing group")
  .argument("<groupId>", "Group ID to join")
  .action(async (groupId) => {
    try {
      const { client, keypair, options } = await getClient();
      const tx = await client.joinGroup(keypair.publicKey(), parseInt(groupId), keypair.publicKey());
      tx.sign(keypair);
      handleOutput({ message: "Join group transaction built", groupId }, options.json);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  });

program
  .command("contribute")
  .description("Contribute to the current round")
  .argument("<groupId>", "Group ID")
  .action(async (groupId) => {
    try {
      const { client, keypair, options } = await getClient();
      const tx = await client.contribute(keypair.publicKey(), parseInt(groupId), keypair.publicKey());
      tx.sign(keypair);
      handleOutput({ message: "Contribution transaction built", groupId }, options.json);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  });

program
  .command("get-group")
  .description("Get group details")
  .argument("<groupId>", "Group ID")
  .action(async (groupId) => {
    try {
      const { client, options } = await getClient();
      const group = await client.getGroup(parseInt(groupId));
      handleOutput(group, options.json);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  });

program
  .command("list-groups")
  .description("List all groups for the current account")
  .action(async () => {
    try {
      const { client, keypair, options } = await getClient();
      const groupIds = await client.getMemberGroups(keypair.publicKey());
      handleOutput({ publicKey: keypair.publicKey(), groups: groupIds }, options.json);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  });

program.parse(process.argv);
