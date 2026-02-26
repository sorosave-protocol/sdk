import * as StellarSdk from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';
import { SoroSaveClient } from '../src/client';
import { WalletAdapter } from '../src/wallets';

describe('integration suite', () => {
  it('covers full SoroSave lifecycle with mocked Soroban server and wallet adapter', async () => {
    const contractId = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';
    const sourcePublicKey = StellarSdk.Keypair.random().publicKey();
    const sourceAccount = new StellarSdk.Account(sourcePublicKey, '1000');

    const simulateQueue: Array<StellarSdk.rpc.Api.SimulateTransactionSuccessResponse> = [
      {
        result: {
          retval: StellarSdk.nativeToScVal({
            id: 1n,
            name: 'test-group',
            admin: sourcePublicKey,
            token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
            contribution_amount: '100',
            cycle_length: 14,
            max_members: 5,
            members: [sourcePublicKey],
            payout_order: [sourcePublicKey],
            current_round: 1,
            total_rounds: 1,
            status: 'Active',
            created_at: 1719500000,
          }),
        },
      },
      {
        result: {
          retval: StellarSdk.nativeToScVal({
            round_number: 1,
            recipient: sourcePublicKey,
            contributions: {
              [sourcePublicKey]: true,
            },
            total_contributed: '100',
            is_complete: true,
            deadline: 1719500400,
          }),
        },
      },
      {
        result: {
          retval: StellarSdk.nativeToScVal([1n]),
        },
      },
    ];

    const simulateTransactionMock = vi.fn().mockImplementation(() => {
      const next = simulateQueue.shift();
      if (!next) {
        throw new Error('simulateQueue exhausted before test completed');
      }
      return Promise.resolve(next);
    });

    const buildTxTemplate = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.setOptions({}))
      .setTimeout(30)
      .build();

    const signTransaction = vi
      .fn()
      .mockImplementation(async (tx: StellarSdk.Transaction) => tx);
    const walletAdapter: WalletAdapter = {
      name: 'mock-wallet',
      capabilities: {
        supportsSignTransaction: true,
        supportsSignAuth: false,
        networkSupport: ['testnet'],
      },
      isAvailable: vi.fn().mockResolvedValue(true),
      getAddress: vi.fn().mockResolvedValue(sourcePublicKey),
      signTransaction,
      signAuthEntry: vi.fn(),
    };

    const client = new SoroSaveClient(
      {
        contractId,
        rpcUrl: 'https://127.0.0.1:12345',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      },
      walletAdapter
    );

    // Use deterministic mocks and bypass network-bound assemble logic for this test.
    (client as any).server = {
      getAccount: vi.fn().mockResolvedValue(sourceAccount),
      simulateTransaction: simulateTransactionMock,
    } as never;
    const buildTransactionSpy = vi
      .spyOn(client as any, 'buildTransaction')
      .mockResolvedValue(buildTxTemplate);

    const groupParams = {
      admin: sourcePublicKey,
      name: 'test-group',
      token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      contributionAmount: BigInt(100),
      cycleLength: 14,
      maxMembers: 5,
    };

    // 1) Lifecycle tx creation path.
    await client.createGroup(groupParams, sourcePublicKey);
    await client.joinGroup(sourcePublicKey, 1, sourcePublicKey);
    await client.startGroup(sourcePublicKey, 1, sourcePublicKey);
    await client.contribute(sourcePublicKey, 1, sourcePublicKey);
    await client.distributePayout(1, sourcePublicKey);

    const buildAndSignSpy = vi.spyOn(client, 'buildAndSignTransaction');
    const contract = new StellarSdk.Contract(contractId);
    const rawOperation = contract.call(
      'create_group',
      new StellarSdk.Address(groupParams.admin).toScVal(),
      StellarSdk.nativeToScVal(groupParams.name, { type: 'string' }),
      new StellarSdk.Address(groupParams.token).toScVal(),
      StellarSdk.nativeToScVal(groupParams.contributionAmount, { type: 'i128' }),
      StellarSdk.nativeToScVal(groupParams.cycleLength, { type: 'u64' }),
      StellarSdk.nativeToScVal(groupParams.maxMembers, { type: 'u32' })
    );

    await client.buildAndSignTransaction(rawOperation, sourcePublicKey);

    const batch = client.createBatchBuilder();
    batch
      .addOperation(
        contract.call(
          'join_group',
          new StellarSdk.Address(sourcePublicKey).toScVal(),
          StellarSdk.nativeToScVal(1, { type: 'u64' })
        )
      )
      .addOperation(
        contract.call(
          'contribute',
          new StellarSdk.Address(sourcePublicKey).toScVal(),
          StellarSdk.nativeToScVal(1, { type: 'u64' })
        ),
        {
          mode: 'continue',
        }
      );

    const batchTx = await client.buildBatchTransaction(sourcePublicKey, batch);
    expect(batch.size).toBe(2);
    expect(batch.getFailureModeSummary()).toEqual({ abort: 1, continue: 1 });
    expect(batchTx).toBeDefined();

    expect(buildTransactionSpy).toHaveBeenCalledTimes(6);
    expect(signTransaction).toHaveBeenCalledTimes(1);
    expect(buildAndSignSpy).toHaveBeenCalledTimes(1);

    // 2) Query path -> parse typed objects from simulation payloads.
    const group = await client.getGroup(1);
    expect(group.id).toBe(1);
    expect(group.name).toBe('test-group');
    expect(group.status).toBe('Active');

    const round = await client.getRoundStatus(1, 1);
    expect(round.roundNumber).toBe(1);
    expect(round.totalContributed).toBe(BigInt(100));
    expect(round.isComplete).toBe(true);

    const memberGroups = await client.getMemberGroups(sourcePublicKey);
    expect(memberGroups).toEqual([1n]);
    expect(simulateTransactionMock).toHaveBeenCalledTimes(3);
  });

  it.skipIf(
    !process.env.LOCAL_SOROBAN_RPC_URL,
    'set LOCAL_SOROBAN_RPC_URL to run true contract lifecycle against a local Soroban node'
  )(
    'runs real Soroban lifecycle against local node when env is available',
    async () => {
      const sourcePublicKey = StellarSdk.Keypair.random().publicKey();
      const localUrl = process.env.LOCAL_SOROBAN_RPC_URL!;

      const client = new SoroSaveClient({
        contractId: process.env.LOCAL_SOROBAN_CONTRACT_ID!,
        rpcUrl: localUrl,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const groupParams = {
        admin: sourcePublicKey,
        name: 'local-int-test',
        token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
        contributionAmount: BigInt(100),
        cycleLength: 14,
        maxMembers: 4,
      };

      const createTx = await client.createGroup(groupParams, sourcePublicKey);
      const joinTx = await client.joinGroup(sourcePublicKey, 1, sourcePublicKey);

      expect(createTx).toBeDefined();
      expect(joinTx).toBeDefined();
    }
  );
});
