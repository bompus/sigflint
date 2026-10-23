Rows 2000, accepted 1750, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.6 KiB | 29.3 KiB (11.44x; more) | 9.8 KiB (3.81x; more) | 17.8 KiB (6.96x; more) | 69.4 KiB (27.06x; more) | 58.0 KiB (22.63x; more) | 8.3 KiB (3.23x; more) | 2.6 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 4.0 KiB | 32.1 KiB (8.12x; more) | 12.6 KiB (3.18x; more) | 19.9 KiB (5.04x; more) | - | 59.8 KiB (15.14x; more) | 8.8 KiB (2.24x; more) | 4.0 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.5 KiB | 32.9 KiB (5.98x; more) | 13.5 KiB (2.45x; more) | - | - | 63.2 KiB (11.49x; more) | - | 5.5 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 4.0 KiB | 29.7 KiB (7.37x; more) | 9.5 KiB (2.36x; more) | 18.4 KiB (4.56x; more) | - | - | 8.5 KiB (2.10x; more) | 4.0 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 15.1 KiB (10.86x; more) | 6.4 KiB (4.62x; more) | 13.2 KiB (9.46x; more) | 47.8 KiB (34.34x; more) | 29.4 KiB (21.12x; more) | 7.0 KiB (5.06x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.9 KiB (5.90x; more) | 7.9 KiB (2.92x; more) | 14.0 KiB (5.20x; more) | - | 29.0 KiB (10.78x; more) | 7.0 KiB (2.61x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 17.1 KiB (4.00x; more) | 8.5 KiB (1.99x; more) | - | - | 32.4 KiB (7.61x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.9 KiB (6.57x; more) | 7.7 KiB (2.97x; more) | 15.2 KiB (5.88x; more) | - | - | 8.5 KiB (3.31x; more) | 2.6 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 29.3 KiB | 186.4 KiB (6.36x; more) | 48.1 KiB (1.64x; ncc) | 50.4 KiB (1.72x; ncc) | 62.7 KiB (2.14x; ncc) | 107.9 KiB (3.68x; ncc) | 47.6 KiB (1.63x; ncc) | 29.3 KiB (1.00x; ncc) |
| bench-part-put (band 71.4%) | 37.0 KiB | -904 B (ncc) | -19.3 KiB (ncc) | 17.1 KiB (0.46x; ncc) | - | 1.3 KiB (0.03x; ncc) | 736 B (0.02x; ncc) | 37.0 KiB (1.00x; ncc) |
| bench-encode (band 253.3%) | -840 B | -1.0 KiB (ncc) | -44.5 KiB (ncc) | - | - | 16.4 KiB (ncc) | - | -664 B (ncc) |
| bench-body-1k (band 126.4%) | 17.5 KiB | 62.1 KiB (3.54x; ncc) | 11.8 KiB (0.67x; ncc) | -9.3 KiB (ncc) | - | - | -9.4 KiB (ncc) | 17.5 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 211.1%) | 849 B | 3.0 KiB (3.64x; ncc) | -3.2 KiB (ncc) | 4.9 KiB (5.89x; ncc) | -556 B (ncc) | 708 B (0.83x; ncc) | 21.2 KiB (25.55x; ncc) | 849 B (1.00x; ncc) |
| bench-part-put (band 278.3%) | 2.2 KiB | 4.4 KiB (1.99x; ncc) | 25.6 KiB (11.68x; ncc) | 5.2 KiB (2.35x; ncc) | - | -5.0 KiB (ncc) | 5.0 KiB (2.26x; ncc) | 2.2 KiB (1.01x; ncc) |
| bench-encode (band 109.4%) | 2.6 KiB | -1.3 KiB (ncc) | 8.9 KiB (3.41x; ncc) | - | - | 11.7 KiB (4.49x; ncc) | - | 2.6 KiB (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.0 KiB | -5.5 KiB (ncc) | 6.6 KiB (1.32x; ncc) | 2.8 KiB (0.56x; ncc) | - | - | -1.1 KiB (ncc) | 5.0 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 46.00 (7.67x; more) | 174 (29.00x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 50.00 (5.00x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 91.00 (9.10x; more) | 22.00 (2.20x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 13.00 | 48.00 (3.69x; more) | 33.00 (2.54x; more) | - | - | 94.00 (7.23x; more) | - | 13.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 28.00 (9.33x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 50.00 (16.67x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 27.00 (5.40x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 45.00 (9.00x; more) | 15.00 (3.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 30.00 (4.29x; more) | 17.00 (2.43x; more) | - | - | 54.00 (7.71x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 30.00 (6.00x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | - | - | 18.00 (3.60x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 41.8%) | 1.14 ms | 43.68 ms (38.21x; more) | 6.41 ms (5.61x; more) | 21.19 ms (18.54x; more) | 41.83 ms (36.60x; more) | 95.53 ms (83.58x; more) | 22.35 ms (19.56x; more) | 1.14 ms (1.00x; ncc) |
| bench-part-put (band 22.7%) | 1.47 ms | 24.46 ms (16.60x; more) | 6.41 ms (4.35x; more) | 18.21 ms (12.36x; more) | - | 76.70 ms (52.05x; more) | 17.35 ms (11.78x; more) | 1.48 ms (1.01x; ncc) |
| bench-encode (band 54.5%) | 1.71 ms | 34.13 ms (19.91x; more) | 7.91 ms (4.62x; more) | - | - | 78.06 ms (45.55x; more) | - | 1.56 ms (0.91x; ncc) |
| bench-body-1k (band 42.7%) | 1.59 ms | 33.81 ms (21.30x; more) | 5.58 ms (3.52x; more) | 23.52 ms (14.82x; more) | - | - | 22.56 ms (14.21x; more) | 1.54 ms (0.97x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 38.3%) | 5.84 ms | 57.35 ms (9.82x; more) | 26.16 ms (4.48x; more) | 49.51 ms (8.48x; more) | 165 ms (28.34x; more) | 124 ms (21.28x; more) | 31.15 ms (5.34x; more) | 6.09 ms (1.04x; ncc) |
| bench-part-put (band 61.0%) | 9.42 ms | 56.74 ms (6.02x; more) | 26.12 ms (2.77x; more) | 46.60 ms (4.95x; more) | - | 114 ms (12.05x; more) | 30.20 ms (3.21x; more) | 10.45 ms (1.11x; ncc) |
| bench-encode (band 66.9%) | 11.36 ms | 68.72 ms (6.05x; more) | 32.81 ms (2.89x; more) | - | - | 131 ms (11.49x; more) | - | 12.01 ms (1.06x; ncc) |
| bench-body-1k (band 69.4%) | 9.78 ms | 62.60 ms (6.40x; more) | 28.46 ms (2.91x; more) | 53.69 ms (5.49x; more) | - | - | 35.88 ms (3.67x; more) | 9.57 ms (0.98x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 20.2%) | 2.49 µs | 254 µs (101.93x; more) | 10.28 µs (4.13x; more) | 17.78 µs (7.14x; more) | 79.34 µs (31.86x; more) | 643 µs (258.17x; more) | 17.01 µs (6.83x; more) | 2.49 µs (1.00x; ncc) |
| bench-part-put (band 10.6%) | 2.64 µs | 237 µs (89.81x; more) | 11.10 µs (4.21x; more) | 16.30 µs (6.18x; more) | - | 564 µs (214.12x; more) | 14.49 µs (5.50x; more) | 2.62 µs (0.99x; ncc) |
| bench-encode (band 16.5%) | 3.45 µs | 237 µs (68.75x; more) | 12.56 µs (3.64x; more) | - | - | 627 µs (181.54x; more) | - | 3.37 µs (0.98x; ncc) |
| bench-body-1k (band 14.0%) | 3.39 µs | 238 µs (70.14x; more) | 9.91 µs (2.92x; more) | 16.92 µs (4.99x; more) | - | - | 16.63 µs (4.90x; more) | 3.33 µs (0.98x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 28.3%) | 3.93 µs | 208 µs (53.10x; more) | 17.61 µs (4.49x; more) | 25.44 µs (6.48x; more) | 80.09 µs (20.40x; more) | 555 µs (141.47x; more) | 15.53 µs (3.95x; more) | 3.71 µs (0.94x; ncc) |
| bench-part-put (band 58.0%) | 3.67 µs | 210 µs (57.34x; more) | 14.54 µs (3.96x; more) | 19.47 µs (5.31x; more) | - | 539 µs (146.93x; more) | 12.23 µs (3.33x; more) | 3.81 µs (1.04x; ncc) |
| bench-encode (band 41.5%) | 4.76 µs | 213 µs (44.79x; more) | 15.99 µs (3.36x; more) | - | - | 560 µs (117.71x; more) | - | 4.96 µs (1.04x; ncc) |
| bench-body-1k (band 43.4%) | 4.65 µs | 206 µs (44.35x; more) | 11.05 µs (2.38x; more) | 18.38 µs (3.95x; more) | - | - | 13.76 µs (2.96x; more) | 4.56 µs (0.98x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 4.3%) | 114.1 MiB | 126.3 MiB (1.11x; more) | 115.5 MiB (1.01x; ncc) | 113.6 MiB (1.00x; ncc) | 170.0 MiB (1.49x; more) | 125.0 MiB (1.10x; more) | 116.2 MiB (1.02x; ncc) | 114.6 MiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 60.9 MiB | 65.5 MiB (1.08x; more) | 68.1 MiB (1.12x; more) | 68.6 MiB (1.13x; more) | 74.7 MiB (1.23x; more) | 70.4 MiB (1.16x; more) | 66.9 MiB (1.10x; more) | 60.5 MiB (0.99x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 19.4%) | 1.25 ms | 1.57 ms (1.26x; ncc) | 1.67 ms (1.34x; ncc) | 11.44 ms (9.18x; more) | 2.99 ms (2.40x; ncc) | 1.88 ms (1.51x; ncc) | 15.29 ms (12.27x; more) | 1.18 ms (0.95x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 16.5%) | 1.46 ms | 1.20 ms (0.82x; ncc) | 2.29 ms (1.57x; ncc) | 9.66 ms (6.62x; more) | 2.45 ms (1.68x; ncc) | 1.74 ms (1.19x; ncc) | 19.72 ms (13.51x; more) | 1.46 ms (1.00x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 15.7%) | 2.54 ms | 18.05 ms (7.09x; more) | 3.64 ms (1.43x; ncc) | 12.90 ms (5.07x; more) | 8.58 ms (3.37x; more) | 17.41 ms (6.84x; more) | 16.36 ms (6.43x; more) | 2.47 ms (0.97x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 14.0%) | 2.01 ms | 3.12 ms (1.55x; ncc) | 3.16 ms (1.57x; ncc) | 11.03 ms (5.48x; more) | 4.30 ms (2.14x; more) | 4.58 ms (2.28x; more) | 20.23 ms (10.06x; more) | 2.02 ms (1.00x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 8.1%) | 341 B | - | - | - | - | - | - | 341 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 357 B | - | - | - | - | - | - | 359 B (1.01x; ncc) |
