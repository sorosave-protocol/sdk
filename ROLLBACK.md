# Rollback Procedure for Sorosave-Protocol

If the post-deployment verification fails:
1. **Identify Failure:** Review the GitHub Actions log for the 'Post-Deployment Verification' step.
2. **Git Revert:** Run `git revert <commit_hash>` to undo the faulty deployment.
3. **Automated Fix:** Push the revert commit to `main` to trigger a clean deployment of the previous stable version.

