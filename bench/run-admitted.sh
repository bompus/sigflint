#!/bin/bash
# Admitted-pair runs of protocol-rerun-3.md. A unit is one library (arm) in one round measured under both runtimes back to back (Node first in odd rounds,
# Bun first in even rounds; arm order reversed in even rounds). A fresh host admission check runs before every unit and after every unit. A unit counts only when the check before it and the check after it both admitted and its observer ended clean. A unit
# that fails is kept in results/rerun-3-not-admitted.jsonl and the run exits at once, giving up the lock: it never waits for a quieter host, never sleeps
# or retries while holding the lock, and never blocks on it (a held lock exits 3). Running it again, from a one-shot timer or by hand, continues with the
# units not yet admitted; each unit has 4 attempts in all (every start counts, an interrupted one too), counted across runs from the receipts, and a unit
# past 4 exits 7.
# Usage: ADMIT=<command that prints one JSON verdict with "admit": true|false and exits 0 when the host is quiet>
#        OBSERVER=<command that samples the host until SIGTERM, then writes one JSON line with "clean": true|false to $OBSERVER_OUT and exits 0 when clean;
#        bench/observe-unit.py is the one the protocols use> [BENCH_LOCK=<lock file; default ~/.cache/setupLinuxHost/post-upgrade-bench.lock, the one scheduled jobs honor>] [FROM_ROUND=n]
#        run-admitted.sh <A|R|B|C|D> <dir with node.js, bun.js and SHA256SUMS> [rounds=3]
#   A  S3 header matrix, 8 arms                       -> results/speed-raw.jsonl
#   R  regression check against frozen/ (BASE=<dir> compares against that build instead) -> results/speed-regression.jsonl
#   B  other services and presigned URLs, 8 arms      -> results/speed-more.jsonl
#   C  memory: allocation, GC / CPU / growth / peak RSS, key-cache retention -> results/memory-raw.jsonl
#   D  import and first signature, REPS fresh processes per arm and runtime (default 7) -> results/memory-raw.jsonl
# RUNTIMES="node bun143 bun144" measures every unit under each listed runtime label (default "node bun"), in this order in odd rounds and the reverse in even rounds;
#   a label is node, or starts with bun. RT_BIN_<label>=<path> names its executable (characters of the label outside A-Za-z0-9_ become _ in the variable name; default: node or bun from PATH); its dist file is node.js or bun.js. Rows carry the label in "rt".
# RESULTS=<dir> writes the results elsewhere (a trial run). Receipts of every admission check: results/rerun-3-admission.jsonl. Exit: 0 finished, 3 lock held, 4 hashes, 6 host not quiet (run again), 7 a unit keeps failing or its results could not be written, 8 the allocation calibration is incomplete.
set -u
PART=${1:?part}
NEW=${2:?dir}
ROUNDS=${3:-3}
FROM=${FROM_ROUND:-1}
REPS=${REPS:-7}
CAP=${CAP:-2G}
HERE=$(cd "$(dirname "$0")" && pwd)
R=${RESULTS:-$HERE/results}
REC=$R/rerun-3-admission.jsonl
NOTADM=$R/rerun-3-not-admitted.jsonl
: "${ADMIT:?set ADMIT to the host admission command}"
: "${OBSERVER:?set OBSERVER to the continuous observer command}"
# One cgroup for the whole phase: this driver, its observer and every measured child run in one transient scope that
# carries the memory cap (CAP), so the observer can subtract the phase's own CPU and watch its counters.
# PHASE_SCOPE=1 marks the copy that runs inside it.
if [ -z "${PHASE_SCOPE:-}" ]; then
  exec systemd-run --user --scope --quiet --collect --expand-environment=no -p "MemoryMax=${CAP:-2G}" env PHASE_SCOPE=1 bash "$0" "$@"
fi
case $PART in A) OUT=$R/speed-raw.jsonl ;; R) OUT=$R/speed-regression.jsonl ;; B) OUT=$R/speed-more.jsonl ;; C | D) OUT=$R/memory-raw.jsonl ;; *)
  echo "unknown part $PART"
  exit 2
  ;;
