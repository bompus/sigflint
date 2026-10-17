Rows 2000, accepted 1750, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.6 KiB | 29.2 KiB (11.41x; more) | 9.8 KiB (3.81x; more) | 17.9 KiB (6.97x; more) | 69.4 KiB (27.07x; more) | 58.0 KiB (22.64x; more) | 8.3 KiB (3.23x; more) | 2.6 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 4.0 KiB | 32.1 KiB (8.12x; more) | 12.6 KiB (3.18x; more) | 19.9 KiB (5.04x; more) | - | 59.8 KiB (15.14x; more) | 8.9 KiB (2.24x; more) | 4.0 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.5 KiB | 32.9 KiB (5.99x; more) | 13.5 KiB (2.45x; more) | - | - | 63.1 KiB (11.47x; more) | - | 5.5 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 4.0 KiB | 29.7 KiB (7.37x; more) | 9.5 KiB (2.36x; more) | 18.4 KiB (4.57x; more) | - | - | 8.5 KiB (2.10x; more) | 4.0 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 15.1 KiB (10.86x; more) | 6.4 KiB (4.62x; more) | 13.2 KiB (9.46x; more) | 47.9 KiB (34.39x; more) | 30.5 KiB (21.86x; more) | 7.0 KiB (5.06x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.9 KiB (5.89x; more) | 7.9 KiB (2.92x; more) | 14.0 KiB (5.20x; more) | - | 28.5 KiB (10.57x; more) | 7.0 KiB (2.61x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 17.0 KiB (4.00x; more) | 8.5 KiB (1.99x; more) | - | - | 31.5 KiB (7.38x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.9 KiB (6.57x; more) | 7.7 KiB (2.97x; more) | 15.2 KiB (5.90x; more) | - | - | 8.5 KiB (3.31x; more) | 2.6 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 29.4 KiB | 186.4 KiB (6.33x; more) | 48.0 KiB (1.63x; ncc) | 50.4 KiB (1.71x; ncc) | 64.0 KiB (2.17x; ncc) | 107.9 KiB (3.66x; more) | 47.7 KiB (1.62x; ncc) | 29.2 KiB (0.99x; ncc) |
| bench-part-put (band 110.6%) | 24.1 KiB | -912 B (ncc) | -252.9 KiB (less) | 17.1 KiB (0.71x; ncc) | - | 1.3 KiB (0.05x; ncc) | 992 B (0.04x; ncc) | 24.1 KiB (1.00x; ncc) |
| bench-encode (band 3979.0%) | -840 B | -1.0 KiB (ncc) | -44.3 KiB (ncc) | - | - | 16.4 KiB (ncc) | - | -840 B (ncc) |
| bench-body-1k (band 40.9%) | 17.5 KiB | 62.1 KiB (3.54x; ncc) | 8.9 KiB (0.51x; ncc) | -9.3 KiB (ncc) | - | - | -9.4 KiB (ncc) | 17.4 KiB (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 79.2%) | 849 B | 2.8 KiB (3.37x; ncc) | -3.2 KiB (ncc) | 3.4 KiB (4.11x; ncc) | -588 B (ncc) | -748 B (ncc) | 20.1 KiB (24.26x; ncc) | 849 B (1.00x; ncc) |
| bench-part-put (band 5.6%) | 2.2 KiB | 5.6 KiB (2.51x; ncc) | 25.6 KiB (11.51x; ncc) | 933 B (0.41x; ncc) | - | -2.5 KiB (ncc) | 5.0 KiB (2.23x; ncc) | 2.2 KiB (0.99x; ncc) |
| bench-encode (band 3.0%) | 2.6 KiB | -33 B (ncc) | 8.9 KiB (3.41x; ncc) | - | - | 585 B (0.22x; ncc) | - | 2.6 KiB (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.0 KiB | -6.5 KiB (ncc) | 6.6 KiB (1.32x; ncc) | 2.8 KiB (0.57x; ncc) | - | - | -1.1 KiB (ncc) | 5.0 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 46.00 (7.67x; more) | 174 (29.00x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 51.00 (5.10x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 90.00 (9.00x; more) | 22.00 (2.20x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 13.00 | 48.00 (3.69x; more) | 33.00 (2.54x; more) | - | - | 94.00 (7.23x; more) | - | 13.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 27.00 (9.00x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 51.00 (17.00x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 28.00 (5.60x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 46.00 (9.20x; more) | 15.00 (3.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 31.00 (4.43x; more) | 17.00 (2.43x; more) | - | - | 53.00 (7.57x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 30.00 (6.00x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | - | - | 18.00 (3.60x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 41.1%) | 1.17 ms | 32.14 ms (27.56x; more) | 6.68 ms (5.73x; more) | 20.84 ms (17.87x; more) | 34.14 ms (29.28x; more) | 75.34 ms (64.62x; more) | 21.07 ms (18.07x; more) | 1.14 ms (0.97x; ncc) |
| bench-part-put (band 43.5%) | 1.54 ms | 19.58 ms (12.68x; more) | 6.22 ms (4.03x; more) | 15.74 ms (10.19x; more) | - | 61.73 ms (39.98x; more) | 17.04 ms (11.04x; more) | 1.57 ms (1.02x; ncc) |
| bench-encode (band 19.6%) | 1.63 ms | 27.08 ms (16.58x; more) | 7.57 ms (4.63x; more) | - | - | 62.72 ms (38.41x; more) | - | 1.52 ms (0.93x; ncc) |
| bench-body-1k (band 28.9%) | 1.40 ms | 27.32 ms (19.57x; more) | 6.02 ms (4.31x; more) | 20.02 ms (14.34x; more) | - | - | 20.49 ms (14.68x; more) | 1.38 ms (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 100.5%) | 4.94 ms | 54.90 ms (11.12x; more) | 26.78 ms (5.42x; more) | 49.66 ms (10.06x; more) | 144 ms (29.19x; more) | 118 ms (23.87x; more) | 31.47 ms (6.38x; more) | 5.44 ms (1.10x; ncc) |
| bench-part-put (band 62.8%) | 8.58 ms | 57.14 ms (6.66x; more) | 26.44 ms (3.08x; more) | 43.16 ms (5.03x; more) | - | 139 ms (16.20x; more) | 27.57 ms (3.21x; more) | 8.91 ms (1.04x; ncc) |
| bench-encode (band 55.2%) | 11.86 ms | 65.60 ms (5.53x; more) | 31.24 ms (2.63x; more) | - | - | 123 ms (10.37x; more) | - | 12.71 ms (1.07x; ncc) |
| bench-body-1k (band 43.1%) | 8.55 ms | 62.58 ms (7.32x; more) | 28.51 ms (3.33x; more) | 48.50 ms (5.67x; more) | - | - | 33.79 ms (3.95x; more) | 8.39 ms (0.98x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 28.2%) | 2.71 µs | 254 µs (93.80x; more) | 10.82 µs (4.00x; more) | 17.29 µs (6.38x; more) | 73.52 µs (27.15x; more) | 677 µs (249.93x; more) | 16.52 µs (6.10x; more) | 2.65 µs (0.98x; ncc) |
| bench-part-put (band 24.0%) | 2.84 µs | 242 µs (85.00x; more) | 10.57 µs (3.72x; more) | 14.98 µs (5.27x; more) | - | 576 µs (202.48x; more) | 14.13 µs (4.97x; more) | 2.76 µs (0.97x; ncc) |
| bench-encode (band 8.3%) | 3.35 µs | 240 µs (71.69x; more) | 12.13 µs (3.62x; more) | - | - | 671 µs (200.37x; more) | - | 3.45 µs (1.03x; ncc) |
| bench-body-1k (band 9.9%) | 3.25 µs | 238 µs (73.26x; more) | 9.58 µs (2.95x; more) | 15.83 µs (4.87x; more) | - | - | 15.88 µs (4.88x; more) | 3.28 µs (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 24.8%) | 3.36 µs | 213 µs (63.46x; more) | 16.67 µs (4.96x; more) | 25.90 µs (7.70x; more) | 67.31 µs (20.02x; more) | 577 µs (171.48x; more) | 15.35 µs (4.56x; more) | 3.46 µs (1.03x; ncc) |
| bench-part-put (band 22.8%) | 3.43 µs | 209 µs (61.05x; more) | 13.42 µs (3.92x; more) | 16.03 µs (4.68x; more) | - | 563 µs (164.45x; more) | 10.53 µs (3.07x; more) | 3.65 µs (1.07x; ncc) |
| bench-encode (band 49.2%) | 4.58 µs | 218 µs (47.58x; more) | 14.57 µs (3.18x; more) | - | - | 573 µs (125.19x; more) | - | 4.73 µs (1.03x; ncc) |
| bench-body-1k (band 37.4%) | 4.24 µs | 211 µs (49.83x; more) | 9.87 µs (2.33x; more) | 16.47 µs (3.88x; more) | - | - | 12.81 µs (3.02x; more) | 4.20 µs (0.99x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 106.2 MiB | 116.5 MiB (1.10x; more) | 106.5 MiB (1.00x; ncc) | 104.6 MiB (0.98x; ncc) | 158.6 MiB (1.49x; more) | 117.6 MiB (1.11x; more) | 107.5 MiB (1.01x; ncc) | 105.8 MiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 64.7 MiB | 69.4 MiB (1.07x; more) | 71.8 MiB (1.11x; more) | 74.2 MiB (1.15x; more) | 79.8 MiB (1.23x; more) | 74.6 MiB (1.15x; more) | 70.9 MiB (1.09x; more) | 64.7 MiB (1.00x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 40.9%) | 1.17 ms | 1.50 ms (1.28x; ncc) | 1.54 ms (1.32x; ncc) | 11.39 ms (9.71x; more) | 2.66 ms (2.26x; more) | 1.87 ms (1.60x; ncc) | 14.83 ms (12.63x; more) | 1.20 ms (1.02x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 17.4%) | 1.84 ms | 1.08 ms (0.59x; ncc) | 2.12 ms (1.15x; ncc) | 9.38 ms (5.09x; more) | 2.28 ms (1.23x; ncc) | 1.53 ms (0.83x; ncc) | 18.82 ms (10.21x; more) | 1.83 ms (0.99x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 35.8%) | 2.49 ms | 18.73 ms (7.52x; more) | 3.34 ms (1.34x; ncc) | 13.02 ms (5.23x; more) | 8.78 ms (3.52x; more) | 17.74 ms (7.12x; more) | 15.83 ms (6.36x; more) | 2.50 ms (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 11.2%) | 2.38 ms | 2.91 ms (1.22x; ncc) | 2.93 ms (1.23x; ncc) | 10.74 ms (4.52x; more) | 4.16 ms (1.75x; more) | 4.42 ms (1.86x; more) | 19.35 ms (8.14x; more) | 2.35 ms (0.99x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 7.8%) | 341 B | - | - | - | - | - | - | 340 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 359 B | - | - | - | - | - | - | 359 B (1.00x; ncc) |
