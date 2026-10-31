#!/usr/bin/env python3
"""Continuous host observer for one measured unit of run-admitted.sh.

Samples once a second until SIGTERM or SIGINT, then writes one JSON summary to OBSERVER_OUT (or
stdout) and exits 0 when no limit was crossed, 1 when one was. The limits are those of the host
benchmarking rules, as in admit-native-linux.py: available memory at least 8 GiB in every sample;
memory full PSI at most 10 ms and I/O full PSI at most 100 ms in any second; no swap-out, zswap-out
or zswap writeback.

Without PSI the pressure limits cannot be read, so the unit is not clean (the summary says "psi":
"unavailable"); a kernel started without psi=1 needs it enabled. A gap of more than 2.5 s between
two samples, or fewer than two samples, also makes the unit not clean: coverage must be unbroken.

What it does not cover, so a protocol that needs it must add it: competing CPU during the unit
(busy cores are recorded, not limited, because they include the unit's own work; the admission
checks before and after the unit judge competing CPU), and the counters of the unit's own cgroup
(swap, zswap, memory.events, cgroup identity). The summary records the observer's own CPU time,
sample count, process identity and sample timestamps. The observer changes nothing.
"""

import json
import os
import signal
import sys
import time

SWAPS = ("pswpout", "zswpout", "zswpwb")
STALLS = ("pgscan_direct", "compact_stall")
stop = False


def on_signal(_signum, _frame):
    global stop
    stop = True


def read(path):
    with open(path) as f:
        return f.read().splitlines()


def cpu():
    v = [int(x) for x in read("/proc/stat")[0].split()[1:9]]
    return sum(v) - v[3] - v[4], v[4]


def vmstat():
    d = {}
    for line in read("/proc/vmstat"):
        k, n = line.split()
        if k in SWAPS + STALLS or k.startswith("allocstall"):
            d[k] = int(n)
    return d


def psi(kind):
    try:
        for line in read(f"/proc/pressure/{kind}"):
            if line.startswith("full"):
                return int(line.split("total=")[1])
    except FileNotFoundError:
        return None


def avail_gib():
    for line in read("/proc/meminfo"):
        if line.startswith("MemAvailable"):
            return int(line.split()[1]) / 1048576


def start_ticks():
    return read("/proc/self/stat")[0].rsplit(")", 1)[1].split()[19]


def sample():
    return (time.time(), *cpu(), psi("memory"), psi("io"), avail_gib())


signal.signal(signal.SIGTERM, on_signal)
signal.signal(signal.SIGINT, on_signal)
hz = float(os.sysconf("SC_CLK_TCK"))
have_psi = psi("memory") is not None
v0 = vmstat()
samples = [sample()]
if os.environ.get("OBSERVER_OUT"):
    open(
        os.environ["OBSERVER_OUT"] + ".ready", "w"
    ).close()  # the driver starts the unit after this
while not stop:
    time.sleep(1)
    samples.append(sample())
v1 = vmstat()
steps = list(zip(samples, samples[1:], strict=False))
delta = {k: v1[k] - v0[k] for k in v0}
reasons = []
verdict = {
    "observer": "ok",
    "pid": os.getpid(),
    "start_ticks": start_ticks(),
    "samples": len(samples),
    "psi": "available" if have_psi else "unavailable",
    "deltas": delta,
}
MAX_GAP_S = 2.5
if steps:
    gaps = [b[0] - a[0] for a, b in steps]
    cores = [(b[1] - a[1]) / hz / (b[0] - a[0]) for a, b in steps]
    min_avail = min(s[5] for s in samples)
    verdict.update(
        window_s=round(samples[-1][0] - samples[0][0], 1),
        max_gap_s=round(max(gaps), 2),
        busy_cores_mean=round(sum(cores) / len(cores), 2),
        busy_cores_max_second=round(max(cores), 2),
        avail_gib_min=round(min_avail, 3),
        observer_cpu_s=round(sum(os.times()[:2]), 2),
        first_sample=samples[0][0],
        last_sample=samples[-1][0],
    )
    if max(gaps) > MAX_GAP_S:
        reasons.append("sampling gap above 2.5 s")
    if have_psi:
        mem = [(b[3] - a[3]) / 1000 / (b[0] - a[0]) for a, b in steps]
        io = [(b[4] - a[4]) / 1000 / (b[0] - a[0]) for a, b in steps]
        verdict.update(mem_full_psi_ms_max=round(max(mem), 2), io_full_psi_ms_max=round(max(io), 2))
        if max(mem) > 10:
            reasons.append("memory full PSI above 10 ms in a second")
        if max(io) > 100:
            reasons.append("I/O full PSI above 100 ms in a second")
    else:
        reasons.append("PSI unavailable: pressure cannot be read")
    if min_avail < 8:
        reasons.append("available memory below 8 GiB")
else:
    reasons.append("fewer than two samples")
if any(delta.get(k, 0) for k in SWAPS):
    reasons.append("swap-out or writeback")
verdict["reasons"] = reasons
verdict["clean"] = not reasons
line = json.dumps(verdict)
out = os.environ.get("OBSERVER_OUT")
if out:
    with open(out, "w") as f:
        f.write(line + "\n")
else:
    print(line)
sys.exit(0 if not reasons else 1)
