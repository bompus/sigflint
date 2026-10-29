#!/bin/bash
# Admitted rounds of protocol-hash-encode.md. A unit is one round: hash-encode.mjs in one process under node and in one under bun, back to back (node first
# in odd rounds, bun first in even rounds). A host admission check runs before the first unit and after every unit; the check after a unit is the check before
# the next. A unit counts only when the check before it and the check after it both admitted. A unit that fails is kept in results/hash-encode/not-admitted.jsonl and
# measured again (up to 4 attempts); when the host stays unquiet the run exits 6, and running it again continues with the rounds not yet admitted.
# Usage: ADMIT=<command that prints one JSON verdict with "admit": true|false and exits 0 when the host is quiet> [BENCH_LOCK=<lock file>] [RESULTS=<dir>]
#        run-hash-encode.sh [rounds=3] [from_round=1]
# Raw rows: results/hash-encode/raw.jsonl; receipts of every admission check: admission.jsonl. Exit: 0 finished, 3 lock, 6 host not quiet, 7 a unit keeps failing.
set -u
ROUNDS=${1:-3}
FROM=${2:-1}
HERE=$(cd "$(dirname "$0")" && pwd)
R=${RESULTS:-$HERE/results/hash-encode}
: "${ADMIT:?set ADMIT to the host admission command}"
mkdir -p "$R"
RAW=$R/raw.jsonl
REC=$R/admission.jsonl
NOTADM=$R/not-admitted.jsonl
exec 9>"${BENCH_LOCK:-$HOME/.cache/setupLinuxHost/post-upgrade-bench.lock}"
echo "waiting for lock $(date -u +%FT%TZ)"
flock -w 7200 9 || {
  echo "lock not acquired"
  exit 3
}
echo "lock held $(date -u +%FT%TZ)"
TMP=$(mktemp "$R/.unit.XXXXXX") || exit 2
trap 'rm -f "$TMP"' EXIT
SEQ=$(grep -c '"kind":"admit"' "$REC" 2>/dev/null || true)
SEQ=${SEQ:-0}

check() { # check <label>: one admission check; returns 0 when admitted (exit 0 and "admit": true)
  local out st
  out=$(bash -c "$ADMIT")
  st=$?
  out=$(printf '%s' "$out" | tr -d '\n')
  case $out in \{*) ;; *) out='{"reasons":["no verdict"],"admit":false}' ;; esac
  SEQ=$((SEQ + 1))
  echo "{\"kind\":\"admit\",\"seq\":$SEQ,\"label\":\"$1\",\"at\":\"$(date -u +%FT%TZ)\",\"receipt\":$out}" >>"$REC"
  ((st == 0)) && printf '%s' "$out" | grep -q '"admit": *true'
}
unit_done() { grep -q "\"kind\":\"unit\",\"round\":$1,\"admitted\":true" "$REC" 2>/dev/null; }
measure() { # measure <round>: both runtimes into $TMP; fails when a process fails
  local round=$1 rt rts=(node bun)
  ((round % 2 == 0)) && rts=(bun node)
  : >"$TMP"
  for rt in "${rts[@]}"; do
    ROUND=$round UNIT="r$round-$rt" "$rt" "$HERE/hash-encode.mjs" >>"$TMP" || return 1
  done
}

check "before first unit" || {
  echo "host not quiet before the first unit"
  exit 6
}
for round in $(seq "$FROM" "$ROUNDS"); do
  unit_done "$round" && continue
  tries=0
  while :; do
    tries=$((tries + 1))
    start=$(date -u +%FT%TZ)
    if measure "$round" && check "after round $round"; then
      cat "$TMP" >>"$RAW"
      echo "{\"kind\":\"unit\",\"round\":$round,\"admitted\":true,\"attempt\":$tries,\"start\":\"$start\",\"end\":\"$(date -u +%FT%TZ)\",\"seq\":$SEQ}" >>"$REC"
      echo "round $round admitted (attempt $tries)"
      break
    fi
    sed "s/^{/{\"attempt\":$tries,\"notAdmittedRound\":$round,/" "$TMP" >>"$NOTADM"
    echo "{\"kind\":\"unit\",\"round\":$round,\"admitted\":false,\"attempt\":$tries,\"start\":\"$start\",\"end\":\"$(date -u +%FT%TZ)\",\"seq\":$SEQ}" >>"$REC"
    echo "round $round not admitted (attempt $tries)"
    if ((tries >= 4)); then
      exit 7
    fi
    check "before retry of round $round" || {
      echo "host not quiet before the retry"
      exit 6
    }
  done
done
echo "done $(date -u +%FT%TZ)"
