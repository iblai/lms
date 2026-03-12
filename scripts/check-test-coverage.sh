#!/usr/bin/env bash

# check-test-coverage.sh
# Enforce ≥95% line coverage on changed source files
# Uses vitest with coverage-istanbul provider

set -euo pipefail

# Config
MIN_COVERAGE=95
COVERAGE_PROVIDER="${COVERAGE_PROVIDER:-istanbul}"
COVERAGE_THRESHOLD_ARGS=(
  "--coverage.thresholds.lines=0"
  "--coverage.thresholds.functions=0"
  "--coverage.thresholds.branches=0"
  "--coverage.thresholds.statements=0"
)

BASE_BRANCH="${BASE_BRANCH:-origin/main}"

# Files to skip from coverage check (complex components that can't reasonably reach 95%)
SKIP_COVERAGE_FILES=(
  "providers/index.tsx"
  "app/analytics/layout.tsx"
  "app/_components/app-layout.tsx"
  "app/course-content/[course_id]/layout.tsx"
  "app/profile/public/page.tsx"
  "app/profile/skills/page.tsx"
  "components/edx-iframe/edx-iframe.tsx"
  "components/profile/education-box.tsx"
  "components/profile/experience-box.tsx"
  "components/profile/media-box.tsx"
  "hooks/courses/use-course-detail.ts"
  "hooks/profile/use-profile-roles.ts"
  "hooks/profile/use-profile-skills.ts"
  "utils/localstorage.ts"
)