esac
BASE=${BASE:-$HERE/frozen}
(cd "$NEW" && sha256sum -c --quiet SHA256SUMS && cd "$BASE" && sha256sum -c --quiet SHA256SUMS) || {
  echo "artifact hashes differ; refusing to run"
  exit 4
}
LOCK=${BENCH_LOCK:-$HOME/.cache/setupLinuxHost/post-upgrade-bench.lock}
mkdir -p "${LOCK%/*}"
exec 9>"$LOCK"
flock -n 9 || {
  echo "lock held by another phase; blocked, nothing waited for $(date -u +%FT%TZ)"
  exit 3
}
echo "lock held $(date -u +%FT%TZ)"
if ! { mkdir -p "$R" && TMP=$(mktemp "$R/.unit.XXXXXX"); }; then
  echo "cannot create the unit buffer in $R"
  exit 2
fi
trap 'rm -f "$TMP"' EXIT
CAPPED=$HERE/in-scope.sh # the scope already carries the cap; children are not given scopes of their own
read -r -a RUNTIME_LIST <<<"${RUNTIMES:-node bun}"
rtbin() { # rtbin <label>: the executable of a runtime label: RT_BIN_<label with every character outside A-Za-z0-9_ replaced by _>, else node or bun from PATH
  local v="RT_BIN_${1//[^A-Za-z0-9_]/_}"
  if [ -n "${!v:-}" ]; then
    echo "${!v}"
  else
    case $1 in node) echo node ;; bun*) echo bun ;; *) return 1 ;; esac
  fi
}
if ((${#RUNTIME_LIST[@]} == 0)); then
  echo "RUNTIMES lists no runtime label"
  exit 2
fi
for rt in "${RUNTIME_LIST[@]}"; do
  case $rt in node | bun*) ;; *)
    echo "unknown runtime label $rt (node, or a label starting with bun)"
    exit 2
    ;;
  esac
done
# rtart <label>: the built file of a runtime label
rtart() { case $1 in node*) echo node.js ;; *) echo bun.js ;; esac }
# rtseq <round>: the runtime labels in this round's order
rtseq() {
  if (($1 % 2 == 0)); then printf '%s\n' "${RUNTIME_LIST[@]}" | tac; else printf '%s\n' "${RUNTIME_LIST[@]}"; fi
}
LOGDIR=$R/memory-logs
mkdir -p "$LOGDIR"
ARMS=(sigflint-A aws4fetch aws4 smithy aws-sig wdl minio s3mini tiny-oss lean-s3 s3-lite-client sigflint-B)
declare -A CAND=(["sigflint-A"]=sigflint ["sigflint-B"]=sigflint [aws4fetch]=aws4fetch [aws4]=aws4 [smithy]=smithy ["aws-sig"]=aws-sig [wdl]=wdl [minio]=minio [s3mini]=s3mini ["tiny-oss"]=tiny-oss ["lean-s3"]=lean-s3 ["s3-lite-client"]=s3-lite-client [none]=none)

busy() {
  read -r _ u1 n1 s1 i1 w1 q1 sq1 st1 _ </proc/stat
  sleep 1
  read -r _ u2 n2 s2 i2 w2 q2 sq2 st2 _ </proc/stat
  local t1=$((u1 + n1 + s1 + i1 + w1 + q1 + sq1 + st1)) t2=$((u2 + n2 + s2 + i2 + w2 + q2 + sq2 + st2))
  echo $((100 * ((t2 - t1) - (i2 + w2 - i1 - w1)) / (t2 - t1)))
}
swapfree() { awk '/SwapFree/{print $2}' /proc/meminfo; }
SEQ=$(grep -c '"kind":"admit"' "$REC" 2>/dev/null || true)
SEQ=${SEQ:-0}
admit_state() { # admit_state <text>: prints true or false for the top-level "admit" of a JSON object, and invalid for anything else (not JSON, not an object, no boolean true)
  printf '%s' "$1" | bun -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let r="invalid";try{const o=JSON.parse(s);if(o&&typeof o==="object"&&!Array.isArray(o))r=o.admit===true?"true":"false"}catch{}process.stdout.write(r)})'
}
check() { # check <label>: one admission check; sets CHECK_SEQ, returns 0 when admitted
  local out st state
  out=$(bash -c "$ADMIT")
  st=$?
  out=$(printf '%s' "$out" | tr -d '\n')
  SEQ=$((SEQ + 1))
  CHECK_SEQ=$SEQ
  state=$(admit_state "$out")
  [ "$state" = invalid ] && out="{\"reasons\":[\"no verdict\"],\"admit\":false}"
  echo "{\"kind\":\"admit\",\"seq\":$SEQ,\"part\":\"$PART\",\"label\":\"$1\",\"at\":\"$(date -u +%FT%TZ)\",\"receipt\":$out}" >>"$REC"
  [ "$state" = true ] && ((st == 0))
} # admitted only when the command exited 0 and the top-level "admit" is the boolean true; anything else refuses
unit_done() { grep -q "\"kind\":\"unit\",\"part\":\"$PART\",\"id\":\"$1\",\"admitted\":true" "$REC" 2>/dev/null; }

