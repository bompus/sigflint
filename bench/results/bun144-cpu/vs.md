# Bun 1.4.4 against Bun 1.4.3

Each figure is the median of the rounds. A figure moved only when the medians differ by more than the larger of the two runs' reporting bands and the metric's absolute floor, and the min-max ranges do not overlap. Otherwise: no clear change.

| metric | runtime | workload | library | Bun 1.4.3 | Bun 1.4.4 | change | verdict |
|---|---|---|---|---|---|---|---|
| allocBytes | node | bench-download | sigflint-A | 2625 | 2625 | 0.0% | no clear change |
| allocBytes | node | bench-part-put | sigflint-A | 4048 | 4048 | 0.0% | no clear change |
| allocBytes | node | bench-encode | sigflint-A | 5632 | 5632 | 0.0% | no clear change |
| allocBytes | node | bench-body-1k | sigflint-A | 4130 | 4130 | 0.0% | no clear change |
| allocBytes | bun | bench-download | sigflint-A | 1427.0464 | 1434.0095999999999 | 0.5% | no clear change |
| allocBytes | bun | bench-part-put | sigflint-A | 2759.8848 | 2770.432 | 0.4% | no clear change |
| allocBytes | bun | bench-encode | sigflint-A | 4366.7456 | 4368.2816 | 0.0% | no clear change |
| allocBytes | bun | bench-body-1k | sigflint-A | 2636.0832 | 2644.5824 | 0.3% | no clear change |
| retained | node | bench-download | sigflint-A | 30096 | 30096 | 0.0% | no clear change |
| retained | node | bench-part-put | sigflint-A | 37888 | 37888 | 0.0% | no clear change |
| retained | node | bench-encode | sigflint-A | -1456 | -1456 | 0.0% | no clear change |
| retained | node | bench-body-1k | sigflint-A | 13080 | 13080 | 0.0% | no clear change |
| retained | bun | bench-download | sigflint-A | 849 | 910 | 7.2% | no clear change |
| retained | bun | bench-part-put | sigflint-A | 4586 | 9258 | 101.9% | no clear change |
| retained | bun | bench-encode | sigflint-A | 2669 | 2765 | 3.6% | no clear change |
| retained | bun | bench-body-1k | sigflint-A | 5104 | 2101 | -58.8% | no clear change |
| cpuUs | node | bench-download | sigflint-A | 2.3651 | 2.3651 | 0.0% | no clear change |
| cpuUs | node | bench-part-put | sigflint-A | 2.2012 | 2.2012 | 0.0% | no clear change |
| cpuUs | node | bench-encode | sigflint-A | 2.7189 | 2.7189 | 0.0% | no clear change |
| cpuUs | node | bench-body-1k | sigflint-A | 2.5657 | 2.5657 | 0.0% | no clear change |
| cpuUs | bun | bench-download | sigflint-A | 2.3635 | 2.1192 | -10.3% | no clear change |
| cpuUs | bun | bench-part-put | sigflint-A | 2.3351 | 2.0065 | -14.1% | no clear change |
| cpuUs | bun | bench-encode | sigflint-A | 3.8108 | 3.8174 | 0.2% | no clear change |
| cpuUs | bun | bench-body-1k | sigflint-A | 2.5576 | 2.0808 | -18.6% | no clear change |
| gcCount | node | bench-download | sigflint-A | 6 | 6 | 0.0% | no clear change |
| gcCount | node | bench-part-put | sigflint-A | 10 | 10 | 0.0% | no clear change |
| gcCount | node | bench-encode | sigflint-A | 14 | 14 | 0.0% | no clear change |
| gcCount | node | bench-body-1k | sigflint-A | 10 | 10 | 0.0% | no clear change |
| gcCount | bun | bench-download | sigflint-A | 3 | 3 | 0.0% | no clear change |
| gcCount | bun | bench-part-put | sigflint-A | 5 | 5 | 0.0% | no clear change |
| gcCount | bun | bench-encode | sigflint-A | 7 | 7 | 0.0% | no clear change |
| gcCount | bun | bench-body-1k | sigflint-A | 5 | 5 | 0.0% | no clear change |
| gcMs | node | bench-download | sigflint-A | 0.3414490073919296 | 0.3414490073919296 | 0.0% | no clear change |
| gcMs | node | bench-part-put | sigflint-A | 0.43348000943660736 | 0.43348000943660736 | 0.0% | no clear change |
| gcMs | node | bench-encode | sigflint-A | 0.5265980064868927 | 0.5265980064868927 | 0.0% | no clear change |
| gcMs | node | bench-body-1k | sigflint-A | 0.40570099651813507 | 0.40570099651813507 | 0.0% | no clear change |
| gcMs | bun | bench-download | sigflint-A | 0.9946550000000001 | 1.0281280000000002 | 3.4% | no clear change |
| gcMs | bun | bench-part-put | sigflint-A | 1.5862040000000004 | 1.6367120000000002 | 3.2% | no clear change |
| gcMs | bun | bench-encode | sigflint-A | 2.134183 | 2.158574 | 1.1% | no clear change |
| gcMs | bun | bench-body-1k | sigflint-A | 1.5526630000000001 | 1.4600520000000001 | -6.0% | no clear change |
| maxRss | node | - | sigflint-A | 83406848 | 83406848 | 0.0% | no clear change |
| maxRss | bun | - | sigflint-A | 65650688 | 67735552 | 3.2% | no clear change |
| cacheEntry | node | - | sigflint-A | 328.656 | 328.656 | 0.0% | no clear change |
| cacheEntry | bun | - | sigflint-A | 358.618 | 359.845 | 0.3% | no clear change |

## Counts

- allocBytes: 0 of 52 figures moved
- retained: 0 of 52 figures moved
- cpuUs: 0 of 52 figures moved
- gcCount: 0 of 52 figures moved
- gcMs: 0 of 52 figures moved
- maxRss: 0 of 16 figures moved
- cacheEntry: 0 of 4 figures moved
