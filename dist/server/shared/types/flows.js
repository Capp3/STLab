export const PGROUP_TABLE = {
    'YCbCr-4:2:2': { 10: { pgroupsize: 5, pgroupcoverage: 2 }, 12: { pgroupsize: 3, pgroupcoverage: 1 } },
    'YCbCr-4:4:4': { 10: { pgroupsize: 15, pgroupcoverage: 4 }, 12: { pgroupsize: 9, pgroupcoverage: 2 } },
    RGB: { 10: { pgroupsize: 15, pgroupcoverage: 4 }, 12: { pgroupsize: 9, pgroupcoverage: 2 } },
    'YCbCr-4:2:0': { 8: { pgroupsize: 3, pgroupcoverage: 2 } },
};
/** Wire-rate overhead constants — normative sources: RFC 3550, IEEE 802.3
 * Source: research/report-bandwidth.md §3.5
 */
export const OVERHEAD_BYTES = {
    rtpHeader: 12,
    udpHeader: 8,
    ipv4Header: 20,
    ethernetL2: 18,
    ethernetL1: 20,
    vlanTag: 4,
    totalNoVlan: 78,
    totalWithVlan: 82,
};