# gate: one fresh sample of whole-machine Linux CPU busy, at most 20%; sets PRE and LOAD; returns 1 when the machine is not quiet. It never waits or retries.
gate() {
  PRE=$(busy)
  LOAD=$(cut -d' ' -f1 /proc/loadavg)
  ((PRE <= 20))
}
# emit <tag json> <exit status> <post busy> <swap delta kB> <stdout text>: appends the process's result lines, tagged, to the unit's buffer
emit() {
  local tag=$1 rc=$2 post=$3 sd=$4 text=$5 l et=${ERRTAG:-$1}
  if ((rc != 0)); then
    echo "{$et,\"status\":\"error\",\"exit\":$rc,\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$TMP"
    return
  fi
  local swaplim=51200                  # protocol-more.md (speed parts A, R, B): free swap fell by more than 50 MB while the process ran
  [[ $PART == [CD] ]] && swaplim=65536 # memory-protocol.md (parts C, D): more than 64 MiB
  if ((sd < -swaplim)); then
    echo "{$et,\"status\":\"rejected-swap\",\"swapFreeDeltaKb\":$sd,\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$TMP"
    return
  fi
  printf '%s\n' "$text" | while IFS= read -r l; do case "$l" in
    \{*) echo "${l%\}},$tag,\"preBusyPct\":$PRE,\"postBusyPct\":$post,\"load1\":$LOAD,\"swapFreeDeltaKb\":$sd,\"unit\":\"$UNIT\"}" >>"$TMP" ;;
    "") ;; *) case "$l" in *arn* | *eparsing* | *liminate*) ;; *) echo "{$et,\"status\":\"error\",\"msg\":\"$(printf '%s' "$l" | tr '\\"' "  " | cut -c1-120)\"}" >>"$TMP" ;; esac ;; esac done
}
# speedproc <arm> <runtime> <round> <cmd...>: gate, run, record (speed.mjs, speed-more.mjs print their own arm and runtime; failures get them from here)
speedproc() {
  local ar="\"arm\":\"$1\",\"runtime\":\"$2\",\"round\":$3"
  shift 3
  local sw0 sw1 post out rc
  gate || {
    echo "{$ar,\"status\":\"rejected-load\",\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$TMP"
    return
  }
  sw0=$(swapfree)
  out=$("$@" 2>&1)
  rc=$?
  post=$(busy)
  sw1=$(swapfree)
  ERRTAG=$ar emit "\"round\":${ar##*:}" "$rc" "$post" "$((sw1 - sw0))" "$out"
}
NODE_FLAGS_ALLOC=(--expose-gc --min-semi-space-size=128 --max-semi-space-size=128)
NODE_FLAGS_RUN=(--expose-gc)
# jsc_rows <log> <arm> <round> <alloc|run> <runtime label>: appends the Bun GC rows parsed from the log to the unit's buffer; when the parser fails or finds fewer regions than the log marks, appends an error row instead, so the unit is not admitted
jsc_rows() {
  local log=$1 arm=$2 round=$3 mode=$4 rt=$5 parsed want got l
  local bad="{\"round\":$round,\"kind\":\"$mode\",\"armTag\":\"$arm\",\"rt\":\"$rt\",\"status\":\"error\",\"msg\":\"gc log"
  parsed=$(bun "$HERE/parse-jsc-log.mjs" "$log" "$arm" "$round") || {
    echo "$bad parse failed\"}" >>"$TMP"
    return
  }
  want=$(grep -c '^@@BEGIN' "$log")
  got=$(printf '%s\n' "$parsed" | grep -c '^{')
  ((want == got)) || {
    echo "$bad has $want regions, $got parsed\"}" >>"$TMP"
    return
  }
  printf '%s\n' "$parsed" | while IFS= read -r l; do [ -n "$l" ] && echo "${l%\}},\"src\":\"jsc-log\",\"rt\":\"$rt\",\"armTag\":\"$arm\",\"procKind\":\"$mode\",\"unit\":\"$UNIT\"}" >>"$TMP"; done
}
memproc() { # memproc <alloc|run> <arm> <rt> <round>
  local mode=$1 arm=$2 rt=$3 round=$4 tag="\"round\":$4,\"kind\":\"$1\",\"armTag\":\"$2\",\"rt\":\"$3\"" sw0 sw1 out rc post err="$LOGDIR/$1-$3-$2-r$4.err"
  gate || {
    echo "{$tag,\"status\":\"rejected-load\",\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$TMP"
    return
  }
  sw0=$(swapfree)
  if [ "$rt" = node ]; then
    local flags=("${NODE_FLAGS_RUN[@]}")
    [ "$mode" = alloc ] && flags=("${NODE_FLAGS_ALLOC[@]}")
    out=$(ARM=$arm "$CAPPED" "$CAP" "$(rtbin "$rt")" "${flags[@]}" "$HERE/memory.mjs" "$mode" "${CAND[$arm]}" "$NEW/node.js" 2>"$err")
    rc=$?
  else
    out=$(ARM=$arm BUN_JSC_logGC=1 "$CAPPED" "$CAP" "$(rtbin "$rt")" "$HERE/memory.mjs" "$mode" "${CAND[$arm]}" "$NEW/$(rtart "$rt")" 2>"$err")
    rc=$?
  fi
  post=$(busy)
  sw1=$(swapfree)
  emit "$tag" "$rc" "$post" "$((sw1 - sw0))" "$out"
  if [ "$rt" != node ] && ((rc == 0)); then jsc_rows "$err" "$arm" "$round" "$mode" "$rt"; fi
  [ "$rt" = node ] && rm -f "$err"
}
shortproc() { # shortproc cache <arm> <rt> <round> <rep>
  local arm=$2 rt=$3 out rc sw0 sw1 tag="\"round\":$4,\"rep\":$5,\"kind\":\"$1\",\"armTag\":\"$2\",\"rt\":\"$3\""
  sw0=$(swapfree)
  if [ "$rt" = node ]; then
    out=$(ARM=$arm "$CAPPED" "$CAP" "$(rtbin "$rt")" --expose-gc "$HERE/cache.mjs" "$NEW/node.js" 2>&1)
    rc=$?
  else
    out=$(ARM=$arm "$CAPPED" "$CAP" "$(rtbin "$rt")" "$HERE/cache.mjs" "$NEW/$(rtart "$rt")" 2>&1)
    rc=$?
  fi
  sw1=$(swapfree)
  emit "$tag" "$rc" -1 "$((sw1 - sw0))" "$out"
}

