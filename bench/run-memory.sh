#!/bin/bash
# Memory matrix (see memory-protocol.md): allocation, GC / CPU / growth, import time and key-cache retention.
# One process per (round, runtime, arm, kind); arm order reversed on even rounds; every process under a cgroup memory cap.
# Linux only (/proc). Usage: [BENCH_LOCK=/path/to/lockfile] [REPS=7] [KINDS="alloc run cache import"] run-memory.sh <dir with node.js and bun.js, SHA256SUMS> <out.jsonl> [rounds=3]   (FROM_ROUND=4 with rounds=5 adds rounds 4 and 5)
# KINDS limits the run to some of the process kinds (default all four).
set -u
NEW=$1
OUT=$2
ROUNDS=${3:-3}
REPS=${REPS:-7}
FROM=${FROM_ROUND:-1}
HERE=$(cd "$(dirname "$0")" && pwd)
LOGDIR="$(dirname "$OUT")/memory-logs"
mkdir -p "$LOGDIR"
CAP=${CAP:-2G}
KINDS=${KINDS:-alloc run cache import}
want() { [[ " $KINDS " == *" $1 "* ]]; }
if [ -n "${BENCH_LOCK:-}" ]; then
  exec 9>"$BENCH_LOCK"
  echo "waiting for lock $BENCH_LOCK $(date -u +%FT%TZ)"
  flock -w 7200 9 || {
    echo "lock not acquired within 2 h"
    exit 3
  }
  echo "lock held $(date -u +%FT%TZ)"
