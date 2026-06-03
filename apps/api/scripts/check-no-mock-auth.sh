#!/usr/bin/env bash
#
# check-no-mock-auth.sh — Phase 1.W2.5 regression guard
#
# Guards against re-introduction of Phase 1.W1 mock-auth artifacts after W2-2
# (Better Auth integration, commit f484ad5) removed them. Phase 1.W1's mock
# cookies (`rm-auth`, `rm-role`) and the helper file (`apps/web/src/lib/
# auth-cookie.ts`) were replaced by Better Auth's signed `better-auth.session_token`
# cookie and `authClient.signIn.email` / `authClient.useSession` flows.
#
# Usage:
#   pnpm guard:no-mock-auth                  # from repo root
#   bash apps/api/scripts/check-no-mock-auth.sh
#
# Exit codes:
#   0  no forbidden patterns found (PASS)
#   1  at least one forbidden pattern found (FAIL)
#
# Scope: scans source files (.ts, .tsx, .js, .jsx, .mjs, .cjs) under apps/ and
# packages/ only. Skips node_modules, .git, dist, .next, playwright-report,
# test-results. Does NOT scan docs/, .sisyphus/, or this script's own dir
# (historical references to mock-auth in MIGRATION.md, mvp-roadmap.md, and
# older handoff docs are intentional documentation, not regression).
#
# Origin: docs/specs/w2-2.5-followup-backlog.md §3.2.1 (Tier 2 SHOULD).
#

set -euo pipefail

FORBIDDEN=(
  "rm-auth"
  "rm-role"
  "apps/web/src/lib/auth-cookie"
)

EXTENSIONS=("ts" "tsx" "js" "jsx" "mjs" "cjs")
INCLUDE_FLAGS=()
for ext in "${EXTENSIONS[@]}"; do
  INCLUDE_FLAGS+=("--include=*.${ext}")
done

EXCLUDE_DIRS=(
  "--exclude-dir=node_modules"
  "--exclude-dir=.git"
  "--exclude-dir=dist"
  "--exclude-dir=.next"
  "--exclude-dir=playwright-report"
  "--exclude-dir=test-results"
  "--exclude-dir=.turbo"
  "--exclude-dir=coverage"
)

SEARCH_PATHS=("apps/" "packages/")

violations=0

echo "[guard:no-mock-auth] Scanning ${SEARCH_PATHS[*]} for forbidden mock-auth patterns..."
echo ""

for pattern in "${FORBIDDEN[@]}"; do
  echo "  Checking: '${pattern}'"

  matches=$(grep -rn \
    "${INCLUDE_FLAGS[@]}" \
    "${EXCLUDE_DIRS[@]}" \
    "${pattern}" \
    "${SEARCH_PATHS[@]}" 2>/dev/null || true)

  if [ -n "${matches}" ]; then
    echo "    FAIL — found forbidden pattern '${pattern}':"
    echo "${matches}" | sed 's/^/      /'
    violations=$((violations + 1))
  else
    echo "    OK — clean"
  fi
done

echo ""

if [ "${violations}" -gt 0 ]; then
  echo "[guard:no-mock-auth] FAILED — ${violations} forbidden pattern(s) detected."
  echo ""
  echo "Context: Phase 1.W1 mock-auth (rm-auth/rm-role cookies + auth-cookie.ts"
  echo "helper) was removed in W2-2 commit f484ad5 when Better Auth integration"
  echo "landed. Re-introducing these patterns reverts the auth layer to a known"
  echo "insecure state (JS-set non-HttpOnly cookies)."
  echo ""
  echo "To resolve: use authClient.signIn.email() / authClient.useSession() from"
  echo "apps/web/src/lib/auth-client.ts instead of mock cookies."
  echo ""
  echo "Reference: docs/specs/w2-2.5-followup-backlog.md §3.2.1"
  exit 1
fi

echo "[guard:no-mock-auth] PASSED — no mock-auth regression detected."
exit 0
