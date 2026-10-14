Rows 2000, accepted 1750, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.6 KiB | 29.3 KiB (11.45x; more) | 9.8 KiB (3.81x; more) | 17.8 KiB (6.97x; more) | 69.4 KiB (27.07x; more) | 58.0 KiB (22.64x; more) | 8.2 KiB (3.22x; more) | 2.6 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 3.9 KiB | 32.1 KiB (8.23x; more) | 12.6 KiB (3.22x; more) | 19.9 KiB (5.12x; more) | - | 59.8 KiB (15.35x; more) | 8.8 KiB (2.27x; more) | 3.9 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.5 KiB | 32.8 KiB (5.96x; more) | 13.5 KiB (2.45x; more) | - | - | 63.1 KiB (11.47x; more) | - | 5.5 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 3.9 KiB | 29.7 KiB (7.58x; more) | 9.5 KiB (2.43x; more) | 18.3 KiB (4.65x; more) | - | - | 8.5 KiB (2.16x; more) | 3.9 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 15.1 KiB (10.68x; more) | 6.4 KiB (4.54x; more) | 13.2 KiB (9.30x; more) | 47.9 KiB (33.80x; more) | 29.9 KiB (21.15x; more) | 7.0 KiB (4.98x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 16.3 KiB (6.00x; more) | 7.9 KiB (2.90x; more) | 14.0 KiB (5.16x; more) | - | 28.4 KiB (10.47x; more) | 7.0 KiB (2.59x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 17.0 KiB (3.95x; more) | 8.5 KiB (1.96x; more) | - | - | 31.6 KiB (7.32x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.9 KiB (6.48x; more) | 7.7 KiB (2.94x; more) | 15.2 KiB (5.82x; more) | - | - | 8.5 KiB (3.27x; more) | 2.6 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 30.4 KiB | 186.4 KiB (6.12x; more) | 48.0 KiB (1.58x; ncc) | 50.3 KiB (1.65x; ncc) | 64.0 KiB (2.10x; ncc) | 108.1 KiB (3.55x; more) | 47.4 KiB (1.56x; ncc) | 30.4 KiB (1.00x; ncc) |
| bench-part-put (band 3.0%) | 36.2 KiB | -912 B (ncc) | -20.3 KiB (ncc) | 18.1 KiB (0.50x; ncc) | - | 1.3 KiB (0.03x; ncc) | 968 B (0.03x; ncc) | 36.2 KiB (1.00x; ncc) |
| bench-encode (band 10192.8%) | -840 B | -1.0 KiB (ncc) | -44.6 KiB (ncc) | - | - | 16.5 KiB (ncc) | - | -664 B (ncc) |
| bench-body-1k (band 235.8%) | 12.4 KiB | 62.1 KiB (5.02x; ncc) | 11.6 KiB (0.94x; ncc) | -9.3 KiB (ncc) | - | - | -9.4 KiB (ncc) | 13.6 KiB (1.10x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 678 B | 4.0 KiB (6.04x; ncc) | -2.2 KiB (ncc) | 5.3 KiB (8.03x; ncc) | -586 B (ncc) | 708 B (1.04x; ncc) | 20.1 KiB (30.42x; ncc) | 678 B (1.00x; ncc) |
| bench-part-put (band 84.1%) | 2.2 KiB | 4.4 KiB (2.02x; ncc) | 25.6 KiB (11.89x; ncc) | 9.0 KiB (4.18x; ncc) | - | -3.3 KiB (ncc) | 5.0 KiB (2.30x; ncc) | 2.2 KiB (1.00x; ncc) |
| bench-encode (band 3.0%) | 2.7 KiB | -1.5 KiB (ncc) | 8.9 KiB (3.34x; ncc) | - | - | 604 B (0.22x; ncc) | - | 2.7 KiB (1.00x; ncc) |
| bench-body-1k (band 40.1%) | 5.0 KiB | -79 B (ncc) | 6.6 KiB (1.31x; ncc) | 2.9 KiB (0.57x; ncc) | - | - | -1.1 KiB (ncc) | 5.0 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 46.00 (7.67x; more) | 174 (29.00x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 51.00 (5.10x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 91.00 (9.10x; more) | 22.00 (2.20x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 15.4%) | 13.00 | 48.00 (3.69x; more) | 33.00 (2.54x; more) | - | - | 94.00 (7.23x; more) | - | 13.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 28.00 (9.33x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 49.00 (16.33x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 27.00 (5.40x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 45.00 (9.00x; more) | 15.00 (3.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 30.00 (4.29x; more) | 17.00 (2.43x; more) | - | - | 53.00 (7.57x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 30.00 (6.00x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | - | - | 18.00 (3.60x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 38.2%) | 1.20 ms | 42.34 ms (35.24x; more) | 7.14 ms (5.94x; more) | 21.54 ms (17.92x; more) | 41.39 ms (34.44x; more) | 96.12 ms (79.99x; more) | 23.29 ms (19.38x; more) | 1.15 ms (0.95x; ncc) |
| bench-part-put (band 30.1%) | 1.62 ms | 24.56 ms (15.19x; more) | 6.49 ms (4.01x; more) | 18.43 ms (11.39x; more) | - | 72.52 ms (44.83x; more) | 20.58 ms (12.72x; more) | 1.51 ms (0.93x; ncc) |
| bench-encode (band 43.2%) | 1.72 ms | 32.14 ms (18.70x; more) | 7.38 ms (4.29x; more) | - | - | 78.74 ms (45.81x; more) | - | 1.61 ms (0.94x; ncc) |
| bench-body-1k (band 41.3%) | 1.56 ms | 33.42 ms (21.40x; more) | 5.78 ms (3.70x; more) | 22.47 ms (14.39x; more) | - | - | 22.76 ms (14.58x; more) | 1.57 ms (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 77.4%) | 5.20 ms | 58.88 ms (11.32x; more) | 27.05 ms (5.20x; more) | 50.45 ms (9.70x; more) | 150 ms (28.89x; more) | 119 ms (22.79x; more) | 30.95 ms (5.95x; more) | 5.08 ms (0.98x; ncc) |
| bench-part-put (band 64.9%) | 9.12 ms | 61.10 ms (6.70x; more) | 27.25 ms (2.99x; more) | 48.09 ms (5.27x; more) | - | 102 ms (11.20x; more) | 28.26 ms (3.10x; more) | 8.79 ms (0.96x; ncc) |
| bench-encode (band 61.1%) | 12.44 ms | 65.18 ms (5.24x; more) | 32.44 ms (2.61x; more) | - | - | 129 ms (10.36x; more) | - | 11.66 ms (0.94x; ncc) |
| bench-body-1k (band 54.1%) | 10.00 ms | 64.60 ms (6.46x; more) | 28.93 ms (2.89x; more) | 52.27 ms (5.23x; more) | - | - | 37.58 ms (3.76x; more) | 9.03 ms (0.90x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 16.9%) | 2.43 µs | 243 µs (100.24x; more) | 10.39 µs (4.28x; more) | 17.48 µs (7.20x; more) | 80.32 µs (33.09x; more) | 642 µs (264.30x; more) | 17.01 µs (7.01x; more) | 2.39 µs (0.98x; ncc) |
| bench-part-put (band 10.5%) | 2.64 µs | 230 µs (86.90x; more) | 10.97 µs (4.15x; more) | 15.58 µs (5.89x; more) | - | 562 µs (212.75x; more) | 14.99 µs (5.67x; more) | 2.61 µs (0.99x; ncc) |
| bench-encode (band 31.0%) | 3.54 µs | 230 µs (65.08x; more) | 12.30 µs (3.48x; more) | - | - | 632 µs (178.70x; more) | - | 3.44 µs (0.97x; ncc) |
| bench-body-1k (band 14.1%) | 3.35 µs | 236 µs (70.64x; more) | 9.77 µs (2.92x; more) | 16.86 µs (5.04x; more) | - | - | 16.75 µs (5.01x; more) | 3.31 µs (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 28.6%) | 3.60 µs | 206 µs (57.36x; more) | 18.00 µs (5.00x; more) | 26.50 µs (7.36x; more) | 75.82 µs (21.06x; more) | 554 µs (153.78x; more) | 15.66 µs (4.35x; more) | 3.70 µs (1.03x; ncc) |
| bench-part-put (band 41.9%) | 3.71 µs | 216 µs (58.26x; more) | 14.89 µs (4.01x; more) | 20.19 µs (5.44x; more) | - | 547 µs (147.47x; more) | 11.96 µs (3.22x; more) | 3.48 µs (0.94x; ncc) |
| bench-encode (band 50.2%) | 5.05 µs | 216 µs (42.71x; more) | 16.75 µs (3.32x; more) | - | - | 560 µs (110.83x; more) | - | 4.96 µs (0.98x; ncc) |
| bench-body-1k (band 36.9%) | 4.63 µs | 210 µs (45.28x; more) | 12.30 µs (2.66x; more) | 19.30 µs (4.17x; more) | - | - | 14.83 µs (3.20x; more) | 4.72 µs (1.02x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 5.0%) | 116.9 MiB | 128.4 MiB (1.10x; more) | 116.6 MiB (1.00x; ncc) | 115.7 MiB (0.99x; ncc) | 170.1 MiB (1.46x; more) | 125.9 MiB (1.08x; more) | 118.2 MiB (1.01x; ncc) | 117.2 MiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 65.9 MiB | 69.4 MiB (1.05x; more) | 71.1 MiB (1.08x; more) | 73.3 MiB (1.11x; more) | 79.8 MiB (1.21x; more) | 74.6 MiB (1.13x; more) | 70.7 MiB (1.07x; more) | 65.3 MiB (0.99x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 37.1%) | 1.32 ms | 1.63 ms (1.23x; ncc) | 2.00 ms (1.51x; ncc) | 11.66 ms (8.80x; more) | 3.02 ms (2.28x; more) | 2.09 ms (1.58x; ncc) | 15.96 ms (12.05x; more) | 1.29 ms (0.98x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 21.3%) | 1.89 ms | 1.32 ms (0.70x; ncc) | 2.44 ms (1.29x; ncc) | 9.85 ms (5.22x; more) | 2.70 ms (1.43x; ncc) | 1.82 ms (0.97x; ncc) | 19.70 ms (10.43x; more) | 1.82 ms (0.96x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 22.2%) | 2.67 ms | 18.37 ms (6.89x; more) | 3.90 ms (1.46x; more) | 13.23 ms (4.96x; more) | 8.78 ms (3.29x; more) | 18.59 ms (6.97x; more) | 17.14 ms (6.43x; more) | 2.65 ms (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 18.9%) | 2.45 ms | 3.23 ms (1.32x; ncc) | 3.37 ms (1.37x; ncc) | 11.20 ms (4.57x; more) | 4.69 ms (1.91x; more) | 4.80 ms (1.96x; more) | 20.22 ms (8.25x; more) | 2.41 ms (0.99x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 338 B | - | - | - | - | - | - | 338 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 359 B | - | - | - | - | - | - | 359 B (1.00x; ncc) |
