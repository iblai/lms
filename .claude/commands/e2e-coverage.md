Perform a full e2e coverage check and sync cycle:

1. Run `git diff --name-only origin/main...HEAD -- app/ components/` to detect changed files
2. Run `node e2e/scripts/check-journey-coverage.mjs --no-regress` to check for coverage regression
3. Read `e2e/COVERAGE.md` and `e2e/coverage.json` to understand current coverage state
4. Analyze gaps: identify any new pages or modified components that lack E2E journey coverage
5. For each gap:
   a. Write or update the relevant `e2e/journeys/NN-*.spec.ts` file
   b. Add checkpoints to `e2e/COVERAGE.md`
   c. Add entries to `e2e/coverage.json`
6. Use the `/healer` command to verify all tests pass
7. Re-run `node e2e/scripts/check-journey-coverage.mjs --all --no-regress` to confirm full coverage
