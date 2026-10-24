#!/usr/bin/env python3
"""Host admission check for a native Linux host.

Applies the limits of the host benchmarking rules without the Windows side of a WSL host. Samples
once a second for a 10 s window, prints one JSON verdict and exits 0 to admit or 1 to refuse. It
changes nothing.

Limits: mean busy cores over the window at most 4; available memory at least 8 GiB at the start
and end; no swap-out, zswap-out or zswap writeback; memory full PSI at most 10 ms and I/O full PSI
at most 100 ms in any second.

Where the kernel has no PSI (/proc/pressure is missing, as on a kernel built with
CONFIG_PSI_DEFAULT_DISABLED and booted without psi=1), the pressure limits cannot be read. The
verdict then records "psi": "unavailable" and refuses on stand-ins instead: a direct-reclaim or
compaction stall (allocstall_*, pgscan_direct or compact_stall rising) for memory, and more than
100 ms of iowait CPU time in any second for I/O. The stand-ins are not PSI.
"""

import json
import os
import sys
import time

WINDOW = 10
STALLS = ("pgscan_direct", "compact_stall")
SWAPS = ("pswpout", "zswpout", "zswpwb")


def read(path):
    with open(path) as f:
        return f.read().splitlines()


def cpu():
    v = [int(x) for x in read("/proc/stat")[0].split()[1:]]
    return sum(v) - v[3] - v[4], v[4]  # busy (not idle, not iowait), iowait


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


def sample():
    return (time.time(), *cpu(), psi("memory"), psi("io"))


hz = float(os.sysconf("SC_CLK_TCK"))
have_psi = psi("memory") is not None
v0 = vmstat()
a0 = avail_gib()
samples = [sample()]
for _ in range(WINDOW):
    time.sleep(1)
    samples.append(sample())
v1 = vmstat()
a1 = avail_gib()
steps = list(zip(samples, samples[1:], strict=False))
t0, t1 = samples[0][0], samples[-1][0]
cores = (samples[-1][1] - samples[0][1]) / hz / (t1 - t0)
step_cores = [(b[1] - a[1]) / hz / (b[0] - a[0]) for a, b in steps]
iowait_ms = [(b[2] - a[2]) * 1000 / hz / (b[0] - a[0]) for a, b in steps]
delta = {k: v1[k] - v0[k] for k in v0}
verdict = {
    "reasons": [],
    "window_s": round(t1 - t0, 2),
    "busy_cores": round(cores, 2),
    "busy_cores_max_second": round(max(step_cores), 2),
    "avail_gib_start": round(a0, 1),
    "avail_gib_end": round(a1, 1),
    "iowait_ms_max_second": round(max(iowait_ms), 1),
    "psi": "available" if have_psi else "unavailable",
    "deltas": delta,
}
if have_psi:
    mem = [(b[3] - a[3]) / 1000 for a, b in steps]
    io = [(b[4] - a[4]) / 1000 for a, b in steps]
    verdict.update(mem_full_psi_ms_max=max(mem), io_full_psi_ms_max=max(io))
    if max(mem) > 10:
        verdict["reasons"].append("memory full PSI above 10 ms in a second")
    if max(io) > 100:
        verdict["reasons"].append("I/O full PSI above 100 ms in a second")
else:
    if any(n for k, n in delta.items() if k in STALLS or k.startswith("allocstall")):
        verdict["reasons"].append("reclaim or compaction stall in the window (stand-in, memory)")
    if max(iowait_ms) > 100:
        verdict["reasons"].append("iowait above 100 ms in a second (stand-in, I/O)")
if cores > 4:
    verdict["reasons"].append("more than 4 busy cores")
if min(a0, a1) < 8:
    verdict["reasons"].append("available memory below 8 GiB")
if any(delta[k] for k in SWAPS):
    verdict["reasons"].append("swap-out or writeback")
verdict["admit"] = not verdict["reasons"]
print(json.dumps(verdict))
sys.exit(0 if verdict["admit"] else 1)
