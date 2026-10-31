#!/bin/bash
# Historical: this script ran the earlier protocols that cite it, with the timing harness of the commit those protocols record (a hand-written batch timer and import-time.mjs). Current measurements use run-admitted.sh, Tinybench and Hyperfine.
# The runs of protocol-more.md: part A (regression against bench/frozen) -> results/speed-regression.jsonl, part B (other services, presigned URLs) -> results/speed-more.jsonl.
# Usage: bench/run-more.sh   (holds the host lock for the whole run; prints one progress line per round)
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(dirname "$HERE")
SRC=${SRC:-$ROOT/dist}
export SRC # the files sigflint measures: the built entries Node and Bun load (npm run build), or src/ for the six-module code
OUT_A=$HERE/results/speed-regression.jsonl
OUT_B=$HERE/results/speed-more.jsonl
ROUNDS=${ROUNDS:-3}
FROM=${FROM_ROUND:-1} # FROM_ROUND=4 ROUNDS=5 adds rounds 4 and 5 to the files of an earlier run
if ! { cd "$ROOT" && sha256sum -c --quiet bench/results/more-artifacts.sha256; }; then
  echo "artifact hashes differ; refusing to run"
  exit 4
fi
cd "$HERE" || exit 4
exec 9>"${BENCH_LOCK:-$HOME/.cache/bench-host.lock}"
echo "waiting for lock $(date -u +%FT%TZ)"
flock -w 7200 9 || {
  echo "lock not acquired"
  exit 3
}
echo "lock held $(date -u +%FT%TZ)"
busy() {
  read -r _ u1 n1 s1 i1 w1 q1 sq1 st1 _ </proc/stat
  sleep 1
  read -r _ u2 n2 s2 i2 w2 q2 sq2 st2 _ </proc/stat
  local t1=$((u1 + n1 + s1 + i1 + w1 + q1 + sq1 + st1)) t2=$((u2 + n2 + s2 + i2 + w2 + q2 + sq2 + st2))
  echo $((100 * ((t2 - t1) - (i2 + w2 - i1 - w1)) / (t2 - t1)))
}
gate() { # sets pre, load, swap0; returns 1 when the process is rejected
  local tries=0
  pre=$(busy)
  while ((pre > 20 && tries < 8)); do
    sleep 15
    pre=$(busy)
    tries=$((tries + 1))
  done
  load=$(cut -d' ' -f1 /proc/loadavg)
  swap0=$(awk '/SwapFree/{print $2}' /proc/meminfo)
  ((pre <= 20))
}
record() { # out arm runtime round; stdin = the process output
  local out=$1 arm=$2 rt=$3 round=$4 post swap1
  post=$(busy)
  swap1=$(awk '/SwapFree/{print $2}' /proc/meminfo)
  while IFS= read -r l; do case "$l" in \{*) echo "${l%\}},\"round\":$round,\"preBusyPct\":$pre,\"postBusyPct\":$post,\"load1\":$load,\"swapFreeDeltaKb\":$((swap1 - swap0))}" >>"$out" ;;
  *) case "$l" in *arn* | *eparsing* | *liminate* | "") ;; *) echo "{\"arm\":\"$arm\",\"runtime\":\"$rt\",\"round\":$round,\"status\":\"error\",\"msg\":\"$(printf '%s' "$l" | tr '\\"' "  " | cut -c1-120)\"}" >>"$out" ;; esac ;; esac done
}
((FROM == 1)) && {
  : >"$OUT_A"
  : >"$OUT_B"
}
for round in $(seq "$FROM" "$ROUNDS"); do
  ORDER=(final-1 final-2 frozen)
  ((round % 2 == 0)) && ORDER=(frozen final-2 final-1)
  for rt in node bun; do for arm in "${ORDER[@]}"; do
    if ! gate; then
      echo "{\"arm\":\"$arm\",\"runtime\":\"$rt\",\"round\":$round,\"status\":\"rejected-load\",\"preBusyPct\":$pre}" >>"$OUT_A"
      continue
    fi
    if [ "$arm" = frozen ]; then F=$HERE/frozen/$rt.js; else F=$SRC/$rt.js; fi
    ARM=$arm $rt "$HERE/speed.mjs" sigflint "$F" 1 2>&1 | record "$OUT_A" "$arm" "$rt" "$round"
  done; done
  echo "A round $round/$ROUNDS $(date -u +%FT%TZ)"
done
for round in $(seq "$FROM" "$ROUNDS"); do
  ORDER=(final-1 aws4 aws4fetch smithy aws-sig wdl minio final-2)
  ((round % 2 == 0)) && ORDER=(final-2 minio wdl aws-sig smithy aws4fetch aws4 final-1)
  for rt in node bun; do for arm in "${ORDER[@]}"; do
    if ! gate; then
      echo "{\"arm\":\"$arm\",\"runtime\":\"$rt\",\"round\":$round,\"status\":\"rejected-load\",\"preBusyPct\":$pre}" >>"$OUT_B"
      continue
    fi
    cand=$arm
    case $arm in final-*) cand=sigflint ;; esac
    ARM=$arm $rt "$HERE/speed-more.mjs" "$cand" 1 2>&1 | record "$OUT_B" "$arm" "$rt" "$round"
  done; done
  echo "B round $round/$ROUNDS $(date -u +%FT%TZ)"
done
echo "finished $(date -u +%FT%TZ)"