run_unit() { # run_unit <round> <arm> : measures the unit under both runtimes into $TMP
  local round=$1 arm=$2 rt
  : >"$TMP"
  local RTS
  mapfile -t RTS < <(rtseq "$round")
  for rt in "${RTS[@]}"; do case $PART in
    A) speedproc "$arm" "$rt" "$round" env "ARM=$arm" "$(rtbin "$rt")" "$HERE/speed.mjs" "${CAND[$arm]}" "$NEW/$(rtart "$rt")" 1 ;;
    R)
      local F
      F=$NEW/$(rtart "$rt")
      [ "$arm" = frozen ] && F=$BASE/$(rtart "$rt")
      speedproc "$arm" "$rt" "$round" env "ARM=$arm" "$(rtbin "$rt")" "$HERE/speed.mjs" sigflint "$F" 1
      ;;
    B)
      local cand=$arm
      case $arm in final-*) cand=sigflint ;; esac
      speedproc "$arm" "$rt" "$round" env "ARM=$arm" "SRC=$NEW" "$(rtbin "$rt")" "$HERE/speed-more.mjs" "$cand" 1
      ;;
    C)
      memproc alloc "$arm" "$rt" "$round"
      memproc run "$arm" "$rt" "$round"
      case $arm in sigflint-*)
        PRE=-1
        LOAD=-1
        if gate; then
          shortproc cache "$arm" "$rt" "$round" 1
        else echo "{\"round\":$round,\"rep\":1,\"kind\":\"cache\",\"armTag\":\"$arm\",\"rt\":\"$rt\",\"status\":\"rejected-load\",\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$TMP"; fi
        ;;
      esac
      ;;
  esac done
}
run_import_round() { # part D: one unit is a whole round; Hyperfine times REPS cold starts of each arm and of the control `none` (the harness without a library) for each runtime
  local round=$1 rt arm hf
  : >"$TMP"
  local RTS
  mapfile -t RTS < <(rtseq "$round")
  local ORDER=("${ARMS[@]}")
  ((round % 2 == 0)) && mapfile -t ORDER < <(printf '%s\n' "${ARMS[@]}" | tac)
  for rt in "${RTS[@]}"; do
    gate || {
      echo "{\"round\":$round,\"kind\":\"import\",\"armTag\":\"group\",\"rt\":\"$rt\",\"status\":\"rejected-load\",\"preBusyPct\":$PRE,\"load1\":$LOAD}" >>"$TMP"
      continue
    }
    hf="$LOGDIR/import-$rt-r$round.json"
    local args=(-N --style none --warmup 1 --runs "$REPS" --ignore-failure --export-json "$hf")
    for arm in none "${ORDER[@]}"; do
      args+=(--command-name "$arm" "$(printf '%q ' "$(rtbin "$rt")" "$HERE/import-once.mjs" "${CAND[$arm]}" "$NEW/$(rtart "$rt")")")
    done
    rm -f "$hf"
    local sw0 sw1
    sw0=$(swapfree)
    hyperfine "${args[@]}" >/dev/null 2>&1
    local hrc=$?
    sw1=$(swapfree)
    if (($((sw1 - sw0)) < -65536)); then # memory-protocol.md: free swap fell by more than 64 MiB while the processes ran
      echo "{\"round\":$round,\"kind\":\"import\",\"armTag\":\"group\",\"rt\":\"$rt\",\"status\":\"rejected-swap\",\"swapFreeDeltaKb\":$((sw1 - sw0))}" >>"$TMP"
    elif ((hrc == 0)) && [ -s "$hf" ]; then
      bun "$HERE/hyperfine-rows.mjs" "$hf" "$round" "$rt" >>"$TMP" || echo "{\"round\":$round,\"kind\":\"import\",\"armTag\":\"group\",\"rt\":\"$rt\",\"status\":\"error\",\"msg\":\"hyperfine rows unreadable\"}" >>"$TMP"
    else
      echo "{\"round\":$round,\"kind\":\"import\",\"armTag\":\"group\",\"rt\":\"$rt\",\"status\":\"error\",\"msg\":\"hyperfine failed\"}" >>"$TMP"
    fi
  done
}

