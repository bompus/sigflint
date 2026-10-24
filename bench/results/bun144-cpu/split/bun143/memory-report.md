Rows 1370, accepted 1120, rejected or error 0

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
| bench-download (band 6.0%) | 1.4 KiB | 14.6 KiB (10.50x; more) | 6.4 KiB (4.62x; more) | 13.2 KiB (9.46x; more) | 47.8 KiB (34.29x; more) | 28.3 KiB (20.32x; more) | 7.0 KiB (5.06x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.4 KiB (5.70x; more) | 7.9 KiB (2.92x; more) | 14.0 KiB (5.20x; more) | - | 27.3 KiB (10.15x; more) | 7.0 KiB (2.61x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 16.6 KiB (3.88x; more) | 8.5 KiB (1.99x; more) | - | - | 30.9 KiB (7.24x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.9 KiB (6.55x; more) | 7.7 KiB (2.97x; more) | 15.2 KiB (5.89x; more) | - | - | 8.5 KiB (3.31x; more) | 2.6 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 88.5%) | 29.4 KiB | 194.1 KiB (6.60x; more) | 47.6 KiB (1.62x; ncc) | 50.4 KiB (1.71x; ncc) | 69.4 KiB (2.36x; ncc) | 108.2 KiB (3.68x; ncc) | 54.8 KiB (1.86x; ncc) | 29.5 KiB (1.00x; ncc) |
| bench-part-put (band 71.8%) | 37.0 KiB | -776 B (ncc) | -18.3 KiB (ncc) | 17.9 KiB (0.48x; ncc) | - | -9.7 KiB (ncc) | 328 B (0.01x; ncc) | 37.0 KiB (1.00x; ncc) |
| bench-encode (band 3007.7%) | -1.4 KiB | 7.3 KiB (ncc) | -46.5 KiB (ncc) | - | - | 27.0 KiB (ncc) | - | 17.4 KiB (ncc) |
| bench-body-1k (band 151.7%) | 12.8 KiB | 53.0 KiB (4.15x; ncc) | 46.3 KiB (3.63x; ncc) | -10.4 KiB (ncc) | - | - | -8.2 KiB (ncc) | 12.8 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 343.0%) | 849 B | 4.0 KiB (4.82x; ncc) | -3.2 KiB (ncc) | 4.1 KiB (4.92x; ncc) | -555 B (ncc) | 249 B (0.29x; ncc) | 20.1 KiB (24.30x; ncc) | 849 B (1.00x; ncc) |
| bench-part-put (band 104.9%) | 4.5 KiB | -1.1 KiB (ncc) | 25.6 KiB (5.72x; ncc) | 12.8 KiB (2.85x; ncc) | - | 7.1 KiB (1.59x; ncc) | 5.0 KiB (1.11x; ncc) | 4.5 KiB (1.00x; ncc) |
| bench-encode (band 220.6%) | 2.6 KiB | 3.7 KiB (1.42x; ncc) | 8.9 KiB (3.41x; ncc) | - | - | 11.7 KiB (4.48x; ncc) | - | 2.6 KiB (1.01x; ncc) |
| bench-body-1k (band 117.7%) | 5.0 KiB | -83 B (ncc) | 6.6 KiB (1.32x; ncc) | 2.9 KiB (0.58x; ncc) | - | - | -1.1 KiB (ncc) | 5.0 KiB (1.00x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 45.00 (7.50x; more) | 46.00 (7.67x; more) | 173 (28.83x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 10.00 | 50.00 (5.00x; more) | 31.00 (3.10x; more) | 49.00 (4.90x; more) | - | 90.00 (9.00x; more) | 22.00 (2.20x; more) | 10.00 (1.00x; ncc) |
| bench-encode (band 14.3%) | 14.00 | 48.00 (3.43x; more) | 33.00 (2.36x; more) | - | - | 94.00 (6.71x; more) | - | 14.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 27.00 (9.00x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 47.00 (15.67x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 5.00 | 26.00 (5.20x; more) | 14.00 (2.80x; more) | 23.00 (4.60x; more) | - | 43.00 (8.60x; more) | 15.00 (3.00x; more) | 5.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 29.00 (4.14x; more) | 17.00 (2.43x; more) | - | - | 49.00 (7.00x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 5.00 | 29.00 (5.80x; more) | 15.00 (3.00x; more) | 26.00 (5.20x; more) | - | - | 18.00 (3.60x; more) | 5.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 150.9%) | 0.34 ms | 15.55 ms (45.54x; more) | 3.25 ms (9.52x; more) | 17.63 ms (51.64x; more) | 28.38 ms (83.12x; more) | 42.34 ms (124.01x; more) | 21.09 ms (61.77x; more) | 0.34 ms (0.99x; ncc) |
| bench-part-put (band 79.8%) | 0.43 ms | 7.63 ms (17.59x; more) | 2.48 ms (5.72x; more) | 11.20 ms (25.84x; more) | - | 24.37 ms (56.22x; more) | 15.04 ms (34.70x; more) | 0.42 ms (0.97x; ncc) |
| bench-encode (band 42.9%) | 0.53 ms | 9.70 ms (18.42x; more) | 3.36 ms (6.38x; more) | - | - | 29.22 ms (55.48x; more) | - | 0.55 ms (1.04x; ncc) |
| bench-body-1k (band 76.2%) | 0.41 ms | 12.18 ms (30.01x; more) | 2.93 ms (7.23x; more) | 17.99 ms (44.34x; more) | - | - | 21.25 ms (52.38x; more) | 0.41 ms (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 132.5%) | 0.99 ms | 9.63 ms (9.68x; more) | 6.47 ms (6.50x; more) | 10.79 ms (10.85x; more) | 31.50 ms (31.67x; more) | 21.61 ms (21.73x; more) | 7.92 ms (7.96x; more) | 1.10 ms (1.11x; ncc) |
| bench-part-put (band 97.0%) | 1.59 ms | 9.02 ms (5.68x; more) | 5.17 ms (3.26x; more) | 9.14 ms (5.76x; more) | - | 14.20 ms (8.95x; more) | 6.58 ms (4.15x; more) | 1.85 ms (1.16x; ncc) |
| bench-encode (band 75.8%) | 2.13 ms | 9.32 ms (4.37x; more) | 6.30 ms (2.95x; more) | - | - | 14.22 ms (6.66x; more) | - | 2.21 ms (1.04x; ncc) |
| bench-body-1k (band 80.8%) | 1.55 ms | 8.66 ms (5.58x; more) | 5.11 ms (3.29x; more) | 10.06 ms (6.48x; more) | - | - | 8.53 ms (5.49x; more) | 1.46 ms (0.94x; ncc) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 40.1%) | 2.37 µs | 47.75 µs (20.19x; more) | 8.93 µs (3.78x; more) | 15.81 µs (6.69x; more) | 64.93 µs (27.45x; more) | 86.76 µs (36.68x; more) | 15.47 µs (6.54x; more) | 2.28 µs (0.96x; ncc) |
| bench-part-put (band 12.1%) | 2.20 µs | 39.42 µs (17.91x; more) | 9.58 µs (4.35x; more) | 13.79 µs (6.26x; more) | - | 75.00 µs (34.07x; more) | 13.31 µs (6.05x; more) | 2.21 µs (1.00x; ncc) |
| bench-encode (band 33.6%) | 2.72 µs | 38.76 µs (14.26x; more) | 11.18 µs (4.11x; more) | - | - | 80.09 µs (29.46x; more) | - | 2.54 µs (0.94x; ncc) |
| bench-body-1k (band 9.7%) | 2.57 µs | 41.57 µs (16.20x; more) | 8.46 µs (3.30x; more) | 15.07 µs (5.88x; more) | - | - | 15.01 µs (5.85x; more) | 2.60 µs (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 21.3%) | 2.36 µs | 28.62 µs (12.11x; more) | 12.66 µs (5.36x; more) | 18.03 µs (7.63x; more) | 47.48 µs (20.09x; more) | 75.31 µs (31.86x; more) | 10.00 µs (4.23x; more) | 2.35 µs (0.99x; ncc) |
| bench-part-put (band 42.7%) | 2.34 µs | 22.88 µs (9.80x; more) | 9.14 µs (3.91x; more) | 10.00 µs (4.28x; more) | - | 64.00 µs (27.41x; more) | 6.54 µs (2.80x; more) | 2.27 µs (0.97x; ncc) |
| bench-encode (band 33.6%) | 3.81 µs | 22.71 µs (5.96x; more) | 9.70 µs (2.54x; more) | - | - | 61.77 µs (16.21x; more) | - | 3.67 µs (0.96x; ncc) |
| bench-body-1k (band 24.5%) | 2.56 µs | 21.73 µs (8.50x; more) | 5.60 µs (2.19x; more) | 8.78 µs (3.43x; more) | - | - | 8.34 µs (3.26x; more) | 2.48 µs (0.97x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 8.1%) | 79.5 MiB | 98.5 MiB (1.24x; more) | 79.8 MiB (1.00x; ncc) | 80.9 MiB (1.02x; ncc) | 134.6 MiB (1.69x; more) | 94.5 MiB (1.19x; more) | 82.2 MiB (1.03x; ncc) | 80.5 MiB (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 6.2%) | 62.6 MiB | 65.9 MiB (1.05x; ncc) | 68.8 MiB (1.10x; ncc) | 72.5 MiB (1.16x; more) | 76.5 MiB (1.22x; more) | 72.5 MiB (1.16x; more) | 70.0 MiB (1.12x; ncc) | 61.9 MiB (0.99x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 329 B | - | - | - | - | - | - | 329 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 359 B | - | - | - | - | - | - | 359 B (1.00x; ncc) |
