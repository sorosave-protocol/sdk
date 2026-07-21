import { Keypair } from "@stellar/stellar-sdk";

export function generateTestGroupData() {
  return {
    admin: Keypair.random().publicKey(),
    name: `Test Group ${Math.floor(Math.random() * 1000)}`,
    token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    contributionAmount: BigInt(1000000),
    cycleLength: 86400,
    maxMembers: 5,
  };
}

export function generateTestMember() {
  return Keypair.random().publicKey();
}

export function assertGroupEquals(actual, expected) {
  expect(actual.id).toBe(expected.id);
  expect(actual.admin).toBe(expected.admin);
  expect(actual.name).toBe(expected.name);
  expect(actual.token).toBe(expected.token);
  expect(actual.contributionAmount).toBe(expected.contributionAmount);
  expect(actual.cycleLength).toBe(expected.cycleLength);
  expect(actual.maxMembers).toBe(expected.maxMembers);
  expect(actual.status).toBe(expected.status);
  expect(actual.currentCycle).toBe(expected.currentCycle);
  expect(actual.members.length).toBe(expected.members.length);
}