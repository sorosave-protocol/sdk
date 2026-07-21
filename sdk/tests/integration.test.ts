import { setupTestEnvironment } from "./setup";
import { generateTestGroupData, generateTestMember, assertGroupEquals } from "./utils";
import { SoroSaveClient } from "../src";

describe("SoroSave SDK Integration Tests", () => {
  let client: SoroSaveClient;
  let testAccount: Keypair;

  beforeAll(async () => {
    client = await setupTestEnvironment();
    testAccount = client.getSourceAccount();
  });

  describe("Group Lifecycle", () => {
    it("should create, manage, and dissolve a group", async () => {
      // 1. Create a group
      const groupData = generateTestGroupData();
      const createTx = await client.createGroup(groupData, testAccount.publicKey());
      await client.waitForTransaction(createTx.hash());

      // Get the created group
      const groups = await client.getGroups();
      const createdGroup = groups[0];

      // Verify group creation
      assertGroupEquals(createdGroup, {
        ...groupData,
        id: 1,
        status: "active",
        currentCycle: 1,
        members: [groupData.admin],
      });

      // 2. Add members to the group
      const member1 = generateTestMember();
      const member2 = generateTestMember();

      const addMember1Tx = await client.addMember(1, member1, testAccount.publicKey());
      await client.waitForTransaction(addMember1Tx.hash());

      const addMember2Tx = await client.addMember(1, member2, testAccount.publicKey());
      await client.waitForTransaction(addMember2Tx.hash());

      // Verify members were added
      const updatedGroup = await client.getGroup(1);
      expect(updatedGroup.members).toContain(member1);
      expect(updatedGroup.members).toContain(member2);

      // 3. Contribute to the group
      const contributeTx = await client.contribute(1, member1);
      await client.waitForTransaction(contributeTx.hash());

      // Verify contribution
      const memberGroups = await client.getMemberGroups(member1);
      expect(memberGroups[0].contributions).toBe(1);

      // 4. Withdraw from the group
      const withdrawTx = await client.withdraw(1, member1);
      await client.waitForTransaction(withdrawTx.hash());

      // Verify withdrawal
      const afterWithdrawalGroup = await client.getGroup(1);
      expect(afterWithdrawalGroup.currentCycle).toBe(2);

      // 5. Dissolve the group
      const dissolveTx = await client.dissolveGroup(1, testAccount.publicKey());
      await client.waitForTransaction(dissolveTx.hash());

      // Verify group dissolution
      const dissolvedGroup = await client.getGroup(1);
      expect(dissolvedGroup.status).toBe("dissolved");
    });
  });
});