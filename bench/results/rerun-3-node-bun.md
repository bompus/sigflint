# Node and Bun pairing for the admitted-pair re-run

Every workload, metric and library measured on both runtimes, from the raw results in this directory (median, then min-max over the rounds; units are those of the metric: ns, bytes, ms or µs). Verdict: a runtime is ahead when its range is disjoint from the other's; otherwise the direction of the medians is given and the ranges overlap. Disposition (for rows where Node is ahead): see the pairing section of `rerun-3-notes.md`. Nothing has been filed, edited or commented on at oven-sh/bun from this run. The Node-against-Bun comparison is not closed: every row marked "no disposition yet" is open, and a row with overlapping ranges needs alternating samples before it is called a gap or noise. Earlier reports, which this run does not change: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (reading properties of a parsed URL) covers part of a sigflint speed gap; [oven-sh/bun#45699](https://github.com/oven-sh/bun/issues/45699) (`crypto.hash`) and [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (`encodeURIComponent`) are single calls compared on their own and not shown to explain any sigflint gap.

| part | metric | workload | library | Node | Bun | verdict | disposition |
|---|---|---|---|---|---|---|---|
| A | speed ns | bench-body-1k | sigflint-A | 2,306 (2,300-2,327) | 2,580 (2,461-2,872) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-body-1k | aws4fetch | 216,900 (216,350-218,251) | 215,717 (204,898-218,579) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | aws4 | 6,293 (5,930-6,459) | 7,803 (6,645-8,694) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| A | speed ns | bench-body-1k | smithy | 11,174 (10,715-11,254) | 9,416 (9,160-12,062) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | minio | 11,711 (11,709-12,263) | 8,010 (7,209-8,352) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-body-1k | sigflint-B | 2,312 (2,295-2,338) | 2,527 (2,462-2,540) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-download | sigflint-A | 1,313 (1,305-1,329) | 1,378 (1,310-1,401) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead, ranges disjoint in the earlier run; nothing filed with oven-sh/bun |
| A | speed ns | bench-download | aws4fetch | 232,630 (224,274-237,064) | 212,788 (200,465-221,002) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | aws4 | 5,564 (5,563-5,694) | 5,831 (5,307-6,861) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| A | speed ns | bench-download | smithy | 9,633 (9,476-10,071) | 9,203 (7,524-10,164) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-download | aws-sig | 55,464 (55,400-56,870) | 38,646 (36,578-42,571) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | wdl | 724,935 (722,445-736,173) | 580,137 (531,162-581,079) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | minio | 10,917 (10,784-11,152) | 6,989 (6,057-6,994) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-download | sigflint-B | 1,303 (1,299-1,334) | 1,376 (1,277-1,582) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| A | speed ns | bench-encode | sigflint-A | 2,206 (2,151-2,236) | 2,674 (2,601-2,768) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-encode | aws4fetch | 235,226 (232,025-239,376) | 224,291 (219,926-226,453) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | aws4 | 7,967 (7,754-8,269) | 9,721 (8,659-10,874) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| A | speed ns | bench-encode | wdl | 720,208 (711,335-722,231) | 559,727 (550,540-574,612) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-encode | sigflint-B | 2,153 (2,140-2,160) | 2,493 (2,467-2,843) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-part-put | sigflint-A | 1,640 (1,618-1,655) | 1,974 (1,744-2,051) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| A | speed ns | bench-part-put | aws4fetch | 223,889 (222,841-233,309) | 208,188 (202,229-215,261) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | aws4 | 6,658 (6,643-6,773) | 8,036 (6,525-8,249) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead, ranges disjoint in the earlier run; nothing filed with oven-sh/bun |
| A | speed ns | bench-part-put | smithy | 9,899 (9,779-10,469) | 8,536 (8,392-10,683) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| A | speed ns | bench-part-put | wdl | 618,062 (574,584-637,174) | 540,056 (536,884-572,831) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | minio | 10,705 (10,701-11,071) | 7,399 (6,193-8,013) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| A | speed ns | bench-part-put | sigflint-B | 1,671 (1,641-1,683) | 1,713 (1,710-1,826) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads) |
| B | speed ns | any-post-json | sigflint | 1,753 (1,731-1,893) | 1,657 (1,546-2,005) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | any-query | sigflint | 1,852 (1,805-1,894) | 2,122 (1,835-2,576) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun; the URL property reads of [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) are among the calls it makes, not shown to explain any difference |
| B | speed ns | any-token | sigflint | 1,573 (1,542-1,609) | 1,483 (1,426-1,795) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | chunk-64k | sigflint | 32,472 (31,868-32,913) | 31,062 (30,235-32,461) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | chunk-end-trailer | sigflint | 2,968 (2,902-3,028) | 1,825 (1,618-2,339) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | event-4k | sigflint | 11,226 (10,949-11,784) | 11,659 (11,110-12,842) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun; the URL property reads of [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) are among the calls it makes, not shown to explain any difference |
| B | speed ns | presign-any | sigflint | 3,382 (3,304-3,451) | 4,553 (3,993-6,171) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads); related, not shown to explain any of the gap: [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (`encodeURIComponent` on the credential string and session token) |
| B | speed ns | presign-s3 | sigflint | 3,644 (3,573-3,737) | 5,017 (4,319-7,075) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row; part of the gap, not shown to be all of it: [oven-sh/bun#45627](https://github.com/oven-sh/bun/issues/45627) (URL property reads); related, not shown to explain any of the gap: [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (`encodeURIComponent` on the credential string and session token) |
| B | speed ns | sigv4a-header | sigflint | 15,070 (14,718-15,483) | 13,349 (12,735-14,098) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | sigv4a-presign | sigflint | 17,018 (16,453-17,242) | 16,625 (15,516-17,422) | Bun ahead in median, ranges overlap | none needed (Node not ahead); its presigner also calls `encodeURIComponent`, reported separately in [oven-sh/bun#45700](https://github.com/oven-sh/bun/issues/45700) (not shown to explain any gap) |
| B | speed ns | any-post-json | aws-sig | 54,660 (54,330-56,661) | 37,907 (36,624-47,949) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws-sig | 55,257 (53,891-57,901) | 38,141 (37,276-42,843) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4 | 6,309 (6,244-6,475) | 5,510 (5,389-5,802) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4 | 4,933 (4,864-5,093) | 4,341 (4,177-4,414) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4 | 10,670 (10,608-11,124) | 11,606 (10,746-12,898) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap, confirmed by alternating samples in the earlier run; nothing filed with oven-sh/bun |
| B | speed ns | presign-s3 | aws4 | 10,820 (10,763-11,532) | 11,139 (10,543-13,805) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Bun ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| B | speed ns | any-post-json | aws4fetch | 322,637 (301,374-336,655) | 213,912 (201,364-219,410) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | aws4fetch | 291,202 (278,167-308,422) | 218,652 (206,003-222,448) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | aws4fetch | 287,889 (287,360-306,502) | 213,623 (202,059-216,825) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-any | aws4fetch | 322,654 (298,327-330,576) | 231,090 (220,885-240,560) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | presign-s3 | aws4fetch | 237,951 (227,018-250,892) | 217,380 (215,591-238,779) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | presign-s3 | minio | 13,420 (13,225-14,032) | 9,309 (8,622-9,740) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-post-json | smithy | 11,204 (11,085-11,439) | 9,741 (9,543-10,468) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-query | smithy | 10,642 (10,518-11,105) | 10,155 (9,926-10,776) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | any-token | smithy | 9,561 (9,478-9,725) | 8,947 (8,620-9,854) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| B | speed ns | presign-any | smithy | 11,655 (11,363-12,569) | 12,211 (11,747-12,828) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap, confirmed by alternating samples in the earlier run; nothing filed with oven-sh/bun |
| B | speed ns | presign-s3 | smithy | 12,339 (12,170-12,536) | 12,765 (12,613-14,630) | Node ahead, ranges disjoint | no disposition yet: was Node ahead in median, ranges overlap, confirmed by alternating samples in the earlier run; nothing filed with oven-sh/bun |
| B | speed ns | any-query | wdl | 692,495 (669,151-740,303) | 579,741 (543,720-597,330) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| B | speed ns | any-token | wdl | 732,318 (673,371-750,031) | 550,540 (536,488-588,936) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | sigflint-A | 2,625 (2,624-2,625) | 1,426 (1,425-1,427) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | aws4fetch | 30,038 (29,935-30,038) | 15,482 (14,990-15,489) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | aws4 | 10,009 (10,009-10,009) | 6,586 (6,581-6,592) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | smithy | 18,279 (18,276-18,279) | 13,485 (13,475-13,511) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | aws-sig | 71,046 (71,036-71,052) | 48,913 (48,895-49,030) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | wdl | 59,408 (59,408-59,408) | 30,618 (30,035-30,681) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-download | minio | 8,467 (8,431-8,477) | 7,214 (7,211-7,218) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | sigflint-A | 4,048 (4,048-4,048) | 2,758 (2,758-2,759) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | aws4fetch | 32,860 (32,860-32,860) | 16,255 (16,242-16,261) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | aws4 | 12,846 (12,843-12,864) | 8,047 (8,044-8,052) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | smithy | 20,421 (20,418-20,423) | 14,346 (14,343-14,383) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | wdl | 61,286 (61,286-61,286) | 29,735 (29,584-30,313) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-part-put | minio | 9,062 (9,051-9,062) | 7,207 (7,202-7,211) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | sigflint-A | 5,632 (5,632-5,633) | 4,366 (4,366-4,367) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | aws4fetch | 33,710 (33,550-33,710) | 17,374 (16,945-17,485) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | aws4 | 13,797 (13,794-13,797) | 8,674 (8,668-8,677) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-encode | wdl | 64,729 (64,569-64,729) | 32,241 (31,923-33,666) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | sigflint-A | 4,130 (4,129-4,136) | 2,635 (2,634-2,637) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | aws4fetch | 30,445 (30,445-30,445) | 16,845 (16,809-17,284) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | aws4 | 9,761 (9,761-9,762) | 7,837 (7,828-7,840) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | smithy | 18,852 (18,848-18,856) | 15,526 (15,500-15,555) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | allocBytes | bench-body-1k | minio | 8,689 (8,610-8,690) | 8,723 (8,715-8,727) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | cpuUs | bench-download | sigflint-A | 3 (2-3) | 3 (3-4) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-download | aws4fetch | 244 (237-255) | 213 (204-214) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | aws4 | 10 (10-11) | 16 (15-17) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-download | smithy | 17 (17-18) | 24 (22-25) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-download | aws-sig | 76 (74-77) | 72 (68-78) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | wdl | 641 (632-648) | 547 (536-559) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-download | minio | 17 (16-17) | 15 (15-16) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | sigflint-A | 3 (3-3) | 4 (3-4) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-part-put | aws4fetch | 227 (221-237) | 212 (199-214) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | aws4 | 11 (10-11) | 14 (13-16) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-part-put | smithy | 15 (14-15) | 16 (15-17) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead, ranges disjoint in the earlier run; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-part-put | wdl | 576 (545-583) | 556 (541-587) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | cpuUs | bench-part-put | minio | 14 (14-15) | 11 (11-12) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | sigflint-A | 3 (3-4) | 5 (4-5) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-encode | aws4fetch | 227 (226-244) | 217 (214-217) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-encode | aws4 | 12 (12-13) | 15 (14-19) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-encode | wdl | 646 (627-677) | 558 (541-563) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | sigflint-A | 3 (3-3) | 4 (4-4) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | cpuUs | bench-body-1k | aws4fetch | 237 (226-244) | 209 (196-211) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cpuUs | bench-body-1k | aws4 | 10 (9-10) | 10 (10-13) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-body-1k | smithy | 16 (16-16) | 18 (17-19) | Node ahead, ranges disjoint | no disposition yet: was Node ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| C/D | cpuUs | bench-body-1k | minio | 16 (16-17) | 13 (13-14) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | sigflint-A | 6 (6-6) | 3 (3-3) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | aws4fetch | 90 (90-90) | 28 (27-28) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | aws4 | 24 (24-24) | 14 (14-14) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | smithy | 44 (44-44) | 24 (24-24) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | aws-sig | 46 (46-46) | 80 (80-80) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcCount | bench-download | wdl | 175 (172-176) | 49 (48-50) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-download | minio | 19 (19-19) | 16 (16-16) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | sigflint-A | 10 (10-10) | 5 (5-5) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | aws4fetch | 51 (50-51) | 27 (27-27) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | aws4 | 31 (31-31) | 14 (14-14) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | smithy | 49 (49-49) | 23 (23-23) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | wdl | 91 (90-91) | 45 (44-46) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-part-put | minio | 22 (22-22) | 15 (15-15) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | sigflint-A | 13 (13-13) | 7 (7-7) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | aws4fetch | 48 (48-48) | 31 (30-31) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | aws4 | 33 (33-33) | 17 (17-17) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-encode | wdl | 94 (94-94) | 53 (52-54) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | sigflint-A | 10 (10-10) | 5 (5-5) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | aws4fetch | 44 (44-44) | 30 (29-31) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | aws4 | 23 (23-23) | 15 (15-15) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | smithy | 45 (45-45) | 26 (26-26) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcCount | bench-body-1k | minio | 20 (20-20) | 18 (18-18) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | gcMs | bench-download | sigflint-A | 1 (1-1) | 5 (5-6) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws4fetch | 33 (30-33) | 57 (56-98) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws4 | 6 (6-7) | 27 (26-28) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | smithy | 20 (19-21) | 48 (41-53) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | aws-sig | 36 (33-38) | 157 (154-165) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | wdl | 83 (78-93) | 109 (107-126) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-download | minio | 22 (21-23) | 31 (29-34) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | sigflint-A | 1 (1-2) | 9 (9-10) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4fetch | 21 (17-24) | 54 (52-58) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | aws4 | 6 (6-7) | 25 (25-26) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | smithy | 16 (16-16) | 44 (43-53) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | wdl | 67 (63-74) | 106 (96-140) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-part-put | minio | 17 (16-19) | 28 (26-31) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | sigflint-A | 2 (2-2) | 12 (12-13) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | aws4fetch | 26 (24-29) | 64 (59-65) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | aws4 | 7 (7-8) | 32 (30-36) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-encode | wdl | 73 (68-83) | 125 (118-162) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | sigflint-A | 1 (1-2) | 8 (8-9) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4fetch | 27 (26-28) | 63 (57-65) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | aws4 | 6 (5-6) | 28 (25-32) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | smithy | 20 (20-22) | 50 (48-56) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | gcMs | bench-body-1k | minio | 21 (20-23) | 35 (33-36) | Node ahead, ranges disjoint | suspected only: the two runtimes use different instruments |
| C/D | maxRss | - | sigflint-A | 122,728,448 (121,745,408-123,244,544) | 68,042,752 (67,559,424-68,468,736) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4fetch | 134,840,320 (133,369,856-134,979,584) | 72,593,408 (72,073,216-73,515,008) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws4 | 122,941,440 (121,020,416-123,564,032) | 75,636,736 (75,243,520-76,193,792) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | smithy | 121,491,456 (121,085,952-121,741,312) | 76,034,048 (75,800,576-81,723,392) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | aws-sig | 178,262,016 (175,984,640-178,503,680) | 83,816,448 (83,353,600-85,696,512) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | wdl | 131,649,536 (130,936,832-132,268,032) | 78,819,328 (76,767,232-79,548,416) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | maxRss | - | minio | 123,678,720 (122,875,904-124,272,640) | 73,990,144 (73,437,184-75,116,544) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | cacheEntry | - | sigflint-A | 341 (340-341) | 359 (354-360) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | importMs | - | sigflint-A | 1 (1-1) | 2 (2-2) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | importMs | - | aws4fetch | 1 (1-2) | 1 (1-1) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | aws4 | 2 (1-2) | 2 (2-2) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | importMs | - | smithy | 11 (11-12) | 9 (9-10) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | aws-sig | 3 (2-3) | 2 (2-2) | Bun ahead in median, ranges overlap | none needed (Node not ahead) |
| C/D | importMs | - | wdl | 2 (2-2) | 2 (2-2) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | importMs | - | minio | 16 (15-17) | 19 (18-20) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
| C/D | firstMs | - | sigflint-A | 2 (2-2) | 2 (2-3) | Node ahead in median, ranges overlap | no disposition yet: Node ahead in the median, ranges overlap (in band), so not a reproduced gap and not yet confirmed or shown to be noise; it needs alternating samples first; was Bun ahead in median, ranges overlap in the earlier run; nothing filed with oven-sh/bun |
| C/D | firstMs | - | aws4fetch | 17 (17-19) | 3 (3-3) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws4 | 3 (3-3) | 3 (3-3) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | smithy | 12 (12-14) | 11 (11-11) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | aws-sig | 8 (8-9) | 4 (4-4) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | wdl | 18 (16-19) | 5 (4-5) | Bun ahead, ranges disjoint | none needed (Node not ahead) |
| C/D | firstMs | - | minio | 17 (16-18) | 19 (19-20) | Node ahead, ranges disjoint | reproduced gap, report-ready: no reduced reproduction or issue search done; nothing filed with oven-sh/bun for this row |
