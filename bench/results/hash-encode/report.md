# Hash and encode measurements

Rounds counted: 3 (1, 2, 3). Runtimes: node: node 26.13.0; bun: bun 1.4.4.
Every input and output digest agrees across the rows and runtimes of a case: yes (the analysis stops otherwise).
Round value = mean of the A and B passes of an arm in one process. Band = max(3%, 2 x the largest relative A/A spread of either arm in any round); a difference is clear only when the medians differ by more than the band (and 2 ns), the ranges over the rounds are disjoint and the sign is the same in every round. Cells are median (min-max over rounds) in ns per call.

## 1. Which SHA-256 is faster on Bun

Bun build: `Bun.SHA256.hash(data, "hex")`. Node build: `crypto.hash("sha256", data, "hex")`, which Bun also provides.

| Input | Bun: crypto.hash | Bun: Bun.SHA256.hash | Benefit of Bun.SHA256.hash | Result | Node: crypto.hash (reference) |
|---|--:|--:|--:|---|--:|
| string-to-sign | 134.1 (132.0-136.5) | 99.4 (98.9-100.6) | 25.9% less time (1.35x) | Bun.SHA256.hash faster, clear (band 9.0%) | 167.6 (166.5-167.9) |
| canonical-request | 156.7 (154.3-158.5) | 129.3 (125.4-129.8) | 17.5% less time (1.21x) | Bun.SHA256.hash faster, clear (band 7.2%) | 198.7 (192.0-200.8) |
| body-1k-string | 303.3 (302.9-309.0) | 277.3 (275.1-280.5) | 8.6% less time (1.09x) | Bun.SHA256.hash faster, clear (band 3.0%) | 360.4 (353.9-364.3) |
| body-1k-bytes | 298.8 (296.7-303.2) | 271.8 (267.7-272.3) | 9.1% less time (1.10x) | Bun.SHA256.hash faster, clear (band 3.0%) | 331.0 (328.8-333.2) |
| body-64k-bytes | 12995.4 (12851.3-12998.2) | 12981.4 (12803.6-13026.1) | no clear change | no clear change (band 3.0%) | 13047.6 (12882.1-13060.9) |

Across runtimes (reference): Node `crypto.hash` against each Bun call.

| Input | Node vs Bun crypto.hash | Node vs Bun.SHA256.hash |
|---|---|---|
| string-to-sign | Bun faster, clear (-20.0%) | Bun faster, clear (-40.7%) |
| canonical-request | Bun faster, clear (-21.1%) | Bun faster, clear (-34.9%) |
| body-1k-string | Bun faster, clear (-15.8%) | Bun faster, clear (-23.1%) |
| body-1k-bytes | Bun faster, clear (-9.7%) | Bun faster, clear (-17.9%) |
| body-64k-bytes | no clear change (-0.4%) | no clear change (-0.5%) |

## 2. encodeURIComponent in the presigner

`encodeQueryPart` is the exported function the presigner calls: `encodeURIComponent` plus a replace of `!'()*`. The second column is `encodeURIComponent` alone on the same string.

| String | Runtime | encodeURIComponent | encodeQueryPart | Replace step |
|---|---|--:|--:|--:|
| credential-execute-api | node | 64.5 (62.7-65.4) | 102.1 (100.5-102.7) | 37.6 |
| credential-execute-api | bun | 102.6 (102.5-102.9) | 118.1 (117.6-118.2) | 15.5 |
| credential-s3 | node | 54.7 (54.3-62.3) | 93.3 (90.2-98.1) | 38.5 |
| credential-s3 | bun | 92.9 (91.8-97.5) | 109.1 (107.2-111.4) | 16.2 |
| signed-headers | node | 15.4 (15.2-15.7) | 40.4 (40.1-40.6) | 25.0 |
| signed-headers | bun | 37.3 (37.3-37.3) | 52.1 (51.9-53.1) | 14.8 |
| token-12 | node | 30.4 (30.2-30.6) | 57.4 (55.6-58.4) | 27.0 |
| token-12 | bun | 50.8 (50.6-51.1) | 65.2 (64.9-65.5) | 14.3 |
| token-400 | node | 246.1 (243.0-254.1) | 281.9 (277.6-297.5) | 35.9 |
| token-400 | bun | 406.0 (396.2-421.2) | 417.2 (410.6-442.0) | 11.2 |

Node against Bun on the same call:

| String | encodeURIComponent | encodeQueryPart |
|---|---|---|
| credential-execute-api | Node faster, clear (+59.2%) | Node faster, clear (+15.7%) |
| credential-s3 | Node faster, clear (+69.8%) | Node faster, clear (+17.0%) |
| signed-headers | Node faster, clear (+141.9%) | Node faster, clear (+29.0%) |
| token-12 | Node faster, clear (+67.2%) | Node faster, clear (+13.5%) |
| token-400 | Node faster, clear (+65.0%) | Node faster, clear (+48.0%) |

## 3. Share of the presign call spent encoding

Share = the isolated time of the encoder calls one presign makes (credential, signed headers, and the token when the request has one), divided by the presign time measured in the same process and round. It is an estimate from separate timings, not a measurement inside the presigner.

| Workload | Runtime | presign | encodeQueryPart calls | Share, encodeQueryPart | Share, encodeURIComponent alone |
|---|---|--:|--:|--:|--:|
| any | node | 2646 (2621-2657) | 142.2 (141.1-143.1) | 5.4 (5.3-5.5)% | 3.0 (3.0-3.1)% |
| any | bun | 2717 (2684-2734) | 170.3 (170.1-170.7) | 6.3 (6.2-6.4)% | 5.1 (5.1-5.2)% |
| s3 | node | 2848 (2812-2862) | 133.9 (130.3-138.5) | 4.7 (4.6-4.9)% | 2.5 (2.5-2.7)% |
| s3 | bun | 2948 (2925-2966) | 161.0 (160.3-163.5) | 5.5 (5.4-5.6)% | 4.4 (4.4-4.6)% |
| s3-token | node | 3129 (3127-3229) | 192.2 (185.9-195.9) | 6.1 (5.8-6.3)% | 3.2 (3.2-3.3)% |
| s3-token | bun | 3180 (3159-3304) | 226.5 (225.2-228.7) | 7.1 (6.8-7.2)% | 5.7 (5.5-5.9)% |

Node against Bun on the presign call, and what the encoders contribute to the difference:

| Workload | Presign, Node | Presign, Bun | Result | Encoder time, Bun minus Node |
|---|--:|--:|---|--:|
| any | 2646 (2621-2657) | 2717 (2684-2734) | no clear change (+2.7%, band 11.3%) | 28.1 ns (no Bun slowdown to attribute) |
| s3 | 2848 (2812-2862) | 2948 (2925-2966) | no clear change (+3.5%, band 9.5%) | 27.2 ns (no Bun slowdown to attribute) |
| s3-token | 3129 (3127-3229) | 3180 (3159-3304) | no clear change (+1.6%, band 6.9%) | 34.3 ns (no Bun slowdown to attribute) |

Unsettled comparisons: none.
