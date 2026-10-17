Rows 2000, accepted 1750, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.6 KiB | 29.3 KiB (11.44x; more) | 9.8 KiB (3.81x; more) | 17.9 KiB (6.96x; more) | 69.4 KiB (27.07x; more) | 58.0 KiB (22.63x; more) | 8.3 KiB (3.23x; more) | 2.6 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 4.0 KiB | 32.1 KiB (8.12x; more) | 12.5 KiB (3.17x; more) | 19.9 KiB (5.04x; more) | - | 59.8 KiB (15.14x; more) | 8.8 KiB (2.24x; more) | 4.0 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.5 KiB | 32.9 KiB (5.99x; more) | 13.5 KiB (2.45x; more) | - | - | 63.2 KiB (11.49x; more) | - | 5.5 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 4.0 KiB | 29.7 KiB (7.37x; more) | 9.5 KiB (2.36x; more) | 18.4 KiB (4.56x; more) | - | - | 8.5 KiB (2.10x; more) | 4.0 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 15.1 KiB (10.86x; more) | 6.4 KiB (4.62x; more) | 13.2 KiB (9.46x; more) | 47.8 KiB (34.30x; more) | 29.9 KiB (21.47x; more) | 7.0 KiB (5.06x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.9 KiB (5.89x; more) | 7.9 KiB (2.92x; more) | 14.0 KiB (5.20x; more) | - | 29.0 KiB (10.78x; more) | 7.0 KiB (2.61x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 17.0 KiB (3.98x; more) | 8.5 KiB (1.99x; more) | - | - | 31.5 KiB (7.38x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.5 KiB (6.39x; more) | 7.7 KiB (2.97x; more) | 15.2 KiB (5.89x; more) | - | - | 8.5 KiB (3.31x; more) | 2.6 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 29.4 KiB | 186.3 KiB (6.33x; more) | 48.0 KiB (1.63x; ncc) | 50.4 KiB (1.71x; ncc) | 64.0 KiB (2.17x; ncc) | 108.0 KiB (3.67x; ncc) | 47.6 KiB (1.62x; ncc) | 29.4 KiB (1.00x; ncc) |
| bench-part-put (band 110.7%) | 24.2 KiB | -912 B (ncc) | -18.6 KiB (ncc) | 17.1 KiB (0.71x; ncc) | - | 1.3 KiB (0.05x; ncc) | 944 B (0.04x; ncc) | 24.1 KiB (1.00x; ncc) |
| bench-encode (band 3979.0%) | -664 B | -1.0 KiB (ncc) | -45.5 KiB (ncc) | - | - | 16.4 KiB (ncc) | - | -840 B (ncc) |
| bench-body-1k (band 60.6%) | 17.5 KiB | 62.0 KiB (3.53x; ncc) | 8.9 KiB (0.51x; ncc) | -9.3 KiB (ncc) | - | - | -9.4 KiB (ncc) | 17.5 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 9.2%) | 849 B | 3.7 KiB (4.43x; ncc) | -3.2 KiB (ncc) | 9.0 KiB (10.91x; ncc) | -556 B (ncc) | 708 B (0.83x; ncc) | 20.1 KiB (24.30x; ncc) | 849 B (1.00x; ncc) |
| bench-part-put (band 150.0%) | 2.2 KiB | 4.1 KiB (1.86x; ncc) | 25.6 KiB (11.52x; ncc) | 6.1 KiB (2.74x; ncc) | - | -4.8 KiB (ncc) | 5.0 KiB (2.23x; ncc) | 1.9 KiB (0.85x; ncc) |
| bench-encode (band 5.3%) | 2.6 KiB | -1.3 KiB (ncc) | 8.9 KiB (3.37x; ncc) | - | - | 585 B (0.22x; ncc) | - | 2.6 KiB (0.99x; ncc) |
| bench-body-1k (band 13.2%) | 5.0 KiB | -5.3 KiB (ncc) | 6.6 KiB (1.32x; ncc) | -19 B (ncc) | - | - | -1.1 KiB (ncc) | 5.0 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 46.00 (7.67x; more) | 175 (29.17x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 51.00 (5.10x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 91.00 (9.10x; more) | 22.00 (2.20x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 15.4%) | 13.00 | 48.00 (3.69x; more) | 33.00 (2.54x; more) | - | - | 94.00 (7.23x; more) | - | 13.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 28.00 (9.33x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 49.00 (16.33x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 27.00 (5.40x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 45.00 (9.00x; more) | 15.00 (3.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 31.00 (4.43x; more) | 17.00 (2.43x; more) | - | - | 53.00 (7.57x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 30.00 (6.00x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | - | - | 18.00 (3.60x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 34.9%) | 1.14 ms | 32.76 ms (28.86x; more) | 6.30 ms (5.55x; more) | 20.23 ms (17.83x; more) | 35.99 ms (31.71x; more) | 82.78 ms (72.93x; more) | 22.18 ms (19.54x; more) | 1.21 ms (1.07x; ncc) |
| bench-part-put (band 33.3%) | 1.47 ms | 21.40 ms (14.55x; more) | 6.20 ms (4.22x; more) | 16.02 ms (10.89x; more) | - | 66.85 ms (45.47x; more) | 16.70 ms (11.36x; more) | 1.48 ms (1.01x; ncc) |
| bench-encode (band 37.0%) | 1.55 ms | 26.42 ms (17.00x; more) | 7.28 ms (4.69x; more) | - | - | 73.34 ms (47.19x; more) | - | 1.52 ms (0.98x; ncc) |
| bench-body-1k (band 41.0%) | 1.42 ms | 27.39 ms (19.24x; more) | 5.59 ms (3.93x; more) | 20.45 ms (14.36x; more) | - | - | 20.95 ms (14.71x; more) | 1.40 ms (0.98x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 58.8%) | 5.16 ms | 57.29 ms (11.09x; more) | 26.53 ms (5.14x; more) | 48.18 ms (9.33x; more) | 157 ms (30.48x; more) | 109 ms (21.13x; more) | 31.32 ms (6.07x; more) | 6.04 ms (1.17x; ncc) |
| bench-part-put (band 86.7%) | 9.42 ms | 54.09 ms (5.74x; more) | 25.42 ms (2.70x; ncc) | 44.12 ms (4.68x; more) | - | 106 ms (11.21x; more) | 27.73 ms (2.94x; more) | 8.89 ms (0.94x; ncc) |
| bench-encode (band 44.8%) | 12.41 ms | 64.43 ms (5.19x; more) | 31.96 ms (2.58x; more) | - | - | 125 ms (10.06x; more) | - | 12.93 ms (1.04x; ncc) |
| bench-body-1k (band 52.7%) | 8.22 ms | 62.58 ms (7.61x; more) | 27.91 ms (3.39x; more) | 50.41 ms (6.13x; more) | - | - | 34.67 ms (4.22x; more) | 8.91 ms (1.08x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 29.9%) | 2.68 µs | 244 µs (90.99x; more) | 10.28 µs (3.84x; more) | 16.81 µs (6.27x; more) | 75.50 µs (28.19x; more) | 641 µs (239.50x; more) | 16.58 µs (6.19x; more) | 2.66 µs (0.99x; ncc) |
| bench-part-put (band 23.5%) | 2.72 µs | 227 µs (83.47x; more) | 10.78 µs (3.96x; more) | 14.50 µs (5.33x; more) | - | 576 µs (211.41x; more) | 14.19 µs (5.21x; more) | 2.62 µs (0.96x; ncc) |
| bench-encode (band 16.8%) | 3.42 µs | 227 µs (66.23x; more) | 12.00 µs (3.50x; more) | - | - | 646 µs (188.58x; more) | - | 3.41 µs (1.00x; ncc) |
| bench-body-1k (band 19.6%) | 3.34 µs | 237 µs (71.05x; more) | 9.76 µs (2.93x; more) | 15.87 µs (4.76x; more) | - | - | 16.25 µs (4.87x; more) | 3.22 µs (0.96x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 29.5%) | 3.42 µs | 213 µs (62.15x; more) | 16.36 µs (4.78x; more) | 23.52 µs (6.87x; more) | 71.51 µs (20.89x; more) | 547 µs (159.70x; more) | 15.19 µs (4.44x; more) | 3.49 µs (1.02x; ncc) |
| bench-part-put (band 39.7%) | 3.56 µs | 212 µs (59.51x; more) | 13.58 µs (3.82x; more) | 16.06 µs (4.52x; more) | - | 556 µs (156.27x; more) | 11.45 µs (3.22x; more) | 3.48 µs (0.98x; ncc) |
| bench-encode (band 34.7%) | 4.54 µs | 217 µs (47.73x; more) | 14.90 µs (3.28x; more) | - | - | 558 µs (122.86x; more) | - | 5.04 µs (1.11x; ncc) |
| bench-body-1k (band 31.3%) | 4.28 µs | 209 µs (48.85x; more) | 10.30 µs (2.41x; more) | 17.75 µs (4.15x; more) | - | - | 13.26 µs (3.10x; more) | 4.18 µs (0.98x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 117.0 MiB | 128.6 MiB (1.10x; more) | 117.2 MiB (1.00x; ncc) | 115.9 MiB (0.99x; ncc) | 170.0 MiB (1.45x; more) | 125.6 MiB (1.07x; more) | 117.9 MiB (1.01x; ncc) | 117.1 MiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 4.2%) | 64.9 MiB | 69.2 MiB (1.07x; ncc) | 72.1 MiB (1.11x; more) | 72.5 MiB (1.12x; more) | 79.9 MiB (1.23x; more) | 75.2 MiB (1.16x; more) | 70.6 MiB (1.09x; more) | 65.1 MiB (1.00x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 49.6%) | 1.15 ms | 1.38 ms (1.20x; ncc) | 1.58 ms (1.37x; ncc) | 10.90 ms (9.46x; more) | 2.57 ms (2.23x; ncc) | 1.79 ms (1.55x; ncc) | 15.56 ms (13.52x; more) | 1.07 ms (0.93x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 15.8%) | 1.92 ms | 1.12 ms (0.58x; ncc) | 2.19 ms (1.14x; ncc) | 9.45 ms (4.91x; more) | 2.42 ms (1.26x; ncc) | 1.57 ms (0.82x; ncc) | 18.99 ms (9.87x; more) | 1.87 ms (0.97x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 34.8%) | 2.43 ms | 17.26 ms (7.12x; more) | 3.26 ms (1.34x; ncc) | 12.47 ms (5.14x; more) | 7.97 ms (3.29x; more) | 17.83 ms (7.35x; more) | 16.63 ms (6.86x; more) | 2.29 ms (0.94x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 14.9%) | 2.45 ms | 2.92 ms (1.19x; ncc) | 3.09 ms (1.26x; ncc) | 10.78 ms (4.40x; more) | 4.40 ms (1.79x; ncc) | 4.53 ms (1.85x; more) | 19.47 ms (7.94x; more) | 2.41 ms (0.98x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 8.1%) | 341 B | - | - | - | - | - | - | 341 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.1%) | 359 B | - | - | - | - | - | - | 359 B (1.00x; ncc) |
