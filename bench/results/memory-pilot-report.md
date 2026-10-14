Rows 292, accepted 242, rejected or error 0

### heap bytes allocated per call

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 2.4 KiB | 29.3 KiB (12.11x; more) | 9.8 KiB (4.03x; more) | 17.9 KiB (7.37x; more) | 69.4 KiB (28.64x; more) | 58.0 KiB (23.95x; more) | 8.3 KiB (3.41x; more) | 2.4 KiB (1.00x; ncc) |
| bench-part-put (band 6.0%) | 3.8 KiB | 32.1 KiB (8.54x; more) | 12.6 KiB (3.34x; more) | 19.9 KiB (5.30x; more) | - | 59.8 KiB (15.92x; more) | 8.8 KiB (2.35x; more) | 3.8 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 5.4 KiB | 32.9 KiB (6.14x; more) | 13.5 KiB (2.51x; more) | - | - | 63.2 KiB (11.79x; more) | - | 5.4 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 3.9 KiB | 29.7 KiB (7.64x; more) | 9.5 KiB (2.45x; more) | 18.3 KiB (4.69x; more) | - | - | 8.5 KiB (2.18x; more) | 3.9 KiB (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(6%, 2 x A/A range), absolute floor 64 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 6.0%) | 1.4 KiB | 15.1 KiB (11.12x; more) | 6.4 KiB (4.72x; more) | 13.2 KiB (9.69x; more) | 47.8 KiB (35.12x; more) | 30.5 KiB (22.46x; more) | 7.0 KiB (5.18x; more) | 1.4 KiB (0.99x; ncc) |
| bench-part-put (band 6.0%) | 2.7 KiB | 15.9 KiB (5.96x; more) | 7.9 KiB (2.95x; more) | 14.0 KiB (5.26x; more) | - | 29.6 KiB (11.11x; more) | 7.0 KiB (2.64x; more) | 2.7 KiB (1.00x; ncc) |
| bench-encode (band 6.0%) | 4.2 KiB | 17.0 KiB (4.06x; more) | 8.5 KiB (2.02x; more) | - | - | 32.5 KiB (7.74x; more) | - | 4.2 KiB (1.00x; ncc) |
| bench-body-1k (band 6.0%) | 2.5 KiB | 16.4 KiB (6.49x; more) | 7.7 KiB (3.02x; more) | 15.2 KiB (5.99x; more) | - | - | 8.5 KiB (3.37x; more) | 2.5 KiB (1.00x; ncc) |