# the units of one round, in this round's order
units_of() {
  local round=$1 order=("${ARMS[@]}")
  case $PART in R)
    order=(final-1 final-2 frozen)
    ((round % 2 == 0)) && order=(frozen final-2 final-1)
    ;;
  B)
    order=(final-1 aws4 aws4fetch smithy aws-sig wdl minio final-2)
    ((round % 2 == 0)) && order=(final-2 minio wdl aws-sig smithy aws4fetch aws4 final-1)
    ;;
  D) order=(round) ;; *) ((round % 2 == 0)) && mapfile -t order < <(printf '%s\n' "${ARMS[@]}" | tac) ;; esac
  printf '%s\n' "${order[@]}"
}

if [ "$PART" = C ] && ((FROM == 1)) && [ ! -s "$R/memory-calibration-final.jsonl" ]; then # allocation calibration on every runtime, kept apart from the counted rows (memory-protocol.md); each row is tagged with its runtime label
  CAL=$R/memory-calibration-final.jsonl
  CT=$(mktemp "$R/.calibration.XXXXXX")
  NNODE=0
  NBUN=0
  for rt in "${RUNTIME_LIST[@]}"; do
    CERR=$LOGDIR/calib-$rt.err
    if [ "$rt" = node ]; then
      NNODE=$((NNODE + 1))
      ARM=calib "$CAPPED" "$CAP" "$(rtbin "$rt")" "${NODE_FLAGS_ALLOC[@]}" "$HERE/memory.mjs" alloc calib x 2>/dev/null | sed "s/}\$/,\"rt\":\"$rt\"}/" >>"$CT"
    else
      NBUN=$((NBUN + 1))
      {
        ARM=calib BUN_JSC_logGC=1 "$CAPPED" "$CAP" "$(rtbin "$rt")" "$HERE/memory.mjs" alloc calib x 2>"$CERR"
        bun "$HERE/parse-jsc-log.mjs" "$CERR" calib 1
      } | sed "s/}\$/,\"rt\":\"$rt\"}/" >>"$CT"
    fi
  done
  # complete when every Node runtime has both workloads and every Bun runtime has all four regions (real and control, two workloads)
  if (($(grep -c '"mode":"alloc","workload":"calib-[0-9]*".*"heapBytesPerCall"' "$CT") == 2 * NNODE && $(grep -c '"region":"alloc-real"' "$CT") == 2 * NBUN && $(grep -c '"region":"alloc-control"' "$CT") == 2 * NBUN)); then
    mv "$CT" "$CAL"
    echo "calibration done $(date -u +%FT%TZ)"
  else
    rm -f "$CT"
    echo "calibration incomplete; nothing written to $CAL"
    exit 8
  fi
