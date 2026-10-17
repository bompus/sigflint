# Node and Bun alternating samples for the nine in-band rows

Each round runs the same hashed build and the same harness scripts as the re-run, Node and Bun back to back for each candidate (Node first in odd rounds, Bun first in even rounds). Rounds 1-6: per-process Linux CPU gate only. Rounds 7-10: a host admission check (Linux and Windows CPU, memory and I/O pressure, swap) before and after every pair; only pairs admitted both times count. Units: ns per call, CPU time in µs per call.

| row | admitted pairs (rounds 7-10) | Node median (min-max) | Bun median (min-max) | Bun over Node | verdict |
|---|--:|---|---|--:|---|
| A speed ns bench-download aws4 | 2 (rounds 8, 9) | 5,637 (5,521-5,637) | 6,071 (5,961-6,071) | +7.7% | Node ahead, ranges disjoint; only 2 admitted pairs, not settled at the 10-round cap |
| A speed ns bench-download sigflint-B | 3 (rounds 7, 8, 9) | 1,368 (1,345-1,373) | 1,341 (1,277-1,536) | -2.0% | Bun ahead in median, ranges overlap; only 3 admitted pairs, not settled at the 10-round cap |
| B speed ns any-query sigflint | 3 (rounds 7, 8, 9) | 1,874 (1,838-1,882) | 2,154 (2,104-2,201) | +14.9% | Node ahead, ranges disjoint; only 3 admitted pairs, not settled at the 10-round cap |
| B speed ns event-4k sigflint | 3 (rounds 7, 8, 9) | 11,150 (10,961-11,756) | 12,272 (12,027-12,310) | +10.1% | Node ahead, ranges disjoint; only 3 admitted pairs, not settled at the 10-round cap |
| B speed ns presign-any aws4 | 4 (rounds 7, 8, 9, 10) | 11,151 (10,609-11,611) | 14,465 (13,128-14,511) | +29.7% | Node ahead, ranges disjoint |
| B speed ns presign-any smithy | 4 (rounds 7, 8, 9, 10) | 12,924 (11,688-12,954) | 15,223 (13,995-18,069) | +17.8% | Node ahead, ranges disjoint |
| B speed ns presign-s3 smithy | 4 (rounds 7, 8, 9, 10) | 12,804 (12,362-13,393) | 18,899 (15,652-19,958) | +47.6% | Node ahead, ranges disjoint |
| C/D cpuUs µs bench-body-1k aws4 | 4 (rounds 7, 8, 9, 10) | 9.86 (9.69-9.88) | 8.18 (7.20-9.27) | -17.0% | Bun ahead, ranges disjoint |
| C/D cpuUs µs bench-body-1k smithy | 4 (rounds 7, 8, 9, 10) | 16.49 (16.14-21.50) | 14.64 (11.93-15.01) | -11.2% | Bun ahead, ranges disjoint |

## Every round, Node / Bun

Rounds 1-6 were not checked per pair. A * marks a round 7-10 pair that failed its admission check and is not counted.

| row | round: Node / Bun |
|---|---|
| A speed ns bench-download aws4 | 1: 6,021 / 8,763; 2: 7,322 / 9,913; 3: 6,737 / 10,092; 4: 6,235 / 9,485; 5: 6,281 / 9,925; 6: 5,769 / 6,886; 7*: 5,643 / 8,953; 8: 5,637 / 5,961; 9: 5,521 / 6,071; 10*: 5,718 / 6,944 |
| A speed ns bench-download sigflint-B | 1: 1,436 / 1,811; 2: 1,677 / 1,983; 3: 1,428 / 1,982; 4: 1,357 / 1,860; 5: 1,485 / 2,180; 6: 1,339 / 1,329; 7: 1,368 / 1,536; 8: 1,373 / 1,341; 9: 1,345 / 1,277; 10*: 1,340 / 1,400 |
| B speed ns any-query sigflint | 1: 2,100 / 2,763; 2: 2,327 / 3,502; 3: 2,131 / 3,366; 4: 2,111 / 3,210; 5: 2,451 / 3,695; 6: 1,868 / 2,934; 7: 1,838 / 2,201; 8: 1,882 / 2,154; 9: 1,874 / 2,104; 10*: 1,932 / 2,898 |
| B speed ns event-4k sigflint | 1: 12,358 / 13,563; 2: 12,936 / 14,191; 3: 12,957 / 14,019; 4: 12,858 / 14,771; 5: 13,961 / 14,376; 6: 11,112 / 12,531; 7: 11,756 / 12,310; 8: 11,150 / 12,272; 9: 10,961 / 12,027; 10*: 12,562 / 13,450 |
| B speed ns presign-any aws4 | 1: 12,150 / 17,564; 2: 13,167 / 27,825; 3: 12,073 / 21,695; 4: 13,590 / 24,139; 5: 14,402 / 24,914; 6: 10,701 / 11,661; 7: 11,151 / 14,465; 8: 10,609 / 13,128; 9: 10,733 / 14,511; 10: 11,611 / 13,539 |
| B speed ns presign-any smithy | 1: 12,619 / 18,483; 3: 14,112 / 20,984; 4: 14,522 / 23,382; 5: 15,286 / 23,825; 6: 11,495 / 14,261; 7: 12,364 / 15,223; 8: 12,924 / 15,217; 9: 11,688 / 13,995; 10: 12,954 / 18,069 |
| B speed ns presign-s3 smithy | 1: 13,827 / 21,743; 3: 14,936 / 23,471; 4: 15,095 / 26,184; 5: 16,436 / 26,259; 6: 12,430 / 13,746; 7: 12,804 / 18,899; 8: 12,719 / 15,652; 9: 12,362 / 16,921; 10: 13,393 / 19,958 |
| C/D cpuUs µs bench-body-1k aws4 | 1: 12.38 / 13.33; 2: 10.78 / 12.23; 3: 11.03 / 12.64; 4: 14.58 / 13.33; 5: 13.04 / 13.59; 6: 9.96 / 7.23; 7: 9.69 / 9.27; 8: 9.83 / 7.72; 9: 9.88 / 8.18; 10: 9.86 / 7.20 |
| C/D cpuUs µs bench-body-1k smithy | 1: 20.03 / 23.58; 2: 17.71 / 21.49; 3: 18.80 / 18.61; 4: 18.59 / 23.69; 5: 20.40 / 20.69; 6: 16.36 / 12.28; 7: 16.14 / 11.93; 8: 16.49 / 15.01; 9: 21.50 / 14.64; 10: 16.27 / 12.53 |

Admission receipts of rounds 7-10 that admitted (52): combined Linux and Windows busy cores 0.78 to 3.81, median 1.73.
Processes rejected by the busy gate: 1 (m-smithy node round 2, 51% busy). Swap change around any process: 0 kB at most.
