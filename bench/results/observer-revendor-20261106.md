# Unit observer re-vendored, 2026-11-06

`bench/observe-unit.py` was replaced with the house-rules unit observer at commit `a4f8dd4`; its header names that commit. Before, it was the copy at `e2a593e`. Nothing else was adapted. No measurement was run, and no recorded result changes.

## What the release 1.0.4 record says about the observer

The 1.0.4 campaign ran the copy at `e2a593e`: the file's git blob at the freeze commit `2685da5` is the same as the blob just before this change (`82de04f2`). Read the statement in `protocol-release-1.0.4.md` that the frozen `bench/` code is unchanged since `2685da5` as covering the observer that ran; the file in the tree now differs from it. To check that record against its observer, use `git show 2685da5:bench/observe-unit.py`.

## What the new observer does differently

- It scales each pressure interval to one second before comparing it with the limit (memory full 10 ms, I/O full 100 ms), dividing by the time between the two reads with a floor of 0.5 s, and rejects reads more than a set gap apart. The protocol's "pressure within the same limits per interval" describes the limits, which are unchanged; the old copy compared the unscaled difference between reads.
- It times the reads of each sample, so a stall in the final sample is caught.
- A first sample that already fails writes no `.ready` file, so `run-admitted.sh` reports no first sample and does not start the unit.
- A storage phase requires the `pswpout` counter.
- Budgets are compared before rounding. Limits can be set with flags; the defaults are the ones the protocols state, and the observer's own cost limits are still 0.05 cores and 128 MiB.

`run-admitted.sh` uses only `OBSERVER_OUT`, `--workload-cgroup auto`, the `.ready` file and the top-level `clean` key, and those are unchanged.
