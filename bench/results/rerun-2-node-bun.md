# Node and Bun pairing for the re-run before the next release

Every workload, metric and library measured on both runtimes, from the raw results in this directory (median, then min-max over the rounds; units are those of the metric: ns, bytes, ms or µs). Verdict: a runtime is ahead when its range is disjoint from the other's; otherwise the direction of the medians is given and the ranges overlap. Disposition (for rows where Node is ahead): see `rerun-2-notes.md`. Only [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (reading properties of a parsed URL) has been filed; nothing else has been reported to oven-sh/bun.

| part | metric | workload | library | Node | Bun | verdict | disposition |
|---|---|---|---|---|---|---|---|
| A | speed ns | bench-download | sigflint-A | 1,352 (1,318-1,377) | 1,600 (1,383-1,847) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-download | aws4fetch | 226,047 (224,016-227,306) | 208,565 (200,071-225,566) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-download | aws4 | 5,670 (5,627-5,929) | 6,079 (5,676-8,746) | Node ahead in median, ranges overlap | alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Node ahead in both admitted pairs (5,637 against 6,071 ns); only 2 admitted pairs, not settled at the 10-round cap; nothing filed with oven-sh/bun |
| A | speed ns | bench-download | smithy | 10,222 (9,578-10,418) | 9,223 (8,706-9,753) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-download | aws-sig | 58,209 (56,658-59,563) | 48,849 (41,237-50,631) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | wdl | 698,621 (678,018-703,816) | 581,903 (565,767-593,075) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | minio | 11,343 (11,277-11,656) | 7,291 (6,326-10,200) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | sigflint-B | 1,365 (1,330-1,379) | 1,488 (1,378-1,615) | Node ahead in median, ranges overlap | alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Bun ahead in the median over 3 admitted pairs (1,341 against 1,368 ns); noise, nothing to report |
| A | speed ns | bench-part-put | sigflint-A | 1,685 (1,655-1,797) | 2,065 (1,879-2,512) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-part-put | aws4fetch | 225,199 (217,242-230,259) | 210,791 (205,640-227,787) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-part-put | aws4 | 6,820 (6,739-6,883) | 8,257 (8,048-10,197) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| A | speed ns | bench-part-put | smithy | 10,716 (9,929-11,290) | 10,184 (10,116-12,812) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-part-put | wdl | 611,265 (588,810-621,350) | 553,085 (538,505-579,550) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | minio | 11,043 (10,998-11,132) | 7,916 (7,559-9,419) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | sigflint-B | 1,677 (1,659-1,710) | 1,992 (1,959-2,014) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-encode | sigflint-A | 2,217 (2,178-2,397) | 3,233 (2,649-3,620) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-encode | aws4fetch | 238,063 (230,021-239,265) | 218,265 (214,960-219,275) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | aws4 | 8,387 (7,951-8,442) | 10,106 (9,680-10,960) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| A | speed ns | bench-encode | wdl | 667,343 (664,254-684,233) | 588,316 (578,242-596,867) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | sigflint-B | 2,236 (2,190-2,320) | 3,140 (3,063-3,381) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-body-1k | sigflint-A | 2,407 (2,310-2,421) | 2,816 (2,699-3,120) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-body-1k | aws4fetch | 222,039 (216,172-247,174) | 213,210 (206,931-219,312) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws4 | 6,446 (6,181-6,493) | 7,392 (7,327-8,302) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| A | speed ns | bench-body-1k | smithy | 11,991 (11,150-12,061) | 10,279 (10,248-15,915) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | minio | 12,272 (12,115-12,730) | 8,337 (7,807-9,410) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | sigflint-B | 2,337 (2,335-2,447) | 2,779 (2,626-3,049) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| B | speed ns | any-post-json | sigflint | 1,783 (1,710-1,794) | 1,618 (1,559-1,839) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | any-token | sigflint | 1,590 (1,538-1,614) | 1,548 (1,392-1,573) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | any-query | sigflint | 1,845 (1,803-1,867) | 2,101 (1,850-2,466) | Node ahead in median, ranges overlap | alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Node ahead in all 3 admitted pairs (1,874 against 2,154 ns, +14.9%); only 3 admitted pairs, not settled at the 10-round cap; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| B | speed ns | presign-any | sigflint | 3,378 (3,352-3,458) | 4,683 (4,057-7,926) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| B | speed ns | presign-s3 | sigflint | 3,669 (3,579-3,763) | 5,001 (4,355-7,216) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| B | speed ns | sigv4a-header | sigflint | 14,953 (14,795-15,543) | 12,630 (12,350-13,639) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | sigv4a-presign | sigflint | 16,885 (16,558-17,892) | 15,451 (14,810-16,402) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | chunk-64k | sigflint | 32,825 (32,031-34,859) | 30,536 (29,633-35,677) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | chunk-end-trailer | sigflint | 3,098 (3,026-3,125) | 1,676 (1,581-1,820) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | event-4k | sigflint | 11,208 (10,937-11,823) | 11,253 (10,992-12,483) | Node ahead in median, ranges overlap | alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Node ahead in all 3 admitted pairs (11,150 against 12,272 ns, +10.1%); only 3 admitted pairs, not settled at the 10-round cap; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| B | speed ns | any-token | aws4 | 5,081 (4,927-5,252) | 4,268 (4,106-4,442) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4 | 6,321 (6,232-6,394) | 5,530 (5,348-6,991) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4 | 10,605 (10,564-11,338) | 11,153 (10,757-11,785) | Node ahead in median, ranges overlap | confirmed by alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Node ahead over 4 admitted pairs, ranges disjoint (11,151 against 14,465 ns, +29.7%); reduced reproduction and issue search not done; nothing filed with oven-sh/bun |
| B | speed ns | presign-s3 | aws4 | 10,927 (10,720-11,485) | 10,846 (10,836-11,698) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | any-post-json | aws4fetch | 315,965 (296,080-327,711) | 215,440 (199,273-218,234) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4fetch | 305,111 (282,786-309,708) | 210,644 (196,091-218,061) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4fetch | 306,108 (280,771-314,053) | 216,999 (201,532-218,268) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4fetch | 309,707 (294,564-336,632) | 234,217 (231,207-235,681) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | aws4fetch | 233,608 (231,507-248,495) | 231,048 (224,516-234,072) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | any-post-json | smithy | 11,439 (11,190-11,613) | 9,790 (9,511-10,504) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | smithy | 9,352 (9,234-9,726) | 8,618 (8,482-9,134) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | smithy | 10,612 (10,571-11,020) | 10,145 (9,905-11,090) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | presign-any | smithy | 11,700 (11,525-11,932) | 11,919 (11,837-12,980) | Node ahead in median, ranges overlap | confirmed by alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Node ahead over 4 admitted pairs, ranges disjoint (12,924 against 15,223 ns, +17.8%); reduced reproduction and issue search not done; nothing filed with oven-sh/bun |
| B | speed ns | presign-s3 | smithy | 12,256 (12,067-12,657) | 12,847 (12,366-13,299) | Node ahead in median, ranges overlap | confirmed by alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Node ahead over 4 admitted pairs, ranges disjoint (12,804 against 18,899 ns, +47.6%); reduced reproduction and issue search not done; nothing filed with oven-sh/bun |
| B | speed ns | any-post-json | aws-sig | 56,129 (54,961-62,725) | 37,148 (36,861-37,751) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws-sig | 55,360 (55,004-59,768) | 36,818 (36,579-37,833) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | wdl | 726,314 (697,088-740,510) | 578,482 (529,182-582,491) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | wdl | 725,935 (683,492-734,246) | 570,118 (524,824-590,239) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | minio | 13,442 (13,224-13,733) | 8,812 (8,609-12,927) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | sigflint-A | 3 (3-3) | 3 (3-4) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-download | aws4fetch | 254 (234-256) | 213 (194-216) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | aws4 | 11 (10-11) | 17 (16-17) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-download | smithy | 17 (17-18) | 26 (24-26) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-download | aws-sig | 74 (73-74) | 67 (66-72) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | wdl | 677 (674-680) | 577 (550-579) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | minio | 17 (16-17) | 15 (15-15) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | sigflint-A | 3 (3-3) | 3 (3-4) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-part-put | aws4fetch | 242 (222-243) | 209 (204-217) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | aws4 | 11 (10-11) | 13 (13-15) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-part-put | smithy | 15 (14-15) | 16 (15-16) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-part-put | wdl | 576 (567-590) | 563 (560-573) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | minio | 14 (14-14) | 11 (10-11) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | sigflint-A | 3 (3-3) | 5 (4-5) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-encode | aws4fetch | 240 (232-244) | 218 (207-222) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | aws4 | 12 (12-13) | 15 (14-16) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-encode | wdl | 671 (648-677) | 573 (562-581) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | sigflint-A | 3 (3-3) | 4 (4-5) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-body-1k | aws4fetch | 238 (228-246) | 211 (209-214) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws4 | 10 (9-10) | 10 (9-11) | Node ahead in median, ranges overlap | alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Bun ahead over 4 admitted pairs (8.18 against 9.86 µs); noise, nothing to report |
| C/D | cpuUs | bench-body-1k | smithy | 16 (16-16) | 16 (16-17) | Node ahead in median, ranges overlap | alternating samples ([rerun-2-alternating.md](rerun-2-alternating.md)): Bun ahead over 4 admitted pairs (14.64 against 16.49 µs); noise, nothing to report |
| C/D | cpuUs | bench-body-1k | minio | 16 (16-16) | 13 (12-13) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | sigflint-A | 111,386,624 (110,968,832-112,234,496) | 67,858,432 (67,588,096-68,476,928) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4fetch | 122,200,064 (121,962,496-123,654,144) | 72,732,672 (72,368,128-73,486,336) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4 | 111,636,480 (110,792,704-112,099,328) | 75,321,344 (74,137,600-77,225,984) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | smithy | 109,707,264 (109,391,872-109,801,472) | 77,848,576 (76,406,784-81,539,072) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws-sig | 166,309,888 (165,670,912-166,842,368) | 83,640,320 (83,304,448-84,983,808) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | wdl | 123,293,696 (122,998,784-123,957,248) | 78,225,408 (77,557,760-79,548,416) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | minio | 112,758,784 (112,115,712-113,074,176) | 74,301,440 (73,519,104-75,112,448) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | sigflint-A | 6 (6-6) | 3 (3-3) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | aws4fetch | 90 (90-90) | 27 (27-28) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | aws4 | 24 (24-24) | 14 (14-14) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | smithy | 44 (44-44) | 24 (24-24) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | aws-sig | 46 (46-46) | 80 (80-80) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcCount | bench-download | wdl | 174 (173-176) | 51 (50-52) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | minio | 19 (19-19) | 16 (16-16) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | sigflint-A | 10 (10-10) | 5 (5-5) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | aws4fetch | 51 (50-51) | 28 (27-28) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | aws4 | 31 (31-31) | 14 (14-14) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | smithy | 49 (49-49) | 23 (23-23) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | wdl | 90 (90-91) | 46 (45-47) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | minio | 22 (22-22) | 15 (15-15) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | sigflint-A | 13 (13-13) | 7 (7-7) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | aws4fetch | 48 (48-48) | 31 (30-31) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | aws4 | 33 (33-33) | 17 (17-17) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | wdl | 94 (94-94) | 53 (52-54) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | sigflint-A | 10 (10-10) | 5 (5-5) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | aws4fetch | 44 (44-44) | 30 (30-31) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | aws4 | 23 (23-23) | 15 (15-15) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | smithy | 45 (45-45) | 26 (26-26) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | minio | 20 (20-20) | 18 (18-18) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcMs | bench-download | sigflint-A | 1 (1-1) | 5 (5-7) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws4fetch | 32 (31-35) | 55 (51-64) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws4 | 7 (7-7) | 27 (26-29) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | smithy | 21 (19-22) | 50 (46-93) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws-sig | 34 (34-37) | 144 (140-163) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | wdl | 75 (72-76) | 118 (111-133) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | minio | 21 (20-23) | 31 (31-32) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | sigflint-A | 2 (1-2) | 9 (8-11) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4fetch | 20 (17-20) | 57 (55-62) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4 | 6 (6-6) | 26 (24-29) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | smithy | 16 (15-17) | 43 (43-46) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | wdl | 62 (59-68) | 139 (101-150) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | minio | 17 (16-17) | 28 (25-31) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | sigflint-A | 2 (2-2) | 12 (10-13) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | aws4fetch | 27 (25-31) | 66 (61-73) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | aws4 | 8 (7-8) | 31 (29-35) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | wdl | 63 (60-69) | 123 (116-130) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | sigflint-A | 1 (1-1) | 9 (8-10) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4fetch | 27 (24-32) | 63 (61-67) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4 | 6 (6-6) | 29 (25-29) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | smithy | 20 (19-21) | 48 (47-50) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | minio | 20 (20-22) | 34 (31-37) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | cacheEntry | - | sigflint-A | 341 (340-342) | 359 (357-359) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | allocBytes | bench-download | sigflint-A | 2,624 (2,608-2,625) | 1,426 (1,425-1,427) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | aws4fetch | 29,935 (29,935-30,038) | 15,487 (14,972-15,493) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | aws4 | 10,009 (10,009-10,009) | 6,583 (6,582-6,594) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | smithy | 18,279 (18,279-18,279) | 13,485 (13,469-13,524) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | aws-sig | 71,041 (71,039-71,047) | 49,043 (48,953-49,085) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | wdl | 59,408 (59,408-59,408) | 31,182 (30,731-31,222) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | minio | 8,477 (8,458-8,480) | 7,213 (7,211-7,214) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | sigflint-A | 4,048 (4,048-4,048) | 2,758 (2,758-2,759) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | aws4fetch | 32,860 (32,860-32,860) | 16,257 (16,238-16,368) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | aws4 | 12,863 (12,848-12,901) | 8,048 (8,045-8,056) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | smithy | 20,417 (20,416-20,422) | 14,353 (14,341-14,376) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | wdl | 61,286 (61,286-61,286) | 29,155 (28,581-29,750) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | minio | 9,075 (9,053-9,079) | 7,205 (7,202-7,209) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | sigflint-A | 5,632 (5,632-5,632) | 4,365 (4,364-4,366) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | aws4fetch | 33,710 (33,702-33,710) | 17,449 (17,404-18,000) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | aws4 | 13,798 (13,796-13,799) | 8,670 (8,666-8,680) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | wdl | 64,618 (64,575-64,729) | 32,212 (32,171-32,823) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | sigflint-A | 4,130 (4,130-4,130) | 2,634 (2,634-2,638) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | aws4fetch | 30,445 (30,445-30,445) | 17,308 (16,829-17,318) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | aws4 | 9,764 (9,760-9,768) | 7,836 (7,833-7,838) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | smithy | 18,859 (18,849-18,862) | 15,548 (15,504-15,574) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | minio | 8,691 (8,609-8,692) | 8,720 (8,718-8,724) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | importMs | - | sigflint-A | 1 (1-1) | 2 (2-2) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | importMs | - | aws4fetch | 1 (1-2) | 1 (1-1) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | aws4 | 2 (1-2) | 2 (2-2) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | importMs | - | smithy | 11 (11-11) | 9 (9-9) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | aws-sig | 3 (2-3) | 2 (2-2) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | importMs | - | wdl | 2 (2-2) | 2 (2-2) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | minio | 15 (15-17) | 19 (19-20) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | firstMs | - | sigflint-A | 2 (2-2) | 2 (2-2) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | firstMs | - | aws4fetch | 19 (16-19) | 3 (3-3) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws4 | 3 (3-3) | 3 (3-3) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | firstMs | - | smithy | 13 (13-13) | 11 (10-11) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws-sig | 9 (9-9) | 4 (4-4) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | wdl | 18 (17-18) | 4 (4-5) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | minio | 16 (16-18) | 19 (19-20) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
