# LMS — Claude Code Rules

## Formatting

After editing any `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, or `.json` file, run prettier on the changed files before committing:

```bash
pnpm prettier --write <changed-files>
git add -u
```

The pre-commit hook does this automatically, but running it upfront avoids formatting noise in diffs. The project uses `prettier-plugin-tailwindcss`, so Tailwind class order is enforced too.

See `.claude/skills/prettier-format.md` for full details.

## Code comments — only when necessary

Comments are a cost. Most well-named code needs none. Do not narrate the code — prefer clear names over prose that restates what the code already says.

Add a comment ONLY to capture what the code cannot:

- A non-obvious **why**: a rationale, trade-off, or business rule that isn't visible from the code.
- A **gotcha or workaround**: why something is done an unusual way (ideally with a ticket/link).
- A **warning**: a non-obvious consequence or ordering requirement.

Do NOT add:

- Comments that describe the next line (`// set the tenant`, `// loop over items`, `// fetch the data`).
- Restatements of signatures, types, or obvious control flow.
- Section-banner or decorative comments.
- Scaffolding/attribution/changelog notes (`// added by …`, resolved `TODO`s, "this now does X").

When in doubt, leave it out. If deleting a comment loses nothing a competent reader wouldn't get from the code itself, delete it. This applies to code you write **and** code you edit — don't leave behind noise.

## Git push — --no-verify is NEVER allowed

Never use `--no-verify` when committing or pushing. The pre-push hook runs build, lint, typecheck, unit tests, coverage checks, and e2e coverage validation. These are required. If a hook fails, fix the root cause.

Only exception: the user explicitly instructs it in the current message.

See `.claude/skills/safe-push.md` for the full push protocol and how to handle each failure type.

## E2E coverage

After any change to user-facing behavior, evaluate whether `e2e/coverage.json` and `e2e/COVERAGE.md` need updating. Coverage must never regress.

See `.claude/skills/e2e-coverage.md` for the full decision process.
