#!/usr/bin/env bash
# Shared state for the verify-ktcalc scripts. Source this; do not run it directly.
# All paths stay inside the repo (or an explicit VERIFY_ARTIFACTS directory).

if [[ -z "${VERIFY_KT_COMMON_LOADED:-}" ]]; then
  VERIFY_KT_COMMON_LOADED=1

  verify_repo_root() {
    local dir
    dir=$(CDPATH= cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)
    while [[ "$dir" != "/" ]]; do
      if [[ -f "$dir/package.json" ]] && grep -q '"name": "ktcalc"' "$dir/package.json"; then
        printf '%s\n' "$dir"
        return 0
      fi
      dir=$(dirname "$dir")
    done
    echo "verify-ktcalc: could not find the ktcalc repo root" >&2
    return 1
  }

  REPO_ROOT=$(verify_repo_root)
  ARTIFACTS="${VERIFY_ARTIFACTS:-$REPO_ROOT/verify-artifacts}"
  if [[ "$ARTIFACTS" != /* ]]; then
    ARTIFACTS="$REPO_ROOT/$ARTIFACTS"
  fi
  PORT="${VERIFY_PORT:-4173}"
  if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "verify-ktcalc: VERIFY_PORT must be an integer (got $PORT)" >&2
    return 1
  fi

  PID_FILE="$ARTIFACTS/dev-server.pid"
  PORT_FILE="$ARTIFACTS/dev-server.port"
  LOG_FILE="$ARTIFACTS/dev-server.log"
  CHROME_PID_FILE="$ARTIFACTS/chrome.pid"

  # True when $1 is $2 or a descendant of $2. Walks parents; never matches by name.
  is_in_pid_tree() {
    local pid="$1"
    local root="$2"
    local guard=0
    while [[ -n "$pid" && "$pid" != "0" && "$pid" != "1" && $guard -lt 40 ]]; do
      if [[ "$pid" == "$root" ]]; then
        return 0
      fi
      pid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)
      guard=$((guard + 1))
    done
    return 1
  }

  # Stop a process and its children. The argument must be a pid this skill recorded.
  kill_tree() {
    local pid="$1"
    local child
    for child in $(pgrep -P "$pid" 2>/dev/null || true); do
      kill_tree "$child"
    done
    kill "$pid" 2>/dev/null || true
  }
fi
