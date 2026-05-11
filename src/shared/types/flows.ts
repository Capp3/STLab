export type EssenceType = 'video' | 'audio' | 'anc' | 'data';

/**
 * pgroup lookup table — normative values from SMPTE ST 2110-20:2017 Table 4
 * Source: research/report-bandwidth.md §3.1
 */
export interface PgroupEntry {
  pgroupsize: number;
  pgroupcoverage: number;
}

export const PGROUP_TABLE: Record<string, Record<number, PgroupEntry>> = {
  'YCbCr-4:2:2': { 10: { pgroupsize: 5, pgroupcoverage: 2 }, 12: { pgroupsize: 3, pgroupcoverage: 1 } },
  'YCbCr-4:4:4': { 10: { pgroupsize: 15, pgroupcoverage: 4 }, 12: { pgroupsize: 9, pgroupcoverage: 2 } },
  RGB: { 10: { pgroupsize: 15, pgroupcoverage: 4 }, 12: { pgroupsize: 9, pgroupcoverage: 2 } },
  'YCbCr-4:2:0': { 8: { pgroupsize: 3, pgroupcoverage: 2 } },
};

export interface FlowProperties {
  /** ST 2110-21 sender type — normative per ST 2110-21:2017 */
  senderType?: 'N' | 'NL' | 'W';
  /** Whether this flow is part of an ST 2022-7 redundant pair */
  st2022_7Protected?: boolean;
  /** Video-specific */
  videoWidth?: number;
  videoHeight?: number;
  videoSampling?: string;
  videoBitDepth?: number;
  videoRefreshRateNumerator?: number;
  videoRefreshRateDenominator?: number;
  videoPackingMode?: 'GPM' | 'BPM';
  /** Audio-specific */
  audioSampleRate?: number;
  audioBitDepth?: number;
  audioChannels?: number;
  audioPacketTimeMs?: number;
  /** ANC-specific */
  ancEstimated?: boolean;
  /** RTP session info */
  rtpClockRate?: number;
  multicastAddress?: string;
  destinationPort?: number;
  /** Source of bandwidth value */
  bandwidthSource?: 'calculated' | 'user_defined' | 'measured';
  /** Calculation confidence per research reports */
  bandwidthConfidence?: 'high' | 'medium' | 'low' | 'unverified';
  notes?: string;
}

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
} as const;