fi
(cd "$NEW" && sha256sum -c SHA256SUMS >/dev/null 2>&1) || {
  echo "frozen files do not match SHA256SUMS"
  exit 4
}
ARMS=(sigflint-A aws4fetch aws4 smithy aws-sig wdl minio sigflint-B)
declare -A CAND=(["sigflint-A"]=sigflint ["sigflint-B"]=sigflint [aws4fetch]=aws4fetch [aws4]=aws4 [smithy]=smithy ["aws-sig"]=aws-sig [wdl]=wdl [minio]=minio [none]=none)
CAPPED=$HOME/.local/bin/run-capped
NODE_FLAGS_ALLOC=(--expose-gc --min-semi-space-size=128 --max-semi-space-size=128)
NODE_FLAGS_RUN=(--expose-gc)
busy() { # CPU busy percent over 1 s, whole machine
  read -r _ u1 n1 s1 i1 w1 q1 sq1 st1 _ </proc/stat
  sleep 1
  read -r _ u2 n2 s2 i2 w2 q2 sq2 st2 _ </proc/stat
  local t1=$((u1 + n1 + s1 + i1 + w1 + q1 + sq1 + st1)) t2=$((u2 + n2 + s2 + i2 + w2 + q2 + sq2 + st2))
  echo $((100 * ((t2 - t1) - (i2 + w2 - i1 - w1)) / (t2 - t1)))
}
swapfree() { awk '/SwapFree/{print $2}' /proc/meminfo; }
# gate <tag json>: waits for a quiet machine; sets PRE, LOAD; returns 1 (and records a rejection) when it never quiets
gate() {
  local tries=0
  PRE=$(busy)
  while ((PRE > 20 && tries < 8)); do
    sleep 15
    PRE=$(busy)
    tries=$((tries + 1))
  done
  LOAD=$(cut -d' ' -f1 /proc/loadavg)
  if ((PRE > 20)); then
    echo "{$1,\"status\":\"rejected-load\",\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$OUT"
    return 1
  fi
  return 0
}
# emit <tag json> <exit status> <post busy> <swap delta kB> <round> <stdout text>: appends tagged result lines
emit() {
  local tag=$1 rc=$2 post=$3 sd=$4 text=$5 l
  if ((rc != 0)); then
    echo "{$tag,\"status\":\"error\",\"exit\":$rc,\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$OUT"
    return
  fi
  printf '%s\n' "$text" | while IFS= read -r l; do
    case "$l" in \{*) echo "${l%\}},$tag,\"preBusyPct\":$PRE,\"postBusyPct\":$post,\"load1\":$LOAD,\"swapFreeDeltaKb\":$sd}" >>"$OUT" ;; *) echo "{$tag,\"status\":\"error\",\"msg\":\"$(printf '%s' "$l" | tr '\\"' "  " | cut -c1-120)\"}" >>"$OUT" ;; esac
  done
}
# tag fields are appended after the process's own object; the process object already has arm, runtime, mode
memproc() { # memproc <alloc|run> <arm> <rt> <round>
  local mode=$1 arm=$2 rt=$3 round=$4 tag="\"round\":$4,\"kind\":\"$1\",\"armTag\":\"$2\",\"rt\":\"$3\""
  gate "$tag" || return
  local sw0 sw1 out rc err="$LOGDIR/$mode-$rt-$arm-r$round.err"
  sw0=$(swapfree)
  if [ "$rt" = node ]; then
    local flags=("${NODE_FLAGS_RUN[@]}")
    [ "$mode" = alloc ] && flags=("${NODE_FLAGS_ALLOC[@]}")
    out=$(ARM=$arm "$CAPPED" "$CAP" node "${flags[@]}" "$HERE/memory.mjs" "$mode" "${CAND[$arm]}" "$NEW/node.js" 2>"$err")
    rc=$?
  else
    out=$(ARM=$arm BUN_JSC_logGC=1 "$CAPPED" "$CAP" bun "$HERE/memory.mjs" "$mode" "${CAND[$arm]}" "$NEW/bun.js" 2>"$err")
    rc=$?
  fi
  local post
  post=$(busy)
  sw1=$(swapfree)
  emit "$tag" "$rc" "$post" "$((sw1 - sw0))" "$out"
  if [ "$rt" = bun ] && ((rc == 0)); then
    node "$HERE/parse-jsc-log.mjs" "$err" "$arm" "$round" | while IFS= read -r l; do echo "${l%\}},\"src\":\"jsc-log\",\"rt\":\"bun\",\"armTag\":\"$arm\",\"procKind\":\"$mode\"}" >>"$OUT"; done
  fi
  [ "$rt" = node ] && rm -f "$err"
}
shortproc() { # shortproc <import|cache> <arm> <rt> <round> <rep>
  local kind=$1 arm=$2 rt=$3 round=$4 rep=$5 out rc post sw0 sw1
  local tag="\"round\":$round,\"rep\":$rep,\"kind\":\"$kind\",\"armTag\":\"$arm\",\"rt\":\"$rt\""
  sw0=$(swapfree)
  if [ "$kind" = import ]; then
    if [ "$rt" = node ]; then
      out=$(ARM=$arm "$CAPPED" "$CAP" node "$HERE/import-time.mjs" "${CAND[$arm]}" "$NEW/node.js" 2>&1)
      rc=$?
    else
      out=$(ARM=$arm "$CAPPED" "$CAP" bun "$HERE/import-time.mjs" "${CAND[$arm]}" "$NEW/bun.js" 2>&1)
      rc=$?
    fi
  else
    if [ "$rt" = node ]; then
      out=$(ARM=$arm "$CAPPED" "$CAP" node --expose-gc "$HERE/cache.mjs" "$NEW/node.js" 2>&1)
      rc=$?
    else
      out=$(ARM=$arm "$CAPPED" "$CAP" bun "$HERE/cache.mjs" "$NEW/bun.js" 2>&1)
      rc=$?
    fi
  fi
  sw1=$(swapfree)
  post=-1
  emit "$tag" "$rc" "$post" "$((sw1 - sw0))" "$out"
}
for round in $(seq "$FROM" "$ROUNDS"); do
  ORDER=("${ARMS[@]}")
  if ((round % 2 == 0)); then mapfile -t ORDER < <(printf '%s\n' "${ARMS[@]}" | tac); fi
  for rt in bun node; do
    for arm in "${ORDER[@]}"; do
      want alloc && memproc alloc "$arm" "$rt" "$round"
      want run && memproc run "$arm" "$rt" "$round"
    done
    # cache retention: sigflint only, A and B in this round's order
    want cache && for arm in "${ORDER[@]}"; do case "$arm" in sigflint-*)
      PRE=-1
      LOAD=-1
      gate "\"round\":$round,\"kind\":\"cache\",\"armTag\":\"$arm\",\"rt\":\"$rt\"" && shortproc cache "$arm" "$rt" "$round" 1
      ;;
    esac done
    # import time: REPS fresh processes per arm, the control `none` included, interleaved
    IORDER=("none" "${ORDER[@]}")
    want import && for rep in $(seq 1 "$REPS"); do
      gate "\"round\":$round,\"rep\":$rep,\"kind\":\"import\",\"armTag\":\"group\",\"rt\":\"$rt\"" || continue
      for arm in "${IORDER[@]}"; do shortproc import "$arm" "$rt" "$round" "$rep"; done
    done
  done
  echo "round $round/$ROUNDS done $(date -u +%FT%TZ)"
done
echo "memory matrix finished $(date -u +%FT%TZ)"
