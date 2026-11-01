Rows 2659, accepted 2288, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.6 KiB | 29.3 KiB (11.45x; more) | 9.8 KiB (3.81x; more) | 17.9 KiB (6.97x; more) | 70.3 KiB (27.42x; more) | 58.0 KiB (22.64x; more) | 8.3 KiB (3.25x; more) | - | 47.8 KiB (18.67x; more) | 6.2 KiB (2.43x; more) | 48.6 KiB (18.96x; more) | 2.6 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 4.0 KiB | 32.1 KiB (8.13x; more) | 12.5 KiB (3.17x; more) | 20.0 KiB (5.06x; more) | - | 59.8 KiB (15.14x; more) | 8.9 KiB (2.25x; more) | 29.5 KiB (7.46x; more) | 49.2 KiB (12.44x; more) | 6.2 KiB (1.57x; more) | 50.7 KiB (12.83x; more) | 4.0 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.5 KiB | 32.8 KiB (5.96x; more) | 13.5 KiB (2.45x; more) | - | - | 63.1 KiB (11.46x; more) | - | - | - | 7.1 KiB (1.29x; more) | 51.7 KiB (9.40x; more) | 5.5 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 4.0 KiB | 29.7 KiB (7.34x; more) | 9.5 KiB (2.35x; more) | 18.3 KiB (4.52x; more) | 90.5 KiB (22.35x; more) | 58.5 KiB (14.46x; more) | 8.4 KiB (2.08x; more) | - | 48.4 KiB (11.96x; more) | - | 48.6 KiB (12.02x; more) | 4.0 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 14.6 KiB (10.41x; more) | 6.4 KiB (4.58x; more) | 13.4 KiB (9.50x; more) | 48.0 KiB (34.17x; more) | 28.3 KiB (20.14x; more) | 7.1 KiB (5.03x; more) | - | 46.2 KiB (32.83x; more) | 3.4 KiB (2.41x; more) | 16.2 KiB (11.49x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.4 KiB (5.66x; more) | 7.9 KiB (2.92x; more) | 13.7 KiB (5.05x; more) | - | 27.4 KiB (10.11x; more) | 7.1 KiB (2.61x; more) | 12.5 KiB (4.59x; more) | 45.8 KiB (16.90x; more) | 3.6 KiB (1.34x; more) | 17.8 KiB (6.57x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 16.5 KiB (3.85x; more) | 8.5 KiB (1.98x; more) | - | - | 30.6 KiB (7.13x; more) | - | - | - | 4.3 KiB (0.99x; ncc) | 18.7 KiB (4.36x; more) | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.4 KiB (6.33x; more) | 7.7 KiB (2.95x; more) | 14.9 KiB (5.75x; more) | 67.3 KiB (25.90x; more) | 29.5 KiB (11.34x; more) | 8.6 KiB (3.29x; more) | - | 47.5 KiB (18.29x; more) | - | 18.0 KiB (6.93x; more) | 2.6 KiB (0.99x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 85.1%) | 29.3 KiB | 194.7 KiB (6.65x; more) | 54.5 KiB (1.86x; ncc) | 57.7 KiB (1.97x; ncc) | 69.3 KiB (2.36x; ncc) | 107.5 KiB (3.67x; ncc) | 57.1 KiB (1.95x; ncc) | - | 57.2 KiB (1.95x; ncc) | 45.1 KiB (1.54x; ncc) | 88.9 KiB (3.04x; ncc) | 29.3 KiB (1.00x; ncc) |
| bench-part-put (band 72.1%) | 37.1 KiB | -2.0 KiB (ncc) | -246.0 KiB (less) | 17.4 KiB (0.47x; ncc) | - | 36.7 KiB (0.99x; ncc) | 1016 B (0.03x; ncc) | 61.5 KiB (1.66x; ncc) | -15.1 KiB (ncc) | 3.6 KiB (0.10x; ncc) | 38.5 KiB (1.04x; ncc) | 37.1 KiB (1.00x; ncc) |
| bench-encode (band 246.0%) | 17.4 KiB | 8.3 KiB (0.48x; ncc) | 52.0 KiB (2.99x; ncc) | - | - | 56.2 KiB (3.23x; ncc) | - | - | - | -7.0 KiB (ncc) | 28.7 KiB (1.65x; ncc) | 17.4 KiB (1.00x; ncc) |
| bench-body-1k (band 5.4%) | 12.8 KiB | 54.2 KiB (4.24x; ncc) | 39.2 KiB (3.07x; ncc) | -28.1 KiB (ncc) | 11.3 KiB (0.88x; ncc) | 110.5 KiB (8.66x; ncc) | -8.3 KiB (ncc) | - | 27.1 KiB (2.12x; ncc) | - | 28.2 KiB (2.21x; ncc) | 12.8 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.5%) | 862 B | 4.0 KiB (4.79x; ncc) | -726 B (ncc) | 15.4 KiB (18.29x; ncc) | -587 B (ncc) | 334 B (0.39x; ncc) | 19.9 KiB (23.68x; ncc) | - | -172 B (ncc) | 10.4 KiB (12.36x; ncc) | 279 B (0.32x; ncc) | 862 B (1.00x; ncc) |
| bench-part-put (band 30.9%) | 9.2 KiB | 5.5 KiB (0.60x; ncc) | 29.2 KiB (3.18x; ncc) | 26.5 KiB (2.88x; ncc) | - | 107 B (0.01x; ncc) | 4.5 KiB (0.49x; ncc) | -1.3 KiB (ncc) | 3.8 KiB (0.41x; ncc) | 1.7 KiB (0.18x; ncc) | 13.6 KiB (1.48x; ncc) | 9.2 KiB (1.00x; ncc) |
| bench-encode (band 3213.8%) | 188 B | -52 B (ncc) | 13.5 KiB (73.29x; ncc) | - | - | 8.7 KiB (47.13x; ncc) | - | - | - | 5.2 KiB (28.32x; ncc) | -629 B (ncc) | 1.3 KiB (6.96x; ncc) |
| bench-body-1k (band 298.0%) | 2.1 KiB | -83 B (ncc) | 1.2 KiB (0.58x; ncc) | 2.8 KiB (1.39x; ncc) | 3.5 KiB (1.72x; ncc) | 836 B (0.40x; ncc) | -52 B (ncc) | - | -51 B (ncc) | - | -83 B (ncc) | 2.1 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 49.00 (8.17x; more) | 167 (27.83x; more) | 19.00 (3.17x; more) | - | 118 (19.67x; more) | 15.00 (2.50x; more) | 151 (25.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 48.00 (4.80x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 90.00 (9.00x; more) | 22.00 (2.20x; more) | 89.00 (8.90x; more) | 121 (12.10x; more) | 14.00 (1.40x; ncc) | 77.00 (7.70x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 14.00 | 48.00 (3.43x; more) | 33.00 (2.36x; more) | - | - | 94.00 (6.71x; more) | - | - | - | 18.00 (1.29x; ncc) | 78.50 (5.61x; more) | 14.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | 62.00 (6.20x; more) | 87.00 (8.70x; more) | 20.00 (2.00x; more) | - | 119 (11.90x; more) | - | 74.00 (7.40x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 27.00 (9.00x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 47.00 (15.67x; more) | 16.00 (5.33x; more) | - | 79.00 (26.33x; more) | 9.00 (3.00x; more) | 30.50 (10.17x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 26.00 (5.20x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 43.00 (8.60x; more) | 15.00 (3.00x; more) | 20.00 (4.00x; more) | 75.00 (15.00x; more) | 8.00 (1.60x; ncc) | 30.00 (6.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 30.00 (4.29x; more) | 17.00 (2.43x; more) | - | - | 49.00 (7.00x; more) | - | - | - | 9.00 (1.29x; ncc) | 33.00 (4.71x; more) | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 29.00 (5.80x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | 110 (22.00x; more) | 47.00 (9.40x; more) | 18.00 (3.60x; more) | - | 79.00 (15.80x; more) | - | 32.00 (6.40x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 326.0%) | 0.30 ms | 14.56 ms (47.95x; more) | 3.12 ms (10.28x; more) | 16.68 ms (54.94x; more) | 28.88 ms (95.14x; more) | 39.94 ms (131.57x; more) | 20.05 ms (66.05x; more) | - | 7.45 ms (24.54x; more) | 1.84 ms (6.06x; ncc) | 43.21 ms (142.32x; more) | 0.34 ms (1.11x; ncc) |
| bench-part-put (band 99.2%) | 0.43 ms | 6.99 ms (16.31x; more) | 2.49 ms (5.80x; more) | 12.86 ms (30.02x; more) | - | 27.23 ms (63.57x; more) | 13.49 ms (31.48x; more) | 9.70 ms (22.65x; more) | 5.10 ms (11.90x; more) | 0.87 ms (2.03x; ncc) | 27.24 ms (63.58x; more) | 0.40 ms (0.94x; ncc) |
| bench-encode (band 57.7%) | 0.50 ms | 14.25 ms (28.71x; more) | 3.25 ms (6.55x; more) | - | - | 32.58 ms (65.66x; more) | - | - | - | 1.90 ms (3.83x; ncc) | 39.00 ms (78.58x; more) | 0.50 ms (1.00x; ncc) |
| bench-body-1k (band 17.7%) | 0.40 ms | 13.96 ms (35.09x; more) | 2.88 ms (7.24x; more) | 16.71 ms (41.98x; more) | 29.08 ms (73.07x; more) | 29.98 ms (75.34x; more) | 22.06 ms (55.43x; more) | - | 7.62 ms (19.15x; more) | - | 43.74 ms (109.91x; more) | 0.39 ms (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 65.1%) | 1.05 ms | 8.32 ms (7.89x; more) | 5.97 ms (5.66x; more) | 10.60 ms (10.05x; more) | 32.01 ms (30.36x; more) | 25.31 ms (24.01x; more) | 8.29 ms (7.86x; more) | - | 34.06 ms (32.31x; more) | 3.36 ms (3.19x; more) | 13.63 ms (12.93x; more) | 1.08 ms (1.02x; ncc) |
| bench-part-put (band 49.3%) | 1.53 ms | 7.59 ms (4.96x; more) | 5.72 ms (3.74x; more) | 9.51 ms (6.21x; more) | - | 14.34 ms (9.37x; more) | 7.32 ms (4.78x; more) | 7.82 ms (5.11x; more) | 33.25 ms (21.73x; more) | 3.00 ms (1.96x; ncc) | 14.45 ms (9.44x; more) | 1.61 ms (1.05x; ncc) |
| bench-encode (band 40.0%) | 2.12 ms | 9.85 ms (4.65x; more) | 6.69 ms (3.16x; more) | - | - | 17.24 ms (8.14x; more) | - | - | - | 3.26 ms (1.54x; ncc) | 12.61 ms (5.96x; more) | 2.05 ms (0.97x; ncc) |
| bench-body-1k (band 93.4%) | 1.81 ms | 8.42 ms (4.65x; more) | 5.25 ms (2.90x; more) | 10.25 ms (5.66x; more) | 43.50 ms (24.03x; more) | 21.42 ms (11.83x; more) | 7.99 ms (4.41x; more) | - | 35.43 ms (19.58x; more) | - | 12.92 ms (7.14x; more) | 1.52 ms (0.84x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 30.5%) | 2.30 µs | 47.29 µs (20.58x; more) | 8.33 µs (3.63x; more) | 15.01 µs (6.53x; more) | 64.46 µs (28.06x; more) | 85.70 µs (37.30x; more) | 14.62 µs (6.36x; more) | - | 80.21 µs (34.91x; more) | 5.18 µs (2.25x; more) | 74.60 µs (32.47x; more) | 2.32 µs (1.01x; ncc) |
| bench-part-put (band 4.1%) | 2.13 µs | 39.36 µs (18.45x; more) | 9.04 µs (4.24x; more) | 13.28 µs (6.23x; more) | - | 75.66 µs (35.47x; more) | 12.83 µs (6.01x; more) | 25.91 µs (12.14x; more) | 73.63 µs (34.51x; more) | 4.49 µs (2.11x; more) | 66.54 µs (31.19x; more) | 2.14 µs (1.00x; ncc) |
| bench-encode (band 44.6%) | 2.61 µs | 37.63 µs (14.43x; more) | 9.84 µs (3.78x; more) | - | - | 75.93 µs (29.12x; more) | - | - | - | 6.29 µs (2.41x; more) | 70.25 µs (26.95x; more) | 2.36 µs (0.91x; ncc) |
| bench-body-1k (band 4.7%) | 2.49 µs | 39.05 µs (15.67x; more) | 8.02 µs (3.22x; more) | 14.16 µs (5.68x; more) | 72.53 µs (29.10x; more) | 77.17 µs (30.97x; more) | 14.91 µs (5.98x; more) | - | 78.17 µs (31.37x; more) | - | 68.79 µs (27.60x; more) | 2.49 µs (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bench-download (band 8.3%) | 2.00 µs | 23.69 µs (11.83x; more) | 11.00 µs (5.49x; more) | 17.18 µs (8.58x; more) | 46.93 µs (23.45x; more) | 73.51 µs (36.72x; more) | 8.92 µs (4.46x; more) | - | 31.37 µs (15.67x; more) | 6.92 µs (3.46x; more) | 63.46 µs (31.71x; more) | 2.00 µs (1.00x; ncc) |
| bench-part-put (band 26.9%) | 2.01 µs | 22.35 µs (11.09x; more) | 8.64 µs (4.29x; more) | 11.28 µs (5.60x; more) | - | 67.78 µs (33.65x; more) | 5.37 µs (2.67x; more) | 30.31 µs (15.04x; more) | 27.74 µs (13.77x; more) | 3.16 µs (1.57x; more) | 68.71 µs (34.11x; more) | 1.88 µs (0.93x; ncc) |
| bench-encode (band 31.3%) | 3.71 µs | 22.49 µs (6.06x; more) | 8.41 µs (2.27x; more) | - | - | 64.81 µs (17.47x; more) | - | - | - | 4.06 µs (1.09x; ncc) | 60.68 µs (16.36x; more) | 3.71 µs (1.00x; ncc) |
| bench-body-1k (band 14.6%) | 2.09 µs | 22.23 µs (10.65x; more) | 5.05 µs (2.42x; more) | 8.47 µs (4.06x; more) | 52.61 µs (25.20x; more) | 73.87 µs (35.38x; more) | 7.07 µs (3.39x; more) | - | 28.28 µs (13.54x; more) | - | 56.93 µs (27.26x; more) | 2.09 µs (1.00x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - (band 4.0%) | 111.8 MiB | 126.7 MiB (1.13x; more) | 109.9 MiB (0.98x; ncc) | 111.0 MiB (0.99x; ncc) | 166.4 MiB (1.49x; more) | 120.8 MiB (1.08x; more) | 112.7 MiB (1.01x; ncc) | 107.7 MiB (0.96x; ncc) | 118.9 MiB (1.06x; ncc) | 105.6 MiB (0.94x; ncc) | 123.4 MiB (1.10x; more) | 111.1 MiB (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - (band 15.1%) | 73.8 MiB | 70.4 MiB (0.95x; ncc) | 74.6 MiB (1.01x; ncc) | 81.2 MiB (1.10x; ncc) | 85.2 MiB (1.16x; ncc) | 83.4 MiB (1.13x; ncc) | 74.9 MiB (1.02x; ncc) | 77.5 MiB (1.05x; ncc) | 65.7 MiB (0.89x; ncc) | 66.2 MiB (0.90x; ncc) | 68.7 MiB (0.93x; ncc) | 70.7 MiB (0.96x; ncc) |

### start-up cost: import + first signature (command time minus the no-library control)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - (band 239.0%) | 2.12 ms | 18.42 ms (8.68x; more) | 3.23 ms (1.52x; ncc) | 11.31 ms (5.33x; ncc) | 8.02 ms (3.78x; ncc) | 18.59 ms (8.76x; more) | 16.65 ms (7.85x; more) | 7.45 ms (3.51x; ncc) | 2.93 ms (1.38x; ncc) | 1.67 ms (0.79x; ncc) | 17.37 ms (8.19x; more) | 1.50 ms (0.71x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - (band 92.1%) | 1.43 ms | 2.22 ms (1.55x; ncc) | 2.46 ms (1.71x; ncc) | 10.21 ms (7.11x; more) | 3.04 ms (2.12x; ncc) | 3.55 ms (2.47x; ncc) | 15.15 ms (10.56x; more) | 3.44 ms (2.40x; ncc) | 1.88 ms (1.31x; ncc) | 1.08 ms (0.75x; ncc) | 2.99 ms (2.08x; ncc) | 1.61 ms (1.12x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 329 B | - | - | - | - | - | - | - | - | - | - | 329 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | s3mini | tiny-oss | lean-s3 | s3-lite-client | sigflint-B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 360 B | - | - | - | - | - | - | - | - | - | - | 360 B (1.00x; ncc) |
