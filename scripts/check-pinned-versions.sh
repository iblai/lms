#!/bin/sh
# Checks that all dependency versions in package.json are pinned (no ^, ~, or "latest").

if ! git diff --cached --name-only | grep -q 'package.json'; then
  exit 0
fi

UNPINNED=$(node -e "
  const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const bad = Object.entries(deps).filter(([, v]) => /[\^~]|^latest$/.test(v));
  if (bad.length) {
    bad.forEach(([n, v]) => console.log('  ' + n + ': ' + v));
    process.exit(1);
  }
" 2>&1)

if [ $? -ne 0 ]; then
  echo "ERROR: Unpinned dependency versions found in package.json:"
  echo "$UNPINNED"
  echo ""
  echo "All versions must be exact (no ^, ~, or 'latest'). Pin them to the lockfile version."
  exit 1
fi
