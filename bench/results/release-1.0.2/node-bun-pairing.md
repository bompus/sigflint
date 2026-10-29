# Node and Bun pairing for the admitted-pair re-run

Node 26.12.1 against Bun 1.4.4, on the release 1.0.2 artifacts. Every workload, metric and library measured on both runtimes is listed below with its median and min-max range. These descriptive runtime verdicts use disjoint ranges; they are not the library-comparison reporting bands. Different allocation/GC instruments do not establish a cross-runtime finding.

The two disjoint Node CPU advantages (`aws4` plain GET and sigflint encoded GET) repeat the warm-up-window observation already investigated in `docs/benchmarks.md`; the new run does not independently attribute that cost. No new Bun issue was submitted. Upstream submission is blocked pending a current reduced reproduction, issue search and approval of its exact public text; those are outside this release assignment. Overlapping results remain inconclusive under the existing cap. The comparison is open for that follow-up, not silently marked explained or closed.

| part | metric | workload | library | Node | Bun | verdict | disposition |
|---|---|---|---|---|---|---|---|
| A | speed ns | bench-body-1k | sigflint-A | 1,661 (1,659-1,661) | 1,247 (1,247-1,253) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws4fetch | 26,943 (24,086-27,429) | 20,039 (17,613-21,975) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws4 | 5,375 (5,358-5,385) | 3,708 (3,693-3,993) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | smithy | 9,802 (9,730-10,026) | 6,111 (6,097-6,334) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | minio | 11,306 (11,226-11,389) | 4,143 (4,137-4,164) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | sigflint-B | 1,660 (1,658-1,708) | 1,274 (1,250-1,334) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | sigflint-A | 967 (967-991) | 656 (651-659) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws4fetch | 24,667 (24,367-27,551) | 19,132 (17,471-19,162) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws4 | 5,107 (5,077-5,128) | 3,392 (3,363-3,513) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | smithy | 8,792 (8,604-8,997) | 5,053 (5,049-5,075) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws-sig | 47,177 (47,109-51,129) | 30,207 (30,068-30,351) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | wdl | 72,432 (61,376-91,088) | 45,778 (44,295-56,025) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | minio | 10,291 (10,288-10,373) | 3,506 (3,486-3,672) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | sigflint-B | 970 (968-986) | 652 (651-657) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | sigflint-A | 1,686 (1,676-1,705) | 1,512 (1,504-1,520) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | aws4fetch | 26,943 (26,315-27,636) | 20,860 (18,310-22,554) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | aws4 | 7,277 (7,239-7,318) | 5,509 (5,474-6,025) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | wdl | 72,843 (71,127-76,232) | 55,574 (45,679-55,581) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | sigflint-B | 1,717 (1,683-1,736) | 1,528 (1,526-1,574) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | sigflint-A | 1,255 (1,254-1,259) | 965 (962-968) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | aws4fetch | 27,118 (24,475-29,912) | 19,273 (18,948-19,877) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | aws4 | 6,060 (6,006-6,096) | 4,279 (4,267-4,633) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | smithy | 9,097 (9,027-9,168) | 6,006 (5,977-6,088) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | wdl | 65,973 (60,506-67,580) | 49,801 (45,148-54,085) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | minio | 10,052 (10,024-10,424) | 3,799 (3,771-3,904) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | sigflint-B | 1,271 (1,252-1,286) | 951 (949-964) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | sigflint | 1,308 (1,306-1,326) | 887 (879-903) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | sigflint | 1,423 (1,412-1,448) | 1,150 (1,135-1,156) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | sigflint | 1,155 (1,153-1,163) | 775 (772-826) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | chunk-64k | sigflint | 35,616 (30,691-35,899) | 17,326 (16,687-17,947) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | chunk-end-trailer | sigflint | 2,336 (2,303-2,368) | 829 (825-851) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | event-4k | sigflint | 9,168 (9,088-9,294) | 8,078 (8,052-8,096) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | sigflint | 2,969 (2,883-2,990) | 2,752 (2,735-2,784) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | sigflint | 3,180 (3,109-3,286) | 2,985 (2,942-3,050) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | sigv4a-header | sigflint | 16,976 (16,912-17,164) | 15,080 (15,060-15,216) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | sigv4a-presign | sigflint | 18,606 (18,588-18,726) | 17,003 (16,940-17,041) | Bun ahead, ranges disjoint | none needed (Node not ahead); its presigner also calls `encodeURIComponent`, reported separately in [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (not shown to explain any gap) |
| B | speed ns | any-post-json | aws-sig | 48,641 (48,523-48,717) | 30,199 (30,070-30,225) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws-sig | 49,814 (48,820-49,821) | 31,327 (31,320-31,565) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4 | 5,736 (5,690-5,740) | 3,867 (3,863-3,928) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4 | 4,448 (4,409-4,501) | 2,767 (2,760-2,769) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4 | 9,919 (9,908-9,951) | 8,385 (8,327-8,477) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | aws4 | 10,210 (10,153-10,262) | 8,421 (8,374-8,438) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | aws4fetch | 32,354 (32,186-33,406) | 17,452 (17,252-19,671) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4fetch | 30,444 (29,924-31,502) | 19,041 (18,314-20,615) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4fetch | 30,126 (28,975-30,304) | 18,032 (17,566-19,110) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4fetch | 43,872 (39,509-49,821) | 24,701 (24,321-26,425) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | aws4fetch | 35,531 (32,711-40,671) | 26,046 (24,011-26,119) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | minio | 12,550 (12,364-12,859) | 5,958 (5,815-6,094) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | smithy | 10,357 (10,325-10,538) | 6,356 (6,317-6,387) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | smithy | 9,942 (9,505-10,034) | 7,227 (6,992-7,411) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | smithy | 8,737 (8,562-8,926) | 5,834 (5,760-5,997) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | smithy | 10,523 (10,443-11,039) | 9,041 (9,002-9,170) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | smithy | 11,099 (10,964-11,187) | 9,377 (9,347-9,399) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | wdl | 73,976 (73,615-80,830) | 56,862 (47,355-58,954) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | wdl | 74,120 (71,093-74,684) | 53,058 (52,736-53,840) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | sigflint-A | 2,625 (2,609-2,625) | 1,434 (1,432-1,441) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | aws4fetch | 30,029 (29,998-30,038) | 14,979 (14,975-14,988) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | aws4 | 10,009 (10,009-10,012) | 6,589 (6,583-6,591) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | smithy | 18,277 (18,277-18,277) | 13,456 (13,452-13,459) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | aws-sig | 71,052 (71,046-71,053) | 48,962 (48,931-49,076) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | wdl | 59,408 (59,408-59,408) | 28,966 (28,948-28,988) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | minio | 8,466 (8,421-8,477) | 7,221 (7,216-7,222) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | sigflint-A | 4,048 (4,048-4,048) | 2,770 (2,768-2,770) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | aws4fetch | 32,896 (32,860-32,897) | 15,709 (15,708-15,737) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | aws4 | 12,843 (12,841-12,897) | 8,046 (8,044-8,054) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | smithy | 20,423 (20,423-20,425) | 14,296 (14,293-14,310) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | wdl | 61,276 (61,273-61,278) | 28,537 (27,956-28,557) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | minio | 9,051 (9,051-9,055) | 7,193 (7,190-7,196) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | sigflint-A | 5,632 (5,632-5,633) | 4,369 (4,369-4,373) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | aws4fetch | 33,567 (33,545-33,567) | 16,941 (16,922-16,973) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | aws4 | 13,805 (13,797-13,809) | 8,671 (8,667-8,681) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | wdl | 64,570 (64,569-64,570) | 31,375 (31,370-31,985) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | sigflint-A | 4,130 (4,129-4,137) | 2,643 (2,641-2,643) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | aws4fetch | 30,402 (30,396-30,450) | 16,855 (16,842-17,272) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | aws4 | 9,792 (9,777-9,803) | 7,841 (7,815-7,848) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | smithy | 18,690 (18,688-18,691) | 15,485 (15,462-15,497) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | minio | 8,651 (8,611-8,689) | 8,726 (8,720-8,727) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | cpuUs | bench-download | sigflint-A | 2.17 (2.11-2.28) | 2.05 (1.98-2.12) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | aws4fetch | 46.80 (46.57-48.19) | 28.65 (27.08-31.34) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | aws4 | 8.84 (8.77-8.90) | 11.59 (10.86-11.87) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | cpuUs | bench-download | smithy | 15.46 (14.99-15.58) | 16.74 (15.03-18.07) | Node ahead in median, ranges overlap | Inconclusive under the declared cap; no new samples selected. |
| C/D | cpuUs | bench-download | aws-sig | 64.41 (63.48-65.42) | 46.61 (46.24-46.68) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | wdl | 84.88 (84.22-86.10) | 70.09 (68.49-72.70) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | minio | 14.71 (14.36-14.94) | 8.85 (8.35-8.98) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | sigflint-A | 2.20 (2.14-2.24) | 1.95 (1.83-2.12) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | aws4fetch | 39.36 (38.31-39.73) | 22.53 (21.81-25.48) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | aws4 | 9.50 (9.41-9.52) | 8.59 (8.27-8.74) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | smithy | 13.53 (13.49-13.69) | 9.35 (8.70-11.62) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | wdl | 75.86 (73.03-79.08) | 72.44 (61.82-74.68) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | minio | 12.57 (12.38-13.73) | 5.42 (5.17-5.54) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | sigflint-A | 2.59 (2.24-2.82) | 3.74 (3.39-3.81) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | cpuUs | bench-encode | aws4fetch | 37.66 (37.32-38.40) | 21.55 (20.61-22.52) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | aws4 | 11.11 (11.03-11.12) | 9.30 (8.81-9.50) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | wdl | 77.89 (75.56-81.17) | 63.00 (58.48-72.10) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | sigflint-A | 2.55 (2.50-2.56) | 2.09 (1.98-2.11) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws4fetch | 37.52 (37.14-37.83) | 20.45 (20.20-20.92) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws4 | 8.39 (8.25-8.42) | 5.09 (5.03-5.12) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | smithy | 14.89 (14.36-15.15) | 8.33 (8.11-8.70) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | minio | 15.03 (15.00-15.83) | 7.31 (7.22-7.62) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | sigflint-A | 6.00 (6.00-6.00) | 3.00 (3.00-3.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | aws4fetch | 90.00 (90.00-90.00) | 27.00 (27.00-27.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | aws4 | 24.00 (24.00-24.00) | 14.00 (14.00-14.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | smithy | 45.00 (44.00-45.00) | 24.00 (24.00-24.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | aws-sig | 46.00 (46.00-46.00) | 80.00 (80.00-81.00) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcCount | bench-download | wdl | 174 (171-174) | 47.00 (47.00-47.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | minio | 19.00 (19.00-19.00) | 16.00 (16.00-16.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | sigflint-A | 10.00 (10.00-10.00) | 5.00 (5.00-5.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | aws4fetch | 50.00 (48.00-51.00) | 26.00 (26.00-26.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | aws4 | 31.00 (31.00-31.00) | 14.00 (14.00-14.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | smithy | 49.00 (49.00-49.00) | 23.00 (23.00-23.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | wdl | 90.00 (90.00-90.00) | 43.00 (43.00-43.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | minio | 22.00 (22.00-22.00) | 15.00 (15.00-15.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | sigflint-A | 14.00 (14.00-14.00) | 7.00 (7.00-7.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | aws4fetch | 48.00 (48.00-48.00) | 30.00 (29.00-30.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | aws4 | 33.00 (33.00-33.00) | 17.00 (17.00-17.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | wdl | 94.00 (94.00-94.00) | 49.00 (49.00-50.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | sigflint-A | 10.00 (10.00-10.00) | 5.00 (5.00-5.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | aws4fetch | 44.00 (44.00-44.00) | 29.00 (29.00-29.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | aws4 | 23.00 (23.00-23.00) | 15.00 (15.00-15.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | smithy | 45.00 (45.00-45.00) | 26.00 (26.00-26.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | minio | 20.00 (20.00-20.00) | 18.00 (18.00-18.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | sigflint-A | 0.49 (0.30-0.51) | 0.99 (0.80-1.29) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws4fetch | 16.56 (16.19-17.10) | 8.62 (7.40-9.19) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | aws4 | 3.27 (3.07-3.43) | 5.97 (5.14-6.49) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | smithy | 17.55 (15.01-18.26) | 11.00 (10.47-11.64) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | aws-sig | 26.65 (26.15-28.60) | 30.38 (27.11-32.99) | Node ahead in median, ranges overlap | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | wdl | 36.47 (33.84-38.46) | 19.97 (16.29-24.86) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | minio | 17.75 (14.81-19.64) | 8.44 (7.74-8.83) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | sigflint-A | 0.40 (0.39-0.62) | 1.68 (1.50-2.04) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4fetch | 6.72 (3.73-6.91) | 5.75 (4.61-12.39) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | aws4 | 2.47 (2.41-2.71) | 4.82 (4.68-5.18) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | smithy | 11.37 (11.14-12.45) | 9.32 (8.95-10.24) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | wdl | 22.22 (18.21-31.90) | 13.26 (10.67-17.20) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | minio | 8.22 (7.27-17.09) | 6.99 (6.96-8.22) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-encode | sigflint-A | 0.51 (0.48-0.64) | 2.20 (1.95-2.50) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | aws4fetch | 8.21 (5.17-9.30) | 5.32 (5.01-12.28) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-encode | aws4 | 3.33 (3.26-3.50) | 5.91 (5.54-6.18) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | wdl | 20.88 (11.61-30.77) | 19.38 (16.23-22.43) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | sigflint-A | 0.40 (0.37-0.42) | 1.47 (1.36-2.04) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4fetch | 4.90 (4.34-7.92) | 6.24 (5.56-8.60) | Node ahead in median, ranges overlap | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4 | 2.85 (2.84-3.03) | 5.16 (5.07-5.61) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | smithy | 18.15 (15.10-18.82) | 10.06 (9.34-11.35) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | minio | 22.60 (20.08-25.46) | 8.26 (7.81-8.87) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | maxRss | - | sigflint-A | 91,017,216 (90,472,448-91,856,896) | 72,744,960 (72,130,560-73,306,112) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4fetch | 108,548,096 (107,995,136-108,900,352) | 73,154,560 (71,561,216-74,522,624) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4 | 90,443,776 (89,559,040-90,611,712) | 76,832,768 (76,341,248-77,586,432) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | smithy | 91,451,392 (90,943,488-91,676,672) | 82,833,408 (80,900,096-86,171,648) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws-sig | 147,816,448 (146,419,712-148,422,656) | 87,252,992 (87,007,232-89,198,592) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | wdl | 104,787,968 (104,349,696-105,357,312) | 86,151,168 (85,057,536-86,384,640) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | minio | 92,745,728 (92,254,208-93,143,040) | 76,820,480 (76,374,016-77,955,072) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cacheEntry | - | sigflint-A | 329 (329-329) | 359 (357-360) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | importMs | - | sigflint-A | 0.98 (0.98-0.99) | 1.45 (1.25-1.47) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | importMs | - | aws4fetch | 1.27 (1.26-1.28) | 0.91 (0.88-0.93) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | aws4 | 1.57 (1.16-1.63) | 1.79 (1.76-1.83) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | importMs | - | smithy | 9.28 (9.20-9.45) | 8.45 (8.39-8.49) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | aws-sig | 2.18 (2.16-2.25) | 1.73 (1.68-1.75) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | wdl | 1.68 (1.66-2.10) | 1.35 (1.27-1.36) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | minio | 14.53 (14.49-14.68) | 14.53 (14.51-14.83) | Node ahead in median, ranges overlap | Inconclusive under the declared cap; no new samples selected. |
| C/D | firstMs | - | sigflint-A | 2.20 (2.15-2.21) | 1.89 (1.70-1.94) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws4fetch | 17.23 (17.05-17.47) | 2.77 (2.58-2.90) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws4 | 3.01 (2.97-3.08) | 2.48 (2.46-2.53) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | smithy | 10.79 (10.69-10.98) | 9.59 (9.53-9.63) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws-sig | 7.94 (7.93-8.06) | 3.33 (3.31-3.47) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | wdl | 17.19 (17.05-17.36) | 3.47 (3.28-3.71) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | minio | 15.58 (15.50-15.71) | 14.94 (14.91-15.24) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
