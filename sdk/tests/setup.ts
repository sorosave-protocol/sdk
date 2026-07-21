import { SorobanRpc, Contract, Address, Keypair, xdr } from "@stellar/stellar-sdk";
import { SoroSaveClient } from "../src";
import { readFileSync } from "fs";
import { join } from "path";

export async function setupTestEnvironment() {
  // Start local Soroban container
  // Note: In a real implementation, this would be handled by the CI environment
  // For testing purposes, we'll assume the container is already running

  const server = new SorobanRpc.Server("http://localhost:8000/soroban/rpc");

  // Load and deploy the contract
  const contractWasm = readFileSync(join(__dirname, "../../contracts/sorosave/target/wasm32-unknown-unknown/release/sorosave.wasm"));
  const contract = new Contract(contractWasm);

  // Create a test account
  const testAccount = Keypair.random();
  const friendBotUrl = `https://friendbot.stellar.org?addr=${testAccount.publicKey()}`;

  // Fund the test account
  await fetch(friendBotUrl);

  // Deploy the contract
  const deployTx = new SorobanRpc.TransactionBuilder(testAccount.publicKey(), {
    fee: "100",
    networkPassphrase: "Test SDF Network ; September 2015",
  })
    .addOperation(contract.deploy())
    .setTimeout(30)
    .build();

  deployTx.sign(testAccount);
  await server.sendTransaction(deployTx);

  // Wait for the transaction to be confirmed
  await server.getTransaction(deployTx.hash());

  // Get the contract ID
  const contractId = deployTx.getContractId();

  // Create and return the SoroSaveClient
  return new SoroSaveClient({
    rpcUrl: "http://localhost:8000/soroban/rpc",
    contractId: contractId,
    networkPassphrase: "Test SDF Network ; September 2015",
  }, testAccount);
}