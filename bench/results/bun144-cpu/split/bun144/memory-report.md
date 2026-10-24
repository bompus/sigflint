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
| bench-download (band 6.0%) | 1.4 KiB | 14.6 KiB (10.45x; more) | 6.4 KiB (4.59x; more) | 13.1 KiB (9.37x; more) | 47.8 KiB (34.12x; more) | 28.3 KiB (20.21x; more) | 7.0 KiB (5.02x; more) | 1.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.3 KiB (5.67x; more) | 7.9 KiB (2.90x; more) | 14.0 KiB (5.16x; more) | - | 27.9 KiB (10.30x; more) | 7.0 KiB (2.59x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.3 KiB | 16.6 KiB (3.88x; more) | 8.5 KiB (1.99x; more) | - | - | 30.7 KiB (7.19x; more) | - | 4.3 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.6 KiB | 16.5 KiB (6.38x; more) | 7.7 KiB (2.96x; more) | 15.1 KiB (5.85x; more) | - | - | 8.5 KiB (3.30x; more) | 2.6 KiB (1.00x; ncc) |

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
| bench-download (band 344.6%) | 910 B | 3.8 KiB (4.28x; ncc) | -4.0 KiB (ncc) | 5.6 KiB (6.35x; ncc) | -590 B (ncc) | -4.1 KiB (ncc) | 20.0 KiB (22.46x; ncc) | 910 B (1.00x; ncc) |
| bench-part-put (band 82.0%) | 9.0 KiB | -1.5 KiB (ncc) | 29.3 KiB (3.24x; ncc) | 8.3 KiB (0.92x; ncc) | - | 12.5 KiB (1.39x; ncc) | 4.5 KiB (0.50x; ncc) | 9.2 KiB (1.01x; ncc) |
| bench-encode (band 244.8%) | 2.7 KiB | 3.2 KiB (1.20x; ncc) | 12.4 KiB (4.60x; ncc) | - | - | 585 B (0.21x; ncc) | - | 2.4 KiB (0.88x; ncc) |
| bench-body-1k (band 3.0%) | 2.1 KiB | -2.0 KiB (ncc) | 1.2 KiB (0.58x; ncc) | 1.4 KiB (0.70x; ncc) | - | - | -1.1 KiB (ncc) | 2.1 KiB (1.00x; ncc) |

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
| bench-encode (band 3.0%) | 7.00 | 30.00 (4.29x; more) | 17.00 (2.43x; more) | - | - | 49.00 (7.00x; more) | - | 7.00 (1.00x; ncc) |
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
| bench-download (band 82.1%) | 1.03 ms | 9.95 ms (9.68x; more) | 6.03 ms (5.87x; more) | 10.56 ms (10.27x; more) | 29.86 ms (29.04x; more) | 21.41 ms (20.83x; more) | 7.80 ms (7.59x; more) | 0.92 ms (0.89x; ncc) |
| bench-part-put (band 108.7%) | 1.64 ms | 7.60 ms (4.64x; more) | 5.52 ms (3.37x; more) | 10.01 ms (6.12x; more) | - | 11.68 ms (7.14x; more) | 6.85 ms (4.19x; more) | 1.64 ms (1.00x; ncc) |
| bench-encode (band 73.9%) | 2.16 ms | 11.06 ms (5.12x; more) | 6.27 ms (2.90x; more) | - | - | 17.48 ms (8.10x; more) | - | 2.14 ms (0.99x; ncc) |
| bench-body-1k (band 120.5%) | 1.46 ms | 6.73 ms (4.61x; more) | 5.44 ms (3.72x; more) | 10.89 ms (7.46x; more) | - | - | 8.27 ms (5.67x; more) | 1.47 ms (1.00x; ncc) |

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
| bench-download (band 18.6%) | 2.12 µs | 28.82 µs (13.60x; more) | 12.14 µs (5.73x; more) | 17.56 µs (8.29x; more) | 45.89 µs (21.65x; more) | 66.20 µs (31.24x; more) | 8.90 µs (4.20x; more) | 2.13 µs (1.01x; ncc) |
| bench-part-put (band 39.3%) | 2.01 µs | 22.61 µs (11.27x; more) | 8.67 µs (4.32x; more) | 9.37 µs (4.67x; more) | - | 58.90 µs (29.35x; more) | 5.42 µs (2.70x; more) | 2.20 µs (1.10x; ncc) |
| bench-encode (band 17.1%) | 3.82 µs | 22.97 µs (6.02x; more) | 9.19 µs (2.41x; more) | - | - | 60.95 µs (15.97x; more) | - | 3.78 µs (0.99x; ncc) |
| bench-body-1k (band 13.9%) | 2.08 µs | 22.10 µs (10.62x; more) | 4.99 µs (2.40x; more) | 8.79 µs (4.22x; more) | - | - | 7.45 µs (3.58x; more) | 2.10 µs (1.01x; ncc) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 8.1%) | 79.5 MiB | 98.5 MiB (1.24x; more) | 79.8 MiB (1.00x; ncc) | 80.9 MiB (1.02x; ncc) | 134.6 MiB (1.69x; more) | 94.5 MiB (1.19x; more) | 82.2 MiB (1.03x; ncc) | 80.5 MiB (1.01x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 4.7%) | 64.6 MiB | 66.3 MiB (1.03x; ncc) | 68.1 MiB (1.05x; ncc) | 74.4 MiB (1.15x; more) | 77.4 MiB (1.20x; more) | 73.6 MiB (1.14x; more) | 68.2 MiB (1.06x; ncc) | 64.0 MiB (0.99x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 329 B | - | - | - | - | - | - | 329 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 360 B | - | - | - | - | - | - | 359 B (1.00x; ncc) |
