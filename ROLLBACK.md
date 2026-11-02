# Rollback Procedure for Sorosave-Protocol

Applies to deployments made with the `Deploy to Mainnet` workflow (`.github/workflows/deploy-mainnet.yml`).

## Before you deploy

Record the contract ID currently in production. A Soroban contract deployment creates a new contract instance and cannot be undone on-chain, so rolling back means pointing clients back at the previous contract ID.

## If the post-deployment verification fails

1. **Identify Failure:** Review the GitHub Actions log for the 'Post-Deployment Verification' step.
2. **Stop Using the New Contract:** Do not publish or announce the new contract ID. Revert `NEXT_PUBLIC_CONTRACT_ID` (and any SDK config) to the previously recorded contract ID.
3. **Git Revert:** Run `git revert <commit_hash>` to undo the faulty change that was deployed.
4. **Redeploy the Stable Version:** Push the revert commit to `main`, then run the `Deploy to Mainnet` workflow again (manual approval is required) to deploy the previous stable version and confirm it passes verification.
5. **Follow Up:** Open an issue describing the failure and the contract ID that was abandoned.
