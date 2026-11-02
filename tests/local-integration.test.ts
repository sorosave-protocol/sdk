import * as StellarSdk from '@stellar/stellar-sdk';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { SoroSaveClient } from '../src/client';

const RPC_URL = process.env.LOCAL_SOROBAN_RPC_URL;
const CONTRACT_ID = process.env.LOCAL_SOROBAN_CONTRACT_ID;
const WASM_PATH = process.env.SOROSAVE_WASM_PATH;
const PASSPHRASE =
  process.env.LOCAL_SOROBAN_NETWORK_PASSPHRASE ?? 'Standalone Network ; February 2017';
const FRIENDBOT_URL =
  process.env.LOCAL_SOROBAN_FRIENDBOT_URL ??
  (RPC_URL ? RPC_URL.replace('/rpc', '') + '/friendbot' : undefined);

const canRun = Boolean(RPC_URL && (CONTRACT_ID || WASM_PATH));

async function fund(publicKey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!res.ok) {
    throw new Error(`friendbot funding failed for ${publicKey}: ${res.status}`);
  }
}

async function submit(
  server: StellarSdk.rpc.Server,
  tx: StellarSdk.Transaction,
  signer: StellarSdk.Keypair
): Promise<StellarSdk.rpc.Api.GetSuccessfulTransactionResponse> {
  tx.sign(signer);
  const sent = await server.sendTransaction(tx);
  if (sent.status === 'ERROR') {
    throw new Error(`sendTransaction failed: ${JSON.stringify(sent.errorResult)}`);
  }

  for (let i = 0; i < 40; i++) {
    const res = await server.getTransaction(sent.hash);
    if (res.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return res as StellarSdk.rpc.Api.GetSuccessfulTransactionResponse;
    }
    if (res.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`transaction ${sent.hash} failed`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`transaction ${sent.hash} not confirmed in time`);
}

async function invokeHostOperation(
  server: StellarSdk.rpc.Server,
  signer: StellarSdk.Keypair,
  operation: StellarSdk.xdr.Operation
): Promise<StellarSdk.rpc.Api.GetSuccessfulTransactionResponse> {
  const account = await server.getAccount(signer.publicKey());
  const built = new StellarSdk.TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();
  const prepared = await server.prepareTransaction(built);
  return submit(server, prepared, signer);
}

async function deployContract(
  server: StellarSdk.rpc.Server,
  deployer: StellarSdk.Keypair,
  wasmPath: string
): Promise<string> {
  const wasm = readFileSync(wasmPath);
  const uploaded = await invokeHostOperation(
    server,
    deployer,
    StellarSdk.Operation.uploadContractWasm({ wasm })
  );
  const wasmHash = uploaded.returnValue!.bytes();

  const created = await invokeHostOperation(
    server,
    deployer,
    StellarSdk.Operation.createCustomContract({
      address: new StellarSdk.Address(deployer.publicKey()),
      wasmHash,
    })
  );
  return StellarSdk.Address.fromScVal(created.returnValue!).toString();
}

describe.skipIf(!canRun)('SoroSave SDK against a local Soroban node', () => {
  let server: StellarSdk.rpc.Server;
  let client: SoroSaveClient;
  let admin: StellarSdk.Keypair;
  let member: StellarSdk.Keypair;
  let token: string;

  beforeAll(async () => {
    server = new StellarSdk.rpc.Server(RPC_URL!, { allowHttp: true });
    admin = StellarSdk.Keypair.random();
    member = StellarSdk.Keypair.random();

    await fund(admin.publicKey());
    await fund(member.publicKey());

    const contractId = CONTRACT_ID ?? (await deployContract(server, admin, WASM_PATH!));

    client = new SoroSaveClient({
      contractId,
      rpcUrl: RPC_URL!,
      networkPassphrase: PASSPHRASE,
    });
    // The client builds its server without allowHttp, which a local http node needs.
    (client as any).server = server;

    token = StellarSdk.Asset.native().contractId(PASSPHRASE);
  }, 180_000);

  it(
    'runs create, join, query and leave through the SDK',
    async () => {
      const createTx = await client.createGroup(
        {
          admin: admin.publicKey(),
          name: 'local-int-test',
          token,
          contributionAmount: BigInt(100),
          cycleLength: 14,
          maxMembers: 4,
        },
        admin.publicKey()
      );
      const created = await submit(server, createTx, admin);
      const groupId = Number(StellarSdk.scValToNative(created.returnValue!));
      expect(groupId).toBeGreaterThan(0);

      const group = await client.getGroup(groupId);
      expect(group.id).toBe(groupId);
      expect(group.name).toBe('local-int-test');
      expect(group.admin).toBe(admin.publicKey());
      expect(group.maxMembers).toBe(4);
      expect(group.status).toBe('Forming');

      const joinTx = await client.joinGroup(member.publicKey(), groupId, member.publicKey());
      await submit(server, joinTx, member);

      const afterJoin = await client.getGroup(groupId);
      expect(afterJoin.members).toContain(member.publicKey());

      const memberGroups = await client.getMemberGroups(member.publicKey());
      expect(memberGroups.map((id) => Number(id))).toContain(groupId);

      const leaveTx = await client.leaveGroup(member.publicKey(), groupId, member.publicKey());
      await submit(server, leaveTx, member);

      const afterLeave = await client.getGroup(groupId);
      expect(afterLeave.members).not.toContain(member.publicKey());
    },
    180_000
  );
});
