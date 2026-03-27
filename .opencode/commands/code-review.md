---
description: Review code changes for quality issues before pushing
---

Review the recent code changes in this repository for quality issues.

1. Run `git diff HEAD~1 --stat` to see what files changed
2. Run `git diff HEAD~1` to see the actual changes
3. Review the changes for:
   - Bugs, logic errors, or potential runtime exceptions
   - Security issues (hardcoded secrets, XSS, injection)
   - Performance concerns (unnecessary re-renders, missing memoization, N+1 queries)
   - TypeScript type safety issues (any casts, missing null checks)
   - Missing error handling
   - Code style inconsistencies with the rest of the codebase
4. Print a concise summary of findings. If no issues found, say "No issues found."
