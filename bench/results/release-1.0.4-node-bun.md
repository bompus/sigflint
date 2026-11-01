# Node and Bun pairing for the admitted-pair re-run

Every workload, metric and library measured on both runtimes, from the raw results in this directory (median, then min-max over the rounds; units are those of the metric: ns, bytes, ms or µs). Verdict: a runtime is ahead when its range is disjoint from the other's; otherwise the direction of the medians is given and the ranges overlap. Disposition (for rows where Node is ahead): see the pairing section of `rerun-3-notes.md`. Nothing has been filed, edited or commented on at oven-sh/bun from this run. The Node-against-Bun comparison is not closed: every row marked "no disposition yet" is open, and a row with overlapping ranges needs alternating samples before it is called a gap or noise. Earlier reports, which this run does not change: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (reading properties of a parsed URL) covers part of a sigflint speed gap; [oven-sh/bun#45699](https://github.com/oven-sh/bun/issues/45699) (`crypto.hash`) and [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (`encodeURIComponent`) are single calls compared on their own and not shown to explain any sigflint gap.

| part | metric | workload | library | Node | Bun | verdict | disposition |
|---|---|---|---|---|---|---|---|
| A | speed ns | bench-body-1k | tiny-oss | 49,778 (49,651-49,905) | 22,940 (22,483-23,396) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | s3-lite-client | 63,249 (59,617-66,881) | 54,298 (53,357-55,238) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | sigflint-A | 1,678 (1,669-1,686) | 1,326 (1,299-1,352) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws4fetch | 27,281 (25,268-29,294) | 19,382 (17,431-21,332) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws4 | 5,193 (5,156-5,229) | 3,679 (3,635-3,722) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | smithy | 9,221 (9,062-9,379) | 6,243 (6,130-6,356) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws-sig | 58,055 (57,673-58,437) | 42,066 (41,685-42,447) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | wdl | 73,952 (70,354-77,549) | 65,384 (62,894-67,873) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | minio | 11,060 (10,967-11,153) | 4,351 (4,271-4,430) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | sigflint-B | 1,674 (1,670-1,677) | 1,255 (1,246-1,264) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | tiny-oss | 51,773 (51,521-52,025) | 22,930 (22,673-23,187) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | lean-s3 | 3,443 (3,428-3,457) | 1,917 (1,916-1,917) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | s3-lite-client | 65,813 (64,238-67,388) | 50,281 (50,083-50,479) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | sigflint-A | 990 (983-997) | 649 (644-654) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws4fetch | 26,029 (24,643-27,414) | 17,179 (16,408-17,950) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws4 | 4,879 (4,870-4,888) | 3,428 (3,369-3,487) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | smithy | 8,727 (8,547-8,906) | 5,166 (5,124-5,208) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws-sig | 49,272 (49,038-49,505) | 30,220 (30,058-30,382) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | wdl | 72,983 (71,261-74,704) | 56,410 (51,409-61,410) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | minio | 10,636 (10,563-10,708) | 3,622 (3,621-3,623) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | sigflint-B | 963 (958-968) | 650 (642-658) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | lean-s3 | 4,441 (4,415-4,467) | 2,982 (2,978-2,986) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | s3-lite-client | 73,561 (64,391-82,731) | 55,740 (54,040-57,439) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | sigflint-A | 1,710 (1,706-1,714) | 1,511 (1,508-1,514) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | aws4fetch | 26,687 (26,263-27,111) | 19,522 (18,409-20,635) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | aws4 | 7,077 (7,039-7,114) | 5,425 (5,413-5,437) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | wdl | 81,839 (71,442-92,235) | 60,831 (60,462-61,200) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | sigflint-B | 1,707 (1,687-1,726) | 1,571 (1,559-1,583) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | s3mini | 26,926 (23,215-30,636) | 19,136 (19,120-19,152) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | tiny-oss | 46,715 (46,298-47,132) | 22,081 (21,814-22,347) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | lean-s3 | 3,320 (3,262-3,378) | 2,045 (2,043-2,046) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | s3-lite-client | 67,061 (65,491-68,630) | 54,338 (53,125-55,551) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | sigflint-A | 1,269 (1,267-1,271) | 921 (908-933) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | aws4fetch | 27,487 (25,736-29,237) | 18,743 (17,236-20,249) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | aws4 | 5,802 (5,775-5,829) | 4,308 (4,299-4,316) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | smithy | 8,882 (8,837-8,927) | 6,087 (6,065-6,109) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | wdl | 64,143 (62,673-65,613) | 58,554 (57,178-59,929) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | minio | 10,005 (9,844-10,165) | 3,739 (3,729-3,749) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | sigflint-B | 1,271 (1,265-1,277) | 921 (908-934) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | sigflint | 1,329 (1,292-1,346) | 879 (871-894) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | sigflint | 1,435 (1,424-1,463) | 1,140 (1,123-1,167) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | sigflint | 1,160 (1,155-1,181) | 763 (754-773) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | chunk-64k | sigflint | 36,933 (36,796-37,150) | 17,826 (17,771-17,943) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | chunk-end-trailer | sigflint | 2,130 (2,110-2,136) | 834 (827-851) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | event-4k | sigflint | 8,830 (8,821-8,957) | 8,138 (8,127-8,292) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | sigflint | 2,880 (2,860-2,901) | 2,788 (2,725-2,852) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | sigflint | 3,091 (3,081-3,124) | 2,992 (2,966-3,196) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | sigv4a-header | sigflint | 16,844 (16,801-16,961) | 15,056 (15,034-15,735) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | sigv4a-presign | sigflint | 18,482 (18,294-18,881) | 17,163 (16,988-17,617) | Bun ahead, ranges disjoint | none needed (Node not ahead); its presigner also calls `encodeURIComponent`, reported separately in [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (not shown to explain any gap) |
| B | speed ns | any-post-json | aws-sig | 48,475 (48,001-48,949) | 30,366 (30,239-30,492) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws-sig | 47,734 (47,643-47,824) | 32,156 (31,474-32,838) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4 | 5,651 (5,622-5,679) | 4,082 (4,043-4,120) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4 | 4,339 (4,278-4,400) | 2,815 (2,813-2,817) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4 | 9,675 (9,595-9,755) | 8,493 (8,435-8,550) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | aws4 | 9,966 (9,950-9,981) | 8,577 (8,482-8,671) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | aws4fetch | 32,161 (31,454-32,868) | 18,803 (17,497-20,108) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4fetch | 30,083 (28,067-32,099) | 20,272 (18,524-22,019) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4fetch | 28,576 (27,507-29,644) | 18,970 (17,187-20,753) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4fetch | 39,485 (37,103-41,866) | 26,125 (24,326-27,924) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | aws4fetch | 33,473 (31,218-35,727) | 26,163 (24,091-28,234) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | minio | 12,065 (11,981-12,148) | 6,186 (6,016-6,356) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | smithy | 9,847 (9,679-10,014) | 6,688 (6,655-6,720) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | smithy | 9,639 (9,549-9,728) | 7,596 (7,351-7,841) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | smithy | 8,481 (8,360-8,601) | 6,024 (6,013-6,034) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | smithy | 10,740 (10,643-10,836) | 9,197 (8,930-9,463) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | smithy | 11,195 (10,827-11,562) | 9,314 (9,163-9,464) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | wdl | 69,295 (64,225-74,364) | 54,606 (53,136-56,076) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | wdl | 74,243 (73,815-74,670) | 53,867 (53,583-54,150) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | sigflint-A | 2,624 (2,609-2,625) | 1,440 (1,435-1,441) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | aws4fetch | 30,038 (30,028-30,045) | 14,986 (14,979-15,024) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | aws4 | 10,009 (10,009-10,013) | 6,594 (6,590-6,627) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | smithy | 18,299 (18,299-18,299) | 13,675 (13,670-13,688) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | aws-sig | 71,944 (71,938-71,947) | 49,203 (49,101-49,655) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | wdl | 59,408 (59,408-59,408) | 28,992 (28,971-29,045) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | minio | 8,530 (8,495-8,542) | 7,247 (7,244-7,254) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | tiny-oss | 48,981 (48,981-48,982) | 47,268 (47,236-47,310) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | lean-s3 | 6,385 (6,385-6,385) | 3,465 (3,454-3,822) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-download | s3-lite-client | 49,763 (49,758-49,774) | 16,549 (16,511-16,639) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | sigflint-A | 4,048 (4,048-4,048) | 2,777 (2,768-2,778) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | aws4fetch | 32,912 (32,911-32,912) | 15,724 (15,720-15,783) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | aws4 | 12,846 (12,841-12,901) | 8,097 (8,077-8,121) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | smithy | 20,497 (20,497-20,501) | 14,029 (13,997-14,584) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | wdl | 61,278 (61,273-61,288) | 28,082 (28,033-28,612) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | minio | 9,115 (9,115-9,115) | 7,257 (7,249-7,259) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | s3mini | 30,201 (30,197-30,223) | 12,760 (12,748-12,791) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | tiny-oss | 50,372 (50,372-50,379) | 46,941 (46,922-46,960) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | lean-s3 | 6,363 (6,362-6,363) | 3,710 (3,701-3,718) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-part-put | s3-lite-client | 51,920 (51,918-51,920) | 18,236 (17,989-18,461) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | sigflint-A | 5,632 (5,632-5,633) | 4,393 (4,384-4,396) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | aws4fetch | 33,580 (33,579-33,583) | 16,931 (16,909-16,966) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | aws4 | 13,800 (13,797-13,802) | 8,691 (8,667-8,720) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | wdl | 64,570 (64,569-64,730) | 31,332 (31,310-31,444) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | lean-s3 | 7,251 (7,251-7,253) | 4,364 (4,359-4,380) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-encode | s3-lite-client | 52,942 (52,942-52,944) | 19,144 (19,110-19,163) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | sigflint-A | 4,145 (4,130-4,146) | 2,660 (2,653-2,661) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | aws4fetch | 30,415 (30,413-30,419) | 16,831 (16,827-16,893) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | aws4 | 9,761 (9,751-9,793) | 7,838 (7,818-7,867) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | smithy | 18,729 (18,725-18,885) | 15,286 (15,252-15,318) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | aws-sig | 92,654 (92,653-92,663) | 68,909 (68,730-69,014) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | wdl | 59,950 (59,943-59,958) | 30,168 (30,125-30,774) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | minio | 8,635 (8,634-8,637) | 8,759 (8,740-8,762) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | allocBytes | bench-body-1k | tiny-oss | 49,582 (49,579-49,584) | 48,667 (48,610-48,785) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | allocBytes | bench-body-1k | s3-lite-client | 49,814 (49,803-49,996) | 18,446 (18,419-18,467) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | cpuUs | bench-download | sigflint-A | 2.30 (1.96-2.31) | 2.00 (1.98-2.04) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | aws4fetch | 47.29 (45.56-48.31) | 23.69 (22.77-23.94) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | aws4 | 8.33 (8.20-8.35) | 11.00 (10.42-11.88) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | cpuUs | bench-download | smithy | 15.01 (14.75-15.31) | 17.18 (16.90-18.61) | Node ahead, ranges disjoint | no disposition yet: was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-download | aws-sig | 64.46 (64.28-65.20) | 46.93 (44.55-47.19) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | wdl | 85.70 (82.87-91.51) | 73.51 (65.49-76.37) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | minio | 14.62 (14.21-14.65) | 8.92 (8.86-9.04) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | tiny-oss | 80.21 (78.25-81.63) | 31.37 (31.23-31.54) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | lean-s3 | 5.18 (5.10-5.68) | 6.92 (6.78-7.26) | Node ahead, ranges disjoint | no disposition yet: not in the earlier table in the earlier run; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-download | s3-lite-client | 74.60 (72.80-76.36) | 63.46 (56.82-68.60) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | sigflint-A | 2.13 (2.11-2.15) | 2.01 (1.81-2.07) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | aws4fetch | 39.36 (38.08-44.10) | 22.35 (21.73-24.11) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | aws4 | 9.04 (8.97-9.18) | 8.64 (8.20-8.76) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | smithy | 13.28 (13.03-13.92) | 11.28 (10.20-11.67) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | wdl | 75.66 (70.68-77.20) | 67.78 (58.26-76.64) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | minio | 12.83 (12.11-13.12) | 5.37 (5.23-5.51) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | s3mini | 25.91 (25.54-27.58) | 30.31 (27.79-31.88) | Node ahead, ranges disjoint | no disposition yet: not in the earlier table in the earlier run; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-part-put | tiny-oss | 73.63 (69.53-74.35) | 27.74 (27.41-28.23) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | lean-s3 | 4.49 (4.43-4.53) | 3.16 (3.13-3.21) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | s3-lite-client | 66.54 (65.05-67.72) | 68.71 (59.35-69.91) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-encode | sigflint-A | 2.61 (2.37-2.74) | 3.71 (3.26-3.84) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | cpuUs | bench-encode | aws4fetch | 37.63 (37.11-38.78) | 22.49 (22.12-24.00) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | aws4 | 9.84 (9.82-9.94) | 8.41 (8.02-8.46) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | wdl | 75.93 (71.19-81.71) | 64.81 (56.95-76.00) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | lean-s3 | 6.29 (6.17-6.37) | 4.06 (3.78-4.09) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | s3-lite-client | 70.25 (68.98-72.06) | 60.68 (56.38-67.24) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | sigflint-A | 2.49 (2.47-2.52) | 2.09 (1.97-2.12) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws4fetch | 39.05 (37.72-41.30) | 22.23 (20.83-22.26) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws4 | 8.02 (7.80-8.28) | 5.05 (4.84-5.11) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | smithy | 14.16 (14.08-14.33) | 8.47 (8.10-8.54) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws-sig | 72.53 (72.29-75.50) | 52.61 (50.00-52.94) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | wdl | 77.17 (73.50-80.31) | 73.87 (60.00-76.44) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | minio | 14.91 (14.02-15.29) | 7.07 (6.92-7.31) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | tiny-oss | 78.17 (75.65-82.05) | 28.28 (28.12-28.95) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | s3-lite-client | 68.79 (66.66-70.65) | 56.93 (53.38-64.24) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | sigflint-A | 6.00 (6.00-6.00) | 3.00 (3.00-3.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | aws4fetch | 90.00 (90.00-91.00) | 27.00 (27.00-27.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | aws4 | 24.00 (24.00-24.00) | 14.00 (14.00-14.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | smithy | 44.00 (44.00-45.00) | 24.00 (24.00-24.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | aws-sig | 49.00 (49.00-49.00) | 80.00 (80.00-80.00) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcCount | bench-download | wdl | 167 (166-169) | 47.00 (47.00-47.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | minio | 19.00 (19.00-19.00) | 16.00 (16.00-16.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | tiny-oss | 118 (118-118) | 79.00 (79.00-79.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | lean-s3 | 15.00 (15.00-15.00) | 9.00 (9.00-9.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-download | s3-lite-client | 151 (151-151) | 30.50 (30.00-31.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | sigflint-A | 10.00 (10.00-10.00) | 5.00 (5.00-5.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | aws4fetch | 48.00 (48.00-48.00) | 26.00 (26.00-26.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | aws4 | 31.00 (31.00-31.00) | 14.00 (14.00-14.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | smithy | 49.00 (49.00-49.00) | 23.00 (23.00-23.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | wdl | 90.00 (90.00-90.00) | 43.00 (43.00-44.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | minio | 22.00 (22.00-22.00) | 15.00 (15.00-15.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | s3mini | 89.00 (89.00-89.00) | 20.00 (20.00-20.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | tiny-oss | 121 (121-121) | 75.00 (75.00-75.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | lean-s3 | 14.00 (14.00-14.00) | 8.00 (8.00-8.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-part-put | s3-lite-client | 77.00 (77.00-77.00) | 30.00 (30.00-30.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | sigflint-A | 14.00 (14.00-14.00) | 7.00 (7.00-7.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | aws4fetch | 48.00 (48.00-48.00) | 30.00 (30.00-30.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | aws4 | 33.00 (33.00-33.00) | 17.00 (17.00-17.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | wdl | 94.00 (94.00-95.00) | 49.00 (49.00-50.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | lean-s3 | 18.00 (18.00-18.00) | 9.00 (9.00-9.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-encode | s3-lite-client | 78.50 (78.00-79.00) | 33.00 (33.00-34.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | sigflint-A | 10.00 (10.00-10.00) | 5.00 (5.00-5.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | aws4fetch | 44.00 (44.00-44.00) | 29.00 (29.00-29.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | aws4 | 23.00 (23.00-23.00) | 15.00 (15.00-15.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | smithy | 45.00 (45.00-45.00) | 26.00 (26.00-26.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | aws-sig | 62.00 (62.00-62.00) | 110 (110-110) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcCount | bench-body-1k | wdl | 87.00 (87.00-87.00) | 47.00 (47.00-48.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | minio | 20.00 (20.00-20.00) | 18.00 (18.00-18.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | tiny-oss | 119 (119-119) | 79.00 (79.00-79.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcCount | bench-body-1k | s3-lite-client | 74.00 (74.00-74.00) | 32.00 (32.00-33.00) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | sigflint-A | 0.30 (0.26-0.75) | 1.05 (0.84-1.15) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws4fetch | 14.56 (14.07-17.38) | 8.32 (6.26-11.10) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | aws4 | 3.12 (2.94-3.28) | 5.97 (5.55-6.59) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | smithy | 16.68 (16.17-19.83) | 10.60 (10.00-11.63) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | aws-sig | 28.88 (28.08-31.16) | 32.01 (25.66-32.55) | Node ahead in median, ranges overlap | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | wdl | 39.94 (36.54-44.68) | 25.31 (23.07-26.68) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | minio | 20.05 (16.39-21.65) | 8.29 (7.65-8.92) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-download | tiny-oss | 7.45 (7.06-7.55) | 34.06 (33.42-35.40) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | lean-s3 | 1.84 (1.70-2.15) | 3.36 (3.06-4.16) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | s3-lite-client | 43.21 (33.82-44.19) | 13.63 (10.61-15.73) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | sigflint-A | 0.43 (0.39-0.60) | 1.53 (1.48-1.64) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4fetch | 6.99 (4.12-8.96) | 7.59 (4.61-8.07) | Node ahead in median, ranges overlap | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4 | 2.49 (2.44-2.69) | 5.72 (4.88-5.74) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | smithy | 12.86 (9.91-14.06) | 9.51 (9.02-10.94) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | wdl | 27.23 (11.26-39.59) | 14.34 (10.30-20.39) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | minio | 13.49 (7.54-14.78) | 7.32 (7.18-7.98) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | s3mini | 9.70 (9.17-10.61) | 7.82 (6.93-10.21) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-part-put | tiny-oss | 5.10 (4.82-5.73) | 33.25 (31.99-34.70) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | lean-s3 | 0.87 (0.82-0.91) | 3.00 (2.54-3.29) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | s3-lite-client | 27.24 (12.18-32.37) | 14.45 (11.95-16.83) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-encode | sigflint-A | 0.50 (0.48-0.62) | 2.12 (1.92-2.35) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | aws4fetch | 14.25 (12.28-14.35) | 9.85 (6.75-12.56) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-encode | aws4 | 3.25 (3.18-3.32) | 6.69 (6.32-7.04) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | wdl | 32.58 (17.18-43.37) | 17.24 (11.98-18.96) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-encode | lean-s3 | 1.90 (1.86-1.94) | 3.26 (2.87-3.36) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | s3-lite-client | 39.00 (28.13-45.34) | 12.61 (10.59-15.70) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | sigflint-A | 0.40 (0.40-0.43) | 1.81 (1.53-1.95) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4fetch | 13.96 (12.07-16.02) | 8.42 (5.95-11.47) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | aws4 | 2.88 (2.78-2.95) | 5.25 (4.92-5.85) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | smithy | 16.71 (16.01-17.16) | 10.25 (9.50-11.05) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | aws-sig | 29.08 (28.19-31.54) | 43.50 (35.18-47.48) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | wdl | 29.98 (24.60-39.21) | 21.42 (12.73-27.48) | Bun ahead in median, ranges overlap | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | minio | 22.06 (13.37-23.25) | 7.99 (7.78-9.15) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | gcMs | bench-body-1k | tiny-oss | 7.62 (7.23-7.76) | 35.43 (33.84-37.37) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | s3-lite-client | 43.74 (26.48-45.01) | 12.92 (9.23-14.10) | Bun ahead, ranges disjoint | no cross-runtime finding: the two runtimes use different instruments, so the direction is not a result |
| C/D | maxRss | - | sigflint-A | 117,260,288 (115,519,488-117,841,920) | 77,361,152 (71,806,976-77,635,584) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4fetch | 132,874,240 (131,907,584-133,332,992) | 73,822,208 (71,708,672-78,069,760) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4 | 115,281,920 (115,040,256-115,830,784) | 78,225,408 (76,480,512-81,805,312) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | smithy | 116,408,320 (115,449,856-116,891,648) | 85,159,936 (84,357,120-88,080,384) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws-sig | 174,485,504 (173,576,192-175,312,896) | 89,378,816 (88,485,888-93,413,376) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | wdl | 126,672,896 (126,246,912-127,008,768) | 87,400,448 (81,788,928-91,385,856) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | minio | 118,202,368 (117,706,752-118,439,936) | 78,581,760 (77,242,368-84,205,568) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | s3mini | 112,963,584 (112,250,880-113,139,712) | 81,240,064 (78,573,568-85,291,008) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | tiny-oss | 124,715,008 (123,731,968-125,497,344) | 68,919,296 (68,206,592-72,941,568) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | lean-s3 | 110,751,744 (110,280,704-111,042,560) | 69,390,336 (68,915,200-75,214,848) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | s3-lite-client | 129,349,632 (128,495,616-129,892,352) | 72,015,872 (71,032,832-76,378,112) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cacheEntry | - | sigflint-A | 329 (327-329) | 360 (357-360) | Node ahead, ranges disjoint | Warm-up CPU observation retained; submission blocked pending current reduced reproduction, issue search and public-text approval. |
| C/D | firstMs | - | sigflint-A | 2.12 (1.69-2.80) | 1.43 (1.38-2.04) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | firstMs | - | aws4fetch | 18.42 (17.75-19.06) | 2.22 (1.77-2.77) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws4 | 3.23 (2.81-4.27) | 2.46 (1.56-2.93) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | firstMs | - | smithy | 11.31 (11.04-11.60) | 10.21 (9.62-10.43) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws-sig | 8.02 (7.53-9.38) | 3.04 (2.85-3.46) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | wdl | 18.59 (18.14-19.79) | 3.55 (2.67-3.78) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | minio | 16.65 (15.88-18.32) | 15.15 (14.48-15.74) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | s3mini | 7.45 (6.81-8.48) | 3.44 (2.68-3.69) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | tiny-oss | 2.93 (2.75-3.85) | 1.88 (1.03-3.05) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | firstMs | - | lean-s3 | 1.67 (1.10-3.07) | 1.08 (0.86-1.14) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | firstMs | - | s3-lite-client | 17.37 (16.28-17.93) | 2.99 (2.14-3.43) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