### heap retained per 10,000 calls, second pass (forced GC)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 24.0 KiB | 186.4 KiB (7.75x; more) | 47.9 KiB (1.99x; ncc) | 48.4 KiB (2.01x; ncc) | 62.7 KiB (2.61x; ncc) | 108.1 KiB (4.49x; more) | 47.7 KiB (1.98x; ncc) | 23.8 KiB (0.99x; ncc) |
| bench-part-put (band 3.0%) | 27.0 KiB | -912 B (ncc) | -20.3 KiB (ncc) | 15.3 KiB (0.56x; ncc) | - | 1.3 KiB (0.05x; ncc) | 1.1 KiB (0.04x; ncc) | 37.8 KiB (1.40x; ncc) |
| bench-encode (band 3.0%) | 13.9 KiB | -1.0 KiB (ncc) | -44.3 KiB (ncc) | - | - | 16.4 KiB (1.19x; ncc) | - | 14.3 KiB (1.03x; ncc) |
| bench-body-1k (band 3.0%) | 21.5 KiB | 62.1 KiB (2.88x; ncc) | 14.0 KiB (0.65x; ncc) | -9.3 KiB (ncc) | - | - | -9.6 KiB (ncc) | 21.3 KiB (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 64.0 KiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 694 B | -266 B (ncc) | -4.4 KiB (ncc) | 3.1 KiB (4.60x; ncc) | -556 B (ncc) | -835 B (ncc) | 21.2 KiB (31.25x; ncc) | 662 B (0.95x; ncc) |
| bench-part-put (band 3.0%) | 1.8 KiB | 4.0 KiB (2.24x; ncc) | 25.6 KiB (14.19x; ncc) | -1.3 KiB (ncc) | - | 8.4 KiB (4.68x; ncc) | 5.0 KiB (2.75x; ncc) | 1.8 KiB (1.02x; ncc) |
| bench-encode (band 3.0%) | -403 B | -219.5 KiB (less) | 8.9 KiB (ncc) | - | - | 585 B (ncc) | - | -435 B (ncc) |
| bench-body-1k (band 3.0%) | 1.9 KiB | -84 B (ncc) | 6.6 KiB (3.43x; ncc) | 2.9 KiB (1.53x; ncc) | - | - | -1.1 KiB (ncc) | 509 B (0.26x; ncc) |

### collections per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 6.00 | 90.00 (15.00x; more) | 24.00 (4.00x; more) | 44.00 (7.33x; more) | 46.00 (7.67x; more) | 173 (28.83x; more) | 19.00 (3.17x; more) | 6.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 9.00 | 50.00 (5.56x; more) | 31.00 (3.44x; more) | 49.00 (5.44x; more) | - | 91.00 (10.11x; more) | 22.00 (2.44x; more) | 9.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 13.00 | 48.00 (3.69x; more) | 33.00 (2.54x; more) | - | - | 94.00 (7.23x; more) | - | 13.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 10.00 | 44.00 (4.40x; more) | 23.00 (2.30x; more) | 45.00 (4.50x; more) | - | - | 20.00 (2.00x; more) | 10.00 (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.00

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 3.00 | 28.00 (9.33x; more) | 14.00 (4.67x; more) | 24.00 (8.00x; more) | 80.00 (26.67x; more) | 51.00 (17.00x; more) | 16.00 (5.33x; more) | 3.00 (1.00x; ncc) |
| bench-part-put (band 3.0%) | 4.00 | 27.00 (6.75x; more) | 14.00 (3.50x; more) | 23.00 (5.75x; more) | - | 48.00 (12.00x; more) | 15.00 (3.75x; more) | 4.00 (1.00x; ncc) |
| bench-encode (band 3.0%) | 7.00 | 31.00 (4.43x; more) | 17.00 (2.43x; more) | - | - | 53.00 (7.57x; more) | - | 7.00 (1.00x; ncc) |
| bench-body-1k (band 3.0%) | 4.00 | 31.00 (7.75x; more) | 15.00 (3.75x; more) | 26.00 (6.50x; more) | - | - | 18.00 (4.50x; more) | 4.00 (1.00x; ncc) |

### GC pause per 10,000 calls

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 1.29 ms | 45.86 ms (35.57x; more) | 6.95 ms (5.39x; more) | 31.92 ms (24.76x; more) | 42.45 ms (32.92x; more) | 125 ms (96.91x; more) | 25.23 ms (19.57x; more) | 1.40 ms (1.09x; ncc) |
| bench-part-put (band 3.0%) | 1.69 ms | 28.37 ms (16.75x; more) | 7.51 ms (4.44x; more) | 14.02 ms (8.28x; more) | - | 101 ms (59.80x; more) | 19.69 ms (11.62x; more) | 1.75 ms (1.04x; ncc) |
| bench-encode (band 3.0%) | 1.83 ms | 43.66 ms (23.83x; more) | 8.60 ms (4.69x; more) | - | - | 112 ms (61.21x; more) | - | 1.77 ms (0.97x; ncc) |
| bench-body-1k (band 3.0%) | 1.70 ms | 36.42 ms (21.47x; more) | 6.12 ms (3.61x; more) | 26.96 ms (15.90x; more) | - | - | 25.37 ms (14.96x; more) | 1.68 ms (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 7.55 ms | 68.51 ms (9.07x; more) | 29.69 ms (3.93x; more) | 63.69 ms (8.43x; more) | 171 ms (22.65x; more) | 141 ms (18.66x; more) | 45.31 ms (6.00x; more) | 7.13 ms (0.94x; ncc) |
| bench-part-put (band 3.0%) | 8.36 ms | 67.73 ms (8.10x; more) | 35.46 ms (4.24x; more) | 62.12 ms (7.43x; more) | - | 116 ms (13.88x; more) | 43.99 ms (5.26x; more) | 8.50 ms (1.02x; ncc) |
| bench-encode (band 3.0%) | 14.68 ms | 74.18 ms (5.05x; more) | 35.28 ms (2.40x; more) | - | - | 140 ms (9.56x; more) | - | 14.35 ms (0.98x; ncc) |
| bench-body-1k (band 3.0%) | 8.14 ms | 75.18 ms (9.24x; more) | 33.11 ms (4.07x; more) | 56.21 ms (6.91x; more) | - | - | 49.95 ms (6.14x; more) | 9.52 ms (1.17x; more) |

### CPU time per call (user+system, whole process)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 2.57 µs | 254 µs (98.77x; more) | 10.58 µs (4.12x; more) | 22.72 µs (8.85x; more) | 80.24 µs (31.26x; more) | 786 µs (306.16x; more) | 17.58 µs (6.85x; more) | 2.66 µs (1.03x; ncc) |
| bench-part-put (band 3.0%) | 2.69 µs | 242 µs (90.14x; more) | 11.59 µs (4.32x; more) | 18.10 µs (6.73x; more) | - | 623 µs (231.74x; more) | 14.95 µs (5.56x; more) | 2.72 µs (1.01x; ncc) |
| bench-encode (band 3.0%) | 3.78 µs | 271 µs (71.69x; more) | 13.22 µs (3.50x; more) | - | - | 721 µs (190.63x; more) | - | 3.85 µs (1.02x; ncc) |
| bench-body-1k (band 3.0%) | 3.75 µs | 237 µs (63.19x; more) | 10.15 µs (2.71x; more) | 19.09 µs (5.09x; more) | - | - | 17.47 µs (4.66x; more) | 3.70 µs (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 0.10 µs

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| bench-download (band 3.0%) | 4.16 µs | 253 µs (60.84x; more) | 19.49 µs (4.69x; more) | 36.71 µs (8.83x; more) | 93.07 µs (22.39x; more) | 661 µs (159.08x; more) | 21.70 µs (5.22x; more) | 4.31 µs (1.04x; more) |
| bench-part-put (band 3.0%) | 3.35 µs | 256 µs (76.17x; more) | 21.30 µs (6.35x; more) | 26.73 µs (7.97x; more) | - | 585 µs (174.48x; more) | 17.66 µs (5.26x; more) | 3.96 µs (1.18x; more) |
| bench-encode (band 3.0%) | 5.40 µs | 250 µs (46.35x; more) | 20.88 µs (3.87x; more) | - | - | 640 µs (118.44x; more) | - | 5.99 µs (1.11x; more) |
| bench-body-1k (band 3.0%) | 4.38 µs | 240 µs (54.79x; more) | 14.45 µs (3.30x; more) | 20.73 µs (4.73x; more) | - | - | 18.79 µs (4.29x; more) | 5.12 µs (1.17x; more) |

### peak RSS of the whole process

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 115.5 MiB | 127.8 MiB (1.11x; more) | 116.7 MiB (1.01x; ncc) | 116.4 MiB (1.01x; ncc) | 165.6 MiB (1.43x; more) | 124.0 MiB (1.07x; more) | 114.3 MiB (0.99x; ncc) | 112.9 MiB (0.98x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 2.0 MiB

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 61.5 MiB | 69.9 MiB (1.14x; more) | 70.6 MiB (1.15x; more) | 69.6 MiB (1.13x; more) | 78.5 MiB (1.28x; more) | 74.1 MiB (1.20x; more) | 70.3 MiB (1.14x; more) | 61.9 MiB (1.01x; ncc) |

### import + client build

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 2.27 ms | 1.90 ms (0.84x; ncc) | 1.99 ms (0.88x; ncc) | 13.81 ms (6.09x; more) | 3.59 ms (1.58x; more) | 4.66 ms (2.06x; more) | 26.23 ms (11.56x; more) | 2.24 ms (0.99x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 1.57 ms | 1.57 ms (1.00x; ncc) | 2.39 ms (1.53x; ncc) | 10.49 ms (6.69x; more) | 3.06 ms (1.95x; more) | 1.67 ms (1.07x; ncc) | 20.80 ms (13.26x; more) | 1.55 ms (0.99x; ncc) |

### import + first signature

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 2.93 ms | 23.76 ms (8.12x; more) | 5.14 ms (1.76x; more) | 15.36 ms (5.25x; more) | 10.43 ms (3.56x; more) | 30.07 ms (10.27x; more) | 27.24 ms (9.30x; more) | 2.71 ms (0.93x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 1.00 ms

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 2.07 ms | 4.23 ms (2.05x; more) | 3.24 ms (1.57x; more) | 11.99 ms (5.80x; more) | 4.89 ms (2.36x; more) | 4.58 ms (2.21x; more) | 21.30 ms (10.30x; more) | 2.10 ms (1.01x; ncc) |

### heap per cached signing key (slope 0 to 1,000 entries)

node: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 339 B | - | - | - | - | - | - | 339 B (1.00x; ncc) |

bun: median over rounds (n per cell in the JSON); verdict vs sigflint-A, band = max(3%, 2 x A/A range), absolute floor 5 B

| workload | sigflint-A | aws4fetch | aws4 | smithy | aws-sig | wdl | minio | sigflint-B |
|---|---|---|---|---|---|---|---|---|
| - (band 3.0%) | 357 B | - | - | - | - | - | - | 357 B (1.00x; ncc) |
