#!/bin/bash
# Runs the parts of a measurement campaign one after another through run-admitted.sh and keeps the promises of the protocol around it.
# Usage: ADMIT=<host admission command> OBSERVER=<observer command> FREEZE=<freeze record> RESULTS=<fresh dir> run-campaign.sh <artifact dir> [rounds=3] [parts="A B C D"]
# A refused part (exit 6) or a lock held by another session (exit 3) is run again after RETRY_S seconds (default 60), at most ATTEMPTS times
# (default 30) per part; the controller holds no lock while it waits. Exit 9 (a part finished with units out of their four attempts) is a
# recorded gap, and the next part goes on. Any other failure stops the campaign. DEADLINE_S (default 28800, eight hours) is counted from the
# first attempt, kept in $RESULTS/campaign-start; past it no new attempt starts and the exit status is 10. Progress: $RESULTS/campaign-progress.log.
ART=${1:?artifact dir}
ROUNDS=${2:-3}
PARTS=${3:-A B C D}
HERE=$(cd "$(dirname "$0")" && pwd)
: "${RESULTS:?set RESULTS to a fresh result directory}"
mkdir -p "$RESULTS"
PROG=$RESULTS/campaign-progress.log
START_FILE=$RESULTS/campaign-start
[ -s "$START_FILE" ] || date +%s >"$START_FILE"
START=$(cat "$START_FILE")
RETRY_S=${RETRY_S:-60}
ATTEMPTS=${ATTEMPTS:-30}
DEADLINE_S=${DEADLINE_S:-28800}
log() { echo "$(date -u +%FT%TZ) $*" >>"$PROG"; }
gaps=()
for part in $PARTS; do
  n=0
  while :; do
    if (($(date +%s) - START > DEADLINE_S)); then
      log "DEADLINE part $part not finished after ${DEADLINE_S}s; campaign stopped, finished parts stay valid"
      exit 10
    fi
    n=$((n + 1))
    if ((n > ATTEMPTS)); then
      log "FAILED part $part: $ATTEMPTS attempts used"
      exit 6
    fi
    log "START part $part attempt $n"
    (cd "$HERE" && bash run-admitted.sh "$part" "$ART" "$ROUNDS") >>"$RESULTS/part-$part.log" 2>&1
    rc=$?
    log "END part $part attempt $n exit $rc"
    case $rc in
      0) break ;;
      9)
        gaps+=("$part")
        log "GAP part $part: $(grep 'units left unmeasured' "$RESULTS/part-$part.log" | tail -1)"
        break
        ;;
      6 | 3) sleep "$RETRY_S" ;;
      *)
        log "FAILED part $part: exit $rc"
        exit "$rc"
        ;;
    esac
  done
done
log "DONE gaps: ${gaps[*]:-none}"
