Rows 2000, accepted 1750, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.6 KiB | 29.3 KiB (11.44x; more) | 9.8 KiB (3.81x; more) | 17.8 KiB (6.96x; more) | 69.4 KiB (27.07x; more) | 58.0 KiB (22.63x; more) | 8.3 KiB (3.23x; more) | 2.6 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 4.0 KiB | 32.1 KiB (8.13x; more) | 12.5 KiB (3.17x; more) | 19.9 KiB (5.05x; more) | - | 59.8 KiB (15.14x; more) | 8.8 KiB (2.24x; more) | 4.0 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.5 KiB | 32.8 KiB (5.96x; more) | 13.5 KiB (2.45x; more) | - | - | 63.1 KiB (11.46x; more) | - | 5.5 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 4.0 KiB | 29.7 KiB (7.36x; more) | 9.6 KiB (2.37x; more) | 18.3 KiB (4.53x; more) | - | - | 8.4 KiB (2.09x; more) | 4.0 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 14.6 KiB (10.45x; more) | 6.4 KiB (4.59x; more) | 13.1 KiB (9.38x; more) | 47.8 KiB (34.14x; more) | 28.3 KiB (20.20x; more) | 7.1 KiB (5.04x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.3 KiB (5.67x; more) | 7.9 KiB (2.91x; more) | 14.0 KiB (5.16x; more) | - | 27.9 KiB (10.30x; more) | 7.0 KiB (2.60x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 16.5 KiB (3.88x; more) | 8.5 KiB (1.98x; more) | - | - | 30.6 KiB (7.18x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.5 KiB (6.38x; more) | 7.7 KiB (2.97x; more) | 15.1 KiB (5.86x; more) | - | - | 8.5 KiB (3.30x; more) | 2.6 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 29.4 KiB | 189.4 KiB (6.44x; more) | 54.4 KiB (1.85x; ncc) | 50.4 KiB (1.71x; ncc) | 66.8 KiB (2.27x; ncc) | 108.3 KiB (3.68x; ncc) | 56.3 KiB (1.92x; ncc) | 29.3 KiB (1.00x; ncc) |
| bench-part-put (band 71.7%) | 37.3 KiB | -744 B (ncc) | -14.3 KiB (ncc) | 17.1 KiB (0.46x; ncc) | - | 40.7 KiB (1.09x; ncc) | 328 B (0.01x; ncc) | 37.3 KiB (1.00x; ncc) |
| bench-encode (band 251.5%) | 17.6 KiB | 4.4 KiB (0.25x; ncc) | -56.1 KiB (ncc) | - | - | 56.0 KiB (3.19x; ncc) | - | 17.2 KiB (0.98x; ncc) |
| bench-body-1k (band 6.9%) | 13.0 KiB | 53.8 KiB (4.15x; ncc) | 45.9 KiB (3.54x; ncc) | -10.4 KiB (ncc) | - | - | -8.2 KiB (ncc) | 12.9 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 78.9%) | 862 B | 4.0 KiB (4.74x; ncc) | -4.0 KiB (ncc) | 11.3 KiB (13.39x; ncc) | -590 B (ncc) | 334 B (0.39x; ncc) | 20.0 KiB (23.71x; ncc) | 862 B (1.00x; ncc) |
| bench-part-put (band 7.1%) | 9.2 KiB | -1.5 KiB (ncc) | 29.3 KiB (3.18x; ncc) | 6.0 KiB (0.65x; ncc) | - | 2.4 KiB (0.26x; ncc) | 4.5 KiB (0.49x; ncc) | 9.2 KiB (1.00x; ncc) |
| bench-encode (band 221.4%) | 2.7 KiB | 3.2 KiB (1.20x; ncc) | 12.4 KiB (4.61x; ncc) | - | - | 8.7 KiB (3.21x; ncc) | - | 2.7 KiB (1.00x; ncc) |
| bench-body-1k (band 298.0%) | 2.1 KiB | -2.0 KiB (ncc) | 1.2 KiB (0.58x; ncc) | -50 B (ncc) | - | - | -1.1 KiB (ncc) | 2.1 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 45.00 (7.50x; more) | 46.00 (7.67x; more) | 174 (29.00x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 50.00 (5.00x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 90.00 (9.00x; more) | 22.00 (2.20x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 14.00 | 48.00 (3.43x; more) | 33.00 (2.36x; more) | - | - | 94.00 (6.71x; more) | - | 14.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 27.00 (9.00x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 47.00 (15.67x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 26.00 (5.20x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 43.00 (8.60x; more) | 15.00 (3.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 30.00 (4.29x; more) | 17.00 (2.43x; more) | - | - | 49.00 (7.00x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 29.00 (5.80x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | - | - | 18.00 (3.60x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 160.8%) | 0.49 ms | 16.56 ms (33.80x; more) | 3.27 ms (6.68x; more) | 17.55 ms (35.81x; more) | 26.65 ms (54.39x; more) | 36.47 ms (74.42x; more) | 17.75 ms (36.22x; more) | 0.32 ms (0.65x; ncc) |
| bench-part-put (band 116.1%) | 0.40 ms | 6.72 ms (16.64x; more) | 2.47 ms (6.12x; more) | 11.37 ms (28.17x; more) | - | 22.22 ms (55.06x; more) | 8.22 ms (20.35x; more) | 0.40 ms (0.99x; ncc) |
| bench-encode (band 59.7%) | 0.51 ms | 8.21 ms (16.00x; more) | 3.33 ms (6.49x; more) | - | - | 20.88 ms (40.66x; more) | - | 0.51 ms (0.99x; ncc) |
| bench-body-1k (band 34.9%) | 0.40 ms | 4.90 ms (12.37x; more) | 2.85 ms (7.20x; more) | 18.15 ms (45.83x; more) | - | - | 22.60 ms (57.08x; more) | 0.41 ms (1.03x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 100.3%) | 0.99 ms | 8.62 ms (8.75x; more) | 5.97 ms (6.06x; more) | 11.00 ms (11.17x; more) | 30.38 ms (30.84x; more) | 19.97 ms (20.27x; more) | 8.44 ms (8.57x; more) | 1.05 ms (1.07x; ncc) |
| bench-part-put (band 105.5%) | 1.68 ms | 5.75 ms (3.42x; more) | 4.82 ms (2.86x; ncc) | 9.32 ms (5.54x; more) | - | 13.26 ms (7.87x; more) | 6.99 ms (4.15x; more) | 1.65 ms (0.98x; ncc) |
| bench-encode (band 58.7%) | 2.20 ms | 5.32 ms (2.42x; more) | 5.91 ms (2.69x; more) | - | - | 19.38 ms (8.83x; more) | - | 2.01 ms (0.92x; ncc) |
| bench-body-1k (band 91.9%) | 1.47 ms | 6.24 ms (4.24x; more) | 5.16 ms (3.51x; more) | 10.06 ms (6.84x; more) | - | - | 8.26 ms (5.61x; more) | 1.43 ms (0.98x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 24.4%) | 2.17 µs | 46.80 µs (21.60x; more) | 8.84 µs (4.08x; more) | 15.46 µs (7.14x; more) | 64.41 µs (29.73x; more) | 84.88 µs (39.19x; more) | 14.71 µs (6.79x; more) | 2.18 µs (1.01x; ncc) |
| bench-part-put (band 9.5%) | 2.20 µs | 39.36 µs (17.86x; more) | 9.50 µs (4.31x; more) | 13.53 µs (6.14x; more) | - | 75.86 µs (34.41x; more) | 12.57 µs (5.70x; more) | 2.18 µs (0.99x; ncc) |
| bench-encode (band 44.4%) | 2.59 µs | 37.66 µs (14.53x; more) | 11.11 µs (4.29x; more) | - | - | 77.89 µs (30.05x; more) | - | 2.67 µs (1.03x; ncc) |
| bench-body-1k (band 6.4%) | 2.55 µs | 37.52 µs (14.73x; more) | 8.39 µs (3.29x; more) | 14.89 µs (5.85x; more) | - | - | 15.03 µs (5.90x; more) | 2.57 µs (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 14.2%) | 2.05 µs | 28.65 µs (13.99x; more) | 11.59 µs (5.66x; more) | 16.74 µs (8.18x; more) | 46.61 µs (22.77x; more) | 70.09 µs (34.24x; more) | 8.85 µs (4.32x; more) | 2.01 µs (0.98x; ncc) |
| bench-part-put (band 29.8%) | 1.95 µs | 22.53 µs (11.58x; more) | 8.59 µs (4.41x; more) | 9.35 µs (4.80x; more) | - | 72.44 µs (37.22x; more) | 5.42 µs (2.78x; more) | 1.90 µs (0.98x; ncc) |
| bench-encode (band 22.5%) | 3.74 µs | 21.55 µs (5.77x; more) | 9.30 µs (2.49x; more) | - | - | 63.00 µs (16.86x; more) | - | 3.73 µs (1.00x; ncc) |
| bench-body-1k (band 12.1%) | 2.09 µs | 20.45 µs (9.77x; more) | 5.09 µs (2.43x; more) | 8.33 µs (3.98x; more) | - | - | 7.31 µs (3.49x; more) | 2.08 µs (0.99x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 86.8 MiB | 103.5 MiB (1.19x; more) | 86.3 MiB (0.99x; ncc) | 87.2 MiB (1.00x; ncc) | 141.0 MiB (1.62x; more) | 99.9 MiB (1.15x; more) | 88.4 MiB (1.02x; ncc) | 86.4 MiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.4%) | 69.4 MiB | 69.8 MiB (1.01x; ncc) | 73.3 MiB (1.06x; ncc) | 79.0 MiB (1.14x; more) | 83.2 MiB (1.20x; more) | 82.2 MiB (1.18x; more) | 73.3 MiB (1.06x; ncc) | 69.4 MiB (1.00x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 0.98 ms | 1.27 ms (1.30x; ncc) | 1.57 ms (1.59x; ncc) | 9.28 ms (9.43x; more) | 2.18 ms (2.21x; ncc) | 1.68 ms (1.70x; ncc) | 14.53 ms (14.77x; more) | 0.98 ms (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 30.7%) | 1.45 ms | 0.91 ms (0.63x; ncc) | 1.79 ms (1.24x; ncc) | 8.45 ms (5.84x; more) | 1.73 ms (1.20x; ncc) | 1.35 ms (0.93x; ncc) | 14.53 ms (10.05x; more) | 1.36 ms (0.94x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 22.6%) | 2.20 ms | 17.23 ms (7.84x; more) | 3.01 ms (1.37x; ncc) | 10.79 ms (4.91x; more) | 7.94 ms (3.61x; more) | 17.19 ms (7.82x; more) | 15.58 ms (7.09x; more) | 2.16 ms (0.98x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 26.0%) | 1.89 ms | 2.77 ms (1.46x; ncc) | 2.48 ms (1.31x; ncc) | 9.59 ms (5.06x; more) | 3.33 ms (1.76x; ncc) | 3.47 ms (1.83x; ncc) | 14.94 ms (7.89x; more) | 1.80 ms (0.95x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 329 B | - | - | - | - | - | - | 329 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 359 B | - | - | - | - | - | - | 360 B (1.00x; ncc) |
