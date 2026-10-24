| row | Bun | rounds | Node median (min-max) µs | Bun median (min-max) µs | Node lower in | verdict |
|---|---|--:|---|---|--:|---|
| aws4 bench-body-1k | bun143 | 5 | 8.46 (8.29-8.52) | 5.60 (5.17-5.73) | 0 of 5 | shown to be noise (not Node ahead) |
| aws4 bench-body-1k | bun144 | 5 | 8.46 (8.29-8.52) | 4.99 (4.98-5.14) | 0 of 5 | shown to be noise (not Node ahead) |
| aws-sig bench-download | bun143 | 5 | 64.93 (64.45-66.74) | 47.48 (43.12-47.90) | 0 of 5 | shown to be noise (not Node ahead) |
| aws-sig bench-download | bun144 | 5 | 64.93 (64.45-66.74) | 45.89 (40.82-46.84) | 0 of 5 | shown to be noise (not Node ahead) |
| smithy bench-body-1k | bun143 | 5 | 15.07 (14.59-15.83) | 8.78 (8.66-8.87) | 0 of 5 | shown to be noise (not Node ahead) |
| smithy bench-body-1k | bun144 | 5 | 15.07 (14.59-15.83) | 8.79 (8.19-9.05) | 0 of 5 | shown to be noise (not Node ahead) |
| aws4 bench-download | bun143 | 5 | 8.93 (8.82-9.08) | 12.66 (11.85-13.09) | 5 of 5 | confirmed Node ahead |
| aws4 bench-download | bun144 | 5 | 8.93 (8.82-9.08) | 12.14 (11.86-12.78) | 5 of 5 | confirmed Node ahead |
| smithy bench-download | bun143 | 5 | 15.81 (15.46-16.15) | 18.03 (17.22-19.11) | 5 of 5 | confirmed Node ahead |
| smithy bench-download | bun144 | 5 | 15.81 (15.46-16.15) | 17.56 (14.99-18.91) | 4 of 5 | unsettled |
| sigflint-A bench-part-put | bun143 | 5 | 2.20 (2.16-2.27) | 2.34 (2.25-2.50) | 5 of 5 | unsettled |
| sigflint-A bench-part-put | bun144 | 5 | 2.20 (2.16-2.27) | 2.01 (1.76-2.15) | 0 of 5 | shown to be noise (not Node ahead) |
| sigflint-A bench-encode | bun143 | 5 | 2.72 (2.49-2.85) | 3.81 (3.52-4.16) | 5 of 5 | confirmed Node ahead |
| sigflint-A bench-encode | bun144 | 5 | 2.72 (2.49-2.85) | 3.82 (3.56-3.86) | 5 of 5 | confirmed Node ahead |
