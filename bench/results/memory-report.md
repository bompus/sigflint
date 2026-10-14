Rows 2000, accepted 1750, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.4 KiB | 29.3 KiB (12.11x; more) | 9.8 KiB (4.03x; more) | 17.8 KiB (7.37x; more) | 69.4 KiB (28.63x; more) | 58.0 KiB (23.95x; more) | 8.3 KiB (3.41x; more) | 2.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 3.8 KiB | 32.1 KiB (8.54x; more) | 12.6 KiB (3.34x; more) | 19.9 KiB (5.31x; more) | - | 59.8 KiB (15.92x; more) | 8.8 KiB (2.35x; more) | 3.8 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.4 KiB | 32.9 KiB (6.14x; more) | 13.5 KiB (2.51x; more) | - | - | 63.2 KiB (11.79x; more) | - | 5.4 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 3.9 KiB | 29.7 KiB (7.67x; more) | 9.5 KiB (2.46x; more) | 18.4 KiB (4.74x; more) | - | - | 8.5 KiB (2.19x; more) | 3.9 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 15.1 KiB (11.12x; more) | 6.4 KiB (4.73x; more) | 13.2 KiB (9.69x; more) | 47.8 KiB (35.16x; more) | 29.9 KiB (22.01x; more) | 7.0 KiB (5.18x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.9 KiB (5.96x; more) | 7.9 KiB (2.95x; more) | 14.0 KiB (5.26x; more) | - | 28.5 KiB (10.68x; more) | 7.0 KiB (2.64x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.2 KiB | 17.0 KiB (4.06x; more) | 8.5 KiB (2.02x; more) | - | - | 32.6 KiB (7.76x; more) | - | 4.2 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.5 KiB | 16.9 KiB (6.69x; more) | 7.7 KiB (3.02x; more) | 15.1 KiB (5.98x; more) | - | - | 8.5 KiB (3.36x; more) | 2.5 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 24.0 KiB | 186.4 KiB (7.75x; more) | 48.1 KiB (2.00x; ncc) | 50.3 KiB (2.09x; ncc) | 64.0 KiB (2.66x; ncc) | 107.8 KiB (4.49x; more) | 47.6 KiB (1.98x; ncc) | 24.0 KiB (1.00x; ncc) |
| bench-part-put (band 82.6%) | 27.0 KiB | -912 B (ncc) | -17.5 KiB (ncc) | 18.1 KiB (0.67x; ncc) | - | 1.3 KiB (0.05x; ncc) | 1.0 KiB (0.04x; ncc) | 27.0 KiB (1.00x; ncc) |
| bench-encode (band 219.4%) | 13.9 KiB | -1.0 KiB (ncc) | -44.5 KiB (ncc) | - | - | 16.4 KiB (1.18x; ncc) | - | 13.9 KiB (1.00x; ncc) |
| bench-body-1k (band 93.3%) | 21.5 KiB | 62.1 KiB (2.88x; ncc) | 11.6 KiB (0.54x; ncc) | -9.3 KiB (ncc) | - | - | -9.5 KiB (ncc) | 21.6 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 280.4%) | 662 B | 3.7 KiB (5.68x; ncc) | -3.2 KiB (ncc) | 3.3 KiB (5.15x; ncc) | -556 B (ncc) | 372 B (0.56x; ncc) | 21.2 KiB (32.76x; ncc) | 662 B (1.00x; ncc) |
| bench-part-put (band 260.2%) | 1.8 KiB | 5.6 KiB (3.05x; ncc) | 25.6 KiB (13.96x; ncc) | 5.5 KiB (2.97x; ncc) | - | -991 B (ncc) | 5.0 KiB (2.71x; ncc) | 1.8 KiB (1.00x; ncc) |
| bench-encode (band 1353.3%) | -435 B | -218.3 KiB (ncc) | 8.9 KiB (ncc) | - | - | 585 B (ncc) | - | -403 B (ncc) |
| bench-body-1k (band 148.3%) | 1.9 KiB | -1.7 KiB (ncc) | 6.6 KiB (3.43x; ncc) | 2.9 KiB (1.49x; ncc) | - | - | -1.1 KiB (ncc) | 1.9 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 46.00 (7.67x; more) | 174 (29.00x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 9.00 | 51.00 (5.67x; more) | 31.00 (3.44x; more) | 49.00 (5.44x; more) | - | 91.00 (10.11x; more) | 22.00 (2.44x; more) | 9.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 13.00 | 48.00 (3.69x; more) | 33.00 (2.54x; more) | - | - | 95.00 (7.31x; more) | - | 13.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 28.00 (9.33x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 50.00 (16.67x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 4.00 | 27.00 (6.75x; more) | 14.00 (3.50x; more) | 23.00 (5.75x; more) | - | 45.00 (11.25x; more) | 15.00 (3.75x; more) | 4.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 31.00 (4.43x; more) | 17.00 (2.43x; more) | - | - | 52.00 (7.43x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 4.00 | 30.00 (7.50x; more) | 15.00 (3.75x; more) | 26.00 (6.50x; more) | - | - | 18.00 (4.50x; more) | 4.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 52.4%) | 1.22 ms | 45.57 ms (37.46x; more) | 7.57 ms (6.23x; more) | 21.45 ms (17.63x; more) | 42.73 ms (35.13x; more) | 106 ms (87.39x; more) | 24.09 ms (19.80x; more) | 1.13 ms (0.93x; ncc) |
| bench-part-put (band 55.6%) | 1.46 ms | 26.78 ms (18.29x; more) | 7.18 ms (4.90x; more) | 18.34 ms (12.53x; more) | - | 88.89 ms (60.71x; more) | 18.58 ms (12.69x; more) | 1.48 ms (1.01x; ncc) |
| bench-encode (band 86.2%) | 1.70 ms | 37.46 ms (21.99x; more) | 9.07 ms (5.32x; more) | - | - | 97.90 ms (57.46x; more) | - | 1.59 ms (0.93x; ncc) |
| bench-body-1k (band 61.6%) | 1.67 ms | 35.66 ms (21.30x; more) | 6.22 ms (3.72x; more) | 23.34 ms (13.94x; more) | - | - | 23.85 ms (14.25x; more) | 1.63 ms (0.98x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 81.3%) | 6.01 ms | 65.81 ms (10.96x; more) | 27.92 ms (4.65x; more) | 50.12 ms (8.35x; more) | 153 ms (25.43x; more) | 144 ms (23.97x; more) | 35.12 ms (5.85x; more) | 5.94 ms (0.99x; ncc) |
| bench-part-put (band 68.5%) | 6.79 ms | 63.50 ms (9.35x; more) | 27.54 ms (4.06x; more) | 45.75 ms (6.74x; more) | - | 111 ms (16.33x; more) | 34.59 ms (5.09x; more) | 7.73 ms (1.14x; ncc) |
| bench-encode (band 51.6%) | 14.66 ms | 71.21 ms (4.86x; more) | 34.07 ms (2.32x; more) | - | - | 132 ms (8.99x; more) | - | 14.35 ms (0.98x; ncc) |
| bench-body-1k (band 50.3%) | 7.59 ms | 65.54 ms (8.63x; more) | 29.33 ms (3.86x; more) | 54.34 ms (7.16x; more) | - | - | 40.54 ms (5.34x; more) | 7.56 ms (1.00x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 31.8%) | 2.49 µs | 260 µs (104.22x; more) | 10.92 µs (4.38x; more) | 17.96 µs (7.21x; more) | 80.66 µs (32.38x; more) | 661 µs (265.30x; more) | 17.62 µs (7.07x; more) | 2.44 µs (0.98x; ncc) |
| bench-part-put (band 37.2%) | 2.59 µs | 247 µs (95.20x; more) | 11.30 µs (4.36x; more) | 16.20 µs (6.26x; more) | - | 578 µs (223.12x; more) | 15.05 µs (5.81x; more) | 2.58 µs (1.00x; ncc) |
| bench-encode (band 34.1%) | 3.68 µs | 250 µs (67.87x; more) | 13.19 µs (3.59x; more) | - | - | 688 µs (187.00x; more) | - | 3.68 µs (1.00x; ncc) |
| bench-body-1k (band 25.7%) | 3.62 µs | 252 µs (69.46x; more) | 10.16 µs (2.80x; more) | 17.49 µs (4.83x; more) | - | - | 17.49 µs (4.83x; more) | 3.79 µs (1.05x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 48.7%) | 3.83 µs | 234 µs (61.26x; more) | 18.37 µs (4.80x; more) | 27.56 µs (7.20x; more) | 77.22 µs (20.18x; more) | 576 µs (150.48x; more) | 16.55 µs (4.33x; more) | 3.73 µs (0.98x; ncc) |
| bench-part-put (band 47.2%) | 3.24 µs | 233 µs (71.87x; more) | 15.15 µs (4.67x; more) | 19.09 µs (5.89x; more) | - | 552 µs (170.34x; more) | 13.05 µs (4.03x; more) | 3.35 µs (1.03x; ncc) |
| bench-encode (band 73.0%) | 5.24 µs | 240 µs (45.79x; more) | 18.11 µs (3.45x; more) | - | - | 596 µs (113.70x; more) | - | 5.63 µs (1.07x; ncc) |
| bench-body-1k (band 30.5%) | 4.24 µs | 216 µs (51.04x; more) | 11.99 µs (2.83x; more) | 19.10 µs (4.51x; more) | - | - | 15.03 µs (3.54x; more) | 4.34 µs (1.02x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 5.6%) | 112.0 MiB | 124.5 MiB (1.11x; more) | 113.5 MiB (1.01x; ncc) | 112.2 MiB (1.00x; ncc) | 165.6 MiB (1.48x; more) | 125.2 MiB (1.12x; more) | 114.4 MiB (1.02x; ncc) | 111.7 MiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 5.1%) | 62.3 MiB | 69.6 MiB (1.12x; more) | 70.7 MiB (1.13x; more) | 73.7 MiB (1.18x; more) | 79.9 MiB (1.28x; more) | 75.2 MiB (1.21x; more) | 71.3 MiB (1.14x; more) | 62.4 MiB (1.00x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 32.1%) | 2.24 ms | 1.58 ms (0.71x; ncc) | 1.76 ms (0.79x; ncc) | 11.49 ms (5.13x; more) | 2.92 ms (1.30x; ncc) | 1.97 ms (0.88x; ncc) | 16.46 ms (7.35x; more) | 2.27 ms (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 41.4%) | 1.58 ms | 1.27 ms (0.80x; ncc) | 2.33 ms (1.48x; ncc) | 10.48 ms (6.65x; more) | 2.70 ms (1.71x; more) | 1.77 ms (1.12x; ncc) | 21.47 ms (13.62x; more) | 1.55 ms (0.98x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 94.7%) | 2.76 ms | 18.26 ms (6.61x; more) | 3.73 ms (1.35x; ncc) | 13.49 ms (4.89x; more) | 8.78 ms (3.18x; more) | 18.78 ms (6.80x; more) | 17.55 ms (6.36x; more) | 2.93 ms (1.06x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 39.8%) | 2.24 ms | 3.12 ms (1.39x; ncc) | 3.29 ms (1.47x; more) | 11.96 ms (5.33x; more) | 4.73 ms (2.11x; more) | 5.12 ms (2.28x; more) | 22.02 ms (9.82x; more) | 2.16 ms (0.96x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 8.1%) | 338 B | - | - | - | - | - | - | 338 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 357 B | - | - | - | - | - | - | 354 B (0.99x; ncc) |