# Files to exclude from coverage checks
EXCLUDED_FILES=(
  "__tests__/vitest.setup.ts"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_step()    { echo -e "\n${BLUE}→ $1${NC}"; }
echo_success() { echo -e "${GREEN}✔ $1${NC}"; }
echo_warn()    { echo -e "${YELLOW}⚠ $1${NC}"; }
echo_error()   { echo -e "${RED}✖ $1${NC}" >&2; }

# Check if a file should be skipped from coverage check
should_skip_coverage() {
  local file="$1"
  for skip_pattern in "${SKIP_COVERAGE_FILES[@]}"; do
    if [[ "${file}" == *"${skip_pattern}"* ]] || [[ "${file}" == "${skip_pattern}" ]]; then
      return 0  # true - should skip
    fi
  done
  return 1  # false - should not skip
}

# Detect changed files
echo_step "Detecting changed files against ${BASE_BRANCH}..."

CHANGED_FILES=$(git diff --name-only "${BASE_BRANCH}"...HEAD 2>/dev/null || git diff --name-only HEAD~1 || echo "")

[[ -z "${CHANGED_FILES}" ]] && { echo_success "No changed files."; exit 0; }

# Filter source files (match vitest.config.ts coverage include paths)
SOURCE_FILES=()
for file in ${CHANGED_FILES}; do
  [[ -f "${file}" ]] || continue
  [[ "${file}" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]] || continue
  # Skip test, spec, type, config, and setup files
  if [[ "${file}" =~ (\.test\.|\.spec\.|\.d\.ts$|__tests__|__mocks__|stories\.|types?\.ts$|constants?\.ts$|index\.ts$|vitest\.|\.config\.) ]]; then
    continue
  fi
  # Only include files in tracked source directories
  if ! [[ "${file}" =~ ^(components|features|hooks|lib|contexts|providers|utils|app|services|hoc)/ ]]; then
    continue
  fi
  # Check excluded files
  is_excluded=false
  for excluded in "${EXCLUDED_FILES[@]}"; do
    if [[ "${file}" == "${excluded}" ]]; then
      is_excluded=true
      break
    fi
  done
  [[ "${is_excluded}" == true ]] && continue
  SOURCE_FILES+=("${file}")
done

[[ ${#SOURCE_FILES[@]} -eq 0 ]] && { echo_success "No relevant source files changed."; exit 0; }

printf "Changed source files:\n"; for f in "${SOURCE_FILES[@]}"; do echo "  • $f"; done

# Resolve coverage provider
provider="${COVERAGE_PROVIDER}"
if [[ "${provider}" == "istanbul" ]]; then
  if ! node -e "require.resolve('@vitest/coverage-istanbul')" >/dev/null 2>&1; then
    if node -e "require.resolve('@vitest/coverage-v8')" >/dev/null 2>&1; then
      echo_warn "@vitest/coverage-istanbul not found; falling back to v8."
      provider="v8"
    else
      echo_error "No coverage provider found. Install @vitest/coverage-istanbul or @vitest/coverage-v8."
      exit 1
    fi
  fi
elif [[ "${provider}" == "v8" ]]; then
  if ! node -e "require.resolve('@vitest/coverage-v8')" >/dev/null 2>&1; then
    if node -e "require.resolve('@vitest/coverage-istanbul')" >/dev/null 2>&1; then
      echo_warn "@vitest/coverage-v8 not found; falling back to istanbul."
      provider="istanbul"
    else
      echo_error "No coverage provider found. Install @vitest/coverage-v8 or @vitest/coverage-istanbul."
      exit 1
    fi
  fi
fi

# Build include args (skip excluded files)
include_args=()
for file in "${SOURCE_FILES[@]}"; do
  if should_skip_coverage "${file}"; then
    echo_warn "Excluding '${file}' from coverage (in exclusion list)"
    continue
  fi
  # Handle Next.js dynamic routes with square brackets
  if [[ "${file}" == *"["* ]]; then
    escape_brackets() { echo "$1" | sed 's/\[/\\\\[/g; s/\]/\\\\]/g'; }
    basename_file=$(basename "${file}")
    current_path=$(dirname "${file}")
    suffix_parts=("${basename_file}")
    anchor=""
    while [[ -n "${current_path}" && "${current_path}" != "." ]]; do
      current_basename=$(basename "${current_path}")
      current_path=$(dirname "${current_path}")
      if [[ "${current_basename}" == *"["* ]]; then
        suffix_parts=("$(escape_brackets "${current_basename}")" "${suffix_parts[@]}")
      else
        anchor="${current_basename}"
        break
      fi
    done
    if [[ -n "${anchor}" ]]; then
      suffix=$(IFS=/; echo "${suffix_parts[*]}")
      glob_pattern="**/${anchor}/${suffix}"
    else
      glob_pattern="$(escape_brackets "${file}")"
    fi
    include_args+=("--coverage.include=${glob_pattern}")
  else
    include_args+=("--coverage.include=${file}")
  fi
done

if [[ ${#include_args[@]} -eq 0 ]]; then
  echo_success "All changed files are excluded from coverage check."
  exit 0
fi

echo "Coverage provider: ${provider}"
echo "Coverage includes:"; for arg in "${include_args[@]}"; do echo "  $arg"; done

# Use a temporary directory for JSON coverage output
coverage_dir=$(mktemp -d)
# shellcheck disable=SC2064
trap "rm -rf '${coverage_dir}'" EXIT

cmd="npx vitest run --coverage --coverage.enabled --coverage.provider=${provider} --coverage.exclude=node_modules/** --coverage.reporter=json --coverage.reporter=text --coverage.reportsDirectory=${coverage_dir} ${COVERAGE_THRESHOLD_ARGS[*]} ${include_args[*]}"

echo -e "${BLUE}Running:${NC} ${cmd}\n"

set +e
output=$(eval "${cmd}" 2>&1)
exit_code=$?
set -e

echo "${output}" | tail -n 80

if [[ ${exit_code} -ne 0 ]]; then
  echo_error "Tests failed."
  exit 1
fi

# Parse JSON coverage output
coverage_json="${coverage_dir}/coverage-final.json"

if [[ ! -f "${coverage_json}" ]]; then
  echo_error "Coverage JSON not found at ${coverage_json}"
  exit 1
fi

ws_abs_dir=$(pwd)
OVERALL_SUCCESS=true

for file in "${SOURCE_FILES[@]}"; do
  if should_skip_coverage "${file}"; then
    echo_warn "Skipping coverage check for '${file}' (in exclusion list)"
    continue
  fi

  abs_file="${ws_abs_dir}/${file}"
  pct="0"

  pct=$(node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const targetAbs = process.argv[2];
    const targetRel = process.argv[3];

    let entry = data[targetAbs];
    if (!entry) {
      for (const [key, val] of Object.entries(data)) {
        if (key.endsWith('/' + targetRel) || key.endsWith('/' + targetRel.replace(/^\\.\\//,''))) {
          entry = val;
          break;
        }
      }
    }

    if (!entry || !entry.statementMap || !entry.s) {
      console.log('0');
      process.exit(0);
    }

    const lineHits = {};
    for (const [id, count] of Object.entries(entry.s)) {
      const stmt = entry.statementMap[id];
      if (!stmt) continue;
      const line = stmt.start.line;
      lineHits[line] = (lineHits[line] || 0) + count;
    }

    const totalLines = Object.keys(lineHits).length;
    const coveredLines = Object.values(lineHits).filter(v => v > 0).length;
    const pct = totalLines === 0 ? 100 : (coveredLines / totalLines) * 100;
    console.log(pct.toFixed(2));
  " "${coverage_json}" "${abs_file}" "${file}" 2>/dev/null) || pct="0"

  if [[ "${pct}" != "0" ]]; then
    echo -e "${BLUE}Match:${NC} '${file}' → ${pct}% lines"
  else
    echo_warn "No coverage data found for '${file}' — defaulting to 0%"
  fi

  if (( $(echo "${pct} < ${MIN_COVERAGE}" | bc -l) )); then
    echo_error "Low coverage for ${file}: ${pct}% < ${MIN_COVERAGE}%"
    OVERALL_SUCCESS=false
  else
    echo_success "${file}: ${pct}% ≥ ${MIN_COVERAGE}%"
  fi
done

echo ""
if [[ "${OVERALL_SUCCESS}" == true ]]; then
  echo_success "All changed files have ≥ ${MIN_COVERAGE}% line coverage!"
  exit 0
else
  echo_error "Coverage check FAILED."
  exit 1
fi