fi
# observe_start / observe_stop: the continuous observer runs for exactly one unit attempt, as a process this script started and stops by its recorded
# PID and start time. The unit counts only when the observer was clean: it exited 0 on SIGTERM and its summary's top-level "clean" is true. It does not
# inherit the lock descriptor. It must write $OBSERVER_OUT.ready after its first sample (the unit starts after that, within 10 s). After SIGTERM it has 10 s
# to finish (checked once a second, then SIGKILL); those are the only waits. Summaries: $R/observer/.
OBS_PID=
OBS_START=
OBS_OUT=
pid_start() { awk '{ sub(/^.*\) /, ""); if ($1 != "Z") print $20 }' "/proc/$1/stat" 2>/dev/null; } # the process start time in ticks, empty when it is gone or a zombie
observe_start() {                                                                                  # observe_start <unit> <attempt>
  mkdir -p "$R/observer"
  OBS_OUT=$R/observer/$1.attempt$2.json
  rm -f "$OBS_OUT" "$OBS_OUT.ready"
  OBSERVER_OUT=$OBS_OUT UNIT_ID=$1 bash -c "exec $OBSERVER" >/dev/null 2>"$OBS_OUT.err" 9>&- &
  OBS_PID=$!
  OBS_START=$(pid_start "$OBS_PID")
}
observe_ready() { # waits up to 10 s, once a second, for the observer's first sample; returns 1 when it has none
  local t=0
  while [ ! -e "$OBS_OUT.ready" ]; do
    ((t >= 10)) && return 1
    sleep 1
    t=$((t + 1))
  done
}
observe_terminate() { # ends the recorded observer if it is the same process (same start time); sets OBS_RC, and OBS_EARLY=1 when it was already gone
  OBS_RC=1
  OBS_EARLY=0
  [ -n "$OBS_PID" ] || return 0
  if [ -z "$OBS_START" ] || [ "$(pid_start "$OBS_PID")" != "$OBS_START" ]; then
    OBS_EARLY=1 # it exited before the driver asked it to, so coverage ended before the unit did
  else
    kill -TERM "$OBS_PID" 2>/dev/null
    local t=0
    while [ "$(pid_start "$OBS_PID")" = "$OBS_START" ] && ((t < 10)); do
      sleep 1
      t=$((t + 1))
    done
    if [ "$(pid_start "$OBS_PID")" = "$OBS_START" ]; then kill -KILL "$OBS_PID" 2>/dev/null; fi
  fi
  wait "$OBS_PID" 2>/dev/null
  OBS_RC=$?
  OBS_PID=
}
observe_stop() { # sets OBS_CLEAN to 1 when the observer ended clean, else 0
  observe_terminate
  OBS_CLEAN=0
  ((OBS_EARLY == 0)) && ((OBS_RC == 0)) && [ -s "$OBS_OUT" ] && [ "$(bun -e 'try{const o=JSON.parse(await Bun.file(process.argv[1]).text());process.stdout.write(o&&o.clean===true?"1":"0")}catch{process.stdout.write("0")}' "$OBS_OUT")" = 1 ] && OBS_CLEAN=1
}
trap 'observe_terminate; rm -f "$TMP"' EXIT
for round in $(seq "$FROM" "$ROUNDS"); do
  for arm in $(units_of "$round"); do
    [ -n "${ONLY:-}" ] && [ "$PART" != D ] && [[ " $ONLY " != *" $arm "* ]] && continue # ONLY="arm ..." limits a trial run to some units
    UNIT="$PART-r$round-$arm"
    unit_done "$UNIT" && continue
    prior=$(grep -c "\"kind\":\"unit-start\",\"part\":\"$PART\",\"id\":\"$UNIT\"" "$REC" 2>/dev/null || true)
    attempt=$((${prior:-0} + 1)) # every start counts, an interrupted attempt included
    if ((attempt > 4)); then
      echo "$UNIT has used its 4 attempts; not measuring it again"
      exit 7
    fi
    check "before $UNIT" || {
      echo "host not quiet at $(date -u +%FT%TZ); giving up the lock, nothing waited for"
      exit 6
    }
    PRE_SEQ=$CHECK_SEQ
    echo "{\"kind\":\"unit-start\",\"part\":\"$PART\",\"id\":\"$UNIT\",\"attempt\":$attempt,\"at\":\"$(date -u +%FT%TZ)\"}" >>"$REC" || {
      echo "could not record the start of $UNIT in $REC; not measuring without a counted attempt"
      exit 7
    }
    observe_start "$UNIT" "$attempt"
    : >"$TMP"
    OBS_READY=0
    if observe_ready; then
      OBS_READY=1
      if [ "$PART" = D ]; then run_import_round "$round"; else run_unit "$round" "$arm"; fi
    else
      echo "the observer gave no first sample for $UNIT; the unit is not measured"
    fi
    observe_stop
    bad=$(grep -c '"status":"rejected-load"\|"status":"rejected-swap"\|"status":"error"' "$TMP" || true)
    errs=$(grep -c '"status":"error"' "$TMP" || true)
    if check "after $UNIT" && ((bad == 0)) && ((OBS_READY)) && ((OBS_CLEAN)); then
      cat "$TMP" >>"$OUT" || {
        echo "could not append $UNIT results to $OUT; stopping with no admitted receipt (the file may hold part of this unit)"
        exit 7
      }
      echo "{\"kind\":\"unit\",\"part\":\"$PART\",\"id\":\"$UNIT\",\"admitted\":true,\"attempt\":$attempt,\"checks\":[$PRE_SEQ,$CHECK_SEQ],\"observer\":\"$OBS_OUT\"}" >>"$REC" || {
        echo "could not record the admission of $UNIT in $REC; stopping"
        exit 7
      }
      echo "$UNIT admitted (attempt $attempt) $(date -u +%FT%TZ)"
      continue
    fi
    sed "s/^{/{\"notAdmitted\":\"$UNIT\",\"attempt\":$attempt,/" "$TMP" >>"$NOTADM"
    echo "{\"kind\":\"unit\",\"part\":\"$PART\",\"id\":\"$UNIT\",\"admitted\":false,\"attempt\":$attempt,\"checks\":[$PRE_SEQ,$CHECK_SEQ],\"badRows\":$bad,\"observerReady\":$OBS_READY,\"observerClean\":$OBS_CLEAN,\"observer\":\"$OBS_OUT\"}" >>"$REC"
    echo "$UNIT not admitted (attempt $attempt of 4, $bad bad rows, observer ready $OBS_READY, clean $OBS_CLEAN); giving up the lock, nothing retried $(date -u +%FT%TZ)"
    ((${errs:-0} > 0)) && exit 7
    exit 6
  done
  echo "part $PART round $round/$ROUNDS done $(date -u +%FT%TZ)"
done
echo "part $PART finished $(date -u +%FT%TZ)"
