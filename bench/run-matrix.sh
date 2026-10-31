#!/bin/bash
# Historical: this script ran the earlier protocols that cite it, with the timing harness of the commit those protocols record (a hand-written batch timer and import-time.mjs). Current measurements use run-admitted.sh, Tinybench and Hyperfine.
# Speed matrix: arms x runtimes x rounds, one process per (round, runtime, arm), arm order reversed on even rounds.
# Records the machine state (whole-machine CPU busy, load, swap) around every process; Linux only (/proc).
# Usage: [BENCH_LOCK=/path/to/lockfile] [FROM_ROUND=n] [RUNTIMES="bun node"] [DENO=deno] run-matrix.sh <frozen dir with node.js and bun.js> <out.jsonl> [rounds=3]   (FROM_ROUND=4 with rounds=5 adds rounds 4 and 5 to an earlier file)
set -u
NEW=$1
OUT=$2
ROUNDS=${3:-3}
FROM=${FROM_ROUND:-1}
RUNTIMES=${RUNTIMES:-"bun node"}
DENO=${DENO:-deno}
HERE=$(cd "$(dirname "$0")" && pwd)
# Deno runs the Node build, since that is the code path it gets (node:crypto); it needs its own command form.
rt_cmd() {
  case "$1" in deno) printf '%s run -A' "$DENO" ;; *) printf '%s' "$1" ;; esac
}
rt_entry() {
  case "$1" in deno) printf '%s/node.js' "$NEW" ;; *) printf '%s/%s.js' "$NEW" "$1" ;; esac
}
if [ -n "${BENCH_LOCK:-}" ]; then # optional: serialize with other heavy jobs on a shared machine
  exec 9>"$BENCH_LOCK"
  echo "waiting for lock $BENCH_LOCK $(date -u +%FT%TZ)"
  flock -w 7200 9 || {
    echo "lock not acquired within 2 h"
    exit 3
  }
  echo "lock held $(date -u +%FT%TZ)"
fi
ARMS=(sigflint-A aws4fetch aws4 smithy aws-sig wdl minio sigflint-B)
declare -A CAND=(["sigflint-A"]=sigflint ["sigflint-B"]=sigflint [aws4fetch]=aws4fetch [aws4]=aws4 [smithy]=smithy ["aws-sig"]=aws-sig [wdl]=wdl [minio]=minio)
busy() { # CPU busy percent over 1 s, whole machine
  read -r _ u1 n1 s1 i1 w1 q1 sq1 st1 _ </proc/stat
  sleep 1
  read -r _ u2 n2 s2 i2 w2 q2 sq2 st2 _ </proc/stat
  local t1=$((u1 + n1 + s1 + i1 + w1 + q1 + sq1 + st1)) t2=$((u2 + n2 + s2 + i2 + w2 + q2 + sq2 + st2))
  echo $((100 * ((t2 - t1) - (i2 + w2 - i1 - w1)) / (t2 - t1)))
}
for round in $(seq "$FROM" "$ROUNDS"); do
  ORDER=("${ARMS[@]}")
  if ((round % 2 == 0)); then mapfile -t ORDER < <(printf '%s\n' "${ARMS[@]}" | tac); fi
  for rt in $RUNTIMES; do
    for arm in "${ORDER[@]}"; do
      tries=0
      pre=$(busy)
      while ((pre > 20 && tries < 8)); do
        sleep 15
        pre=$(busy)
        tries=$((tries + 1))
      done
      load=$(cut -d' ' -f1 /proc/loadavg)
      swap0=$(awk '/SwapFree/{print $2}' /proc/meminfo)
      if ((pre > 20)); then
        echo "{\"arm\":\"$arm\",\"runtime\":\"$rt\",\"round\":$round,\"status\":\"rejected-load\",\"preBusyPct\":$pre,\"load1\":$load}" >>"$OUT"
        continue
      fi
      # The Deno command form is two words, so this split is intended.
      # shellcheck disable=SC2046
      lines=$(ARM=$arm $(rt_cmd "$rt") "$HERE/speed.mjs" "${CAND[$arm]}" "$(rt_entry "$rt")" 1 2>&1)
      post=$(busy)
      swap1=$(awk '/SwapFree/{print $2}' /proc/meminfo)
      printf '%s\n' "$lines" | while IFS= read -r l; do
        case "$l" in \{*) echo "${l%\}},\"round\":$round,\"preBusyPct\":$pre,\"postBusyPct\":$post,\"load1\":$load,\"swapFreeDeltaKb\":$((swap1 - swap0))}" >>"$OUT" ;; *) echo "{\"arm\":\"$arm\",\"runtime\":\"$rt\",\"round\":$round,\"status\":\"error\",\"msg\":\"$(printf '%s' "$l" | tr '\\"' "  " | cut -c1-120)\"}" >>"$OUT" ;; esac
      done
    done
  done
  echo "round $round/$ROUNDS done $(date -u +%FT%TZ)"
done
echo "matrix finished $(date -u +%FT%TZ)"
