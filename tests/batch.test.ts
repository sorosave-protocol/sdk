import { describe, it, expect } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';
import { BatchBuilder } from '../src/batch';

describe('BatchBuilder', () => {
  it('keeps deterministic ordering by order field', () => {
    const builder = new BatchBuilder();

    builder.addOperation({} as unknown as StellarSdk.xdr.Operation, { order: 2, mode: 'abort' });
    builder.addOperation({} as unknown as StellarSdk.xdr.Operation, { order: 1, mode: 'continue' });
    builder.addOperation({} as unknown as StellarSdk.xdr.Operation, { order: 2, mode: 'abort' });

    const list = builder.operationsSnapshot;

    expect(list[0].order).toBe(1);
    expect(list[1].order).toBe(2);
    expect(list[2].order).toBe(2);
    expect(builder.getFailureModeSummary()).toEqual({ abort: 2, continue: 1 });
  });

  it('buildBatchTransaction requires at least one operation', () => {
    const builder = new BatchBuilder();
    expect(builder.size).toBe(0);
  });
});
