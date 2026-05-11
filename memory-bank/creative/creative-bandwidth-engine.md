# Creative Phase: C2 — Bandwidth Calculation Model

**Type:** Algorithm Design
**Status:** DECIDED
**Date:** 2026-05-11
**Source:** `research/report-bandwidth.md`

## Decision

**Hybrid: Link-Annotated Flows + Engine-Aggregated Metrics**

Each link explicitly carries a `flows[]` reference. The engine computes all utilization math including overhead, ST 2022-7 multipliers, and switch aggregation.

## Core Formulas (all sourced from research/report-bandwidth.md)

### Per-Packet Overhead (§3.5 — Normative sources: RFC 3550, IEEE 802.3)

| Layer     | Component             | Bytes  |
| --------- | --------------------- | ------ |
| L5        | RTP header            | 12     |
| L4        | UDP header            | 8      |
| L3        | IPv4 header           | 20     |
| L2        | Ethernet header + FCS | 18     |
| L1        | Preamble + SFD + IFG  | 20     |
| **Total** | **No VLAN**           | **78** |
| +VLAN     | 802.1Q tag            | +4     |

### Per-Link Utilization (§5.2)

```
usedMbps = Σ(flow.bandwidthMbps + overheadMbps) × (2 if st2022_7Protected else 1)
utilizationPct = (usedMbps / link.capacityMbps) × 100
```

### Video Bandwidth (§3.1 — VSF TR-05:2018, pgroup from ST 2110-20 normative Table 4)

```
packets_per_frame = 1 + INT(width × height / (INT(1426 / pgroupsize) × pgroupcoverage))
bits_per_packet   = 8 × INT(1426 / pgroupsize) × pgroupsize + 94
ASB_Mbps          = packets_per_frame × bits_per_packet × exactFrameRate / 1_000_000
```

pgroup lookup table (normative, ST 2110-20:2017 Table 4):

| Sampling    | Bit depth | pgroupsize | pgroupcoverage |
| ----------- | --------- | ---------- | -------------- |
| YCbCr-4:2:2 | 10-bit    | 5          | 2              |
| YCbCr-4:2:2 | 12-bit    | 3          | 1              |
| RGB/4:4:4   | 10-bit    | 15         | 4              |
| RGB/4:4:4   | 12-bit    | 9          | 2              |
| YCbCr-4:2:0 | 8-bit     | 3          | 2              |

### Audio Bandwidth (§3.3 — ST 2110-30, AES67)

```
audioPayloadBytesPerSec = sampleRate × (bitDepth / 8) × channelCount
wireRateMbps = (audioPayloadBytesPerSec + packetsPerSec × overheadBytes) × 8 / 1_000_000
```

### ANC Bandwidth (§3.4 — UNVERIFIED, estimate only)

```
ancMbps = 0.075  // 75 kbps default estimate; labeled as non-normative assumption
```

### Switch Backplane (§6.2)

```
backplaneLoadMbps = Σ(unique flows through switch × bandwidthMbps)
                    // multicast: counted once for backplane
adjustedBackplane = backplaneCapacityMbps - existingNonSt2110LoadMbps  // shared switch only
backplaneUtilPct  = backplaneLoadMbps / adjustedBackplane × 100
```

## Violation Thresholds (Engineering Policy — Non-Normative per §4.3)

| Condition             | Type                      | Severity  | Label                                |
| --------------------- | ------------------------- | --------- | ------------------------------------ |
| utilization ≥ 100%    | `BANDWIDTH_EXCEEDED`      | `error`   |                                      |
| utilization ≥ 80%     | `BANDWIDTH_HIGH`          | `warning` | ASSUMPTION — engineering policy      |
| Wide sender on switch | `WIDE_SENDER_BUFFER_RISK` | `warning` | VRXFULL=720 per ST 2110-21:2017 §3.6 |
| Backplane ≥ 100%      | `BACKPLANE_EXCEEDED`      | `error`   |                                      |
| Backplane ≥ 80%       | `BACKPLANE_HIGH`          | `warning` | ASSUMPTION                           |

## Implementation Notes

- All Mbps values stored internally as `number` (decimal Mbps)
- Utilization stored as decimal 0–1 internally; percentage in API responses and UI
- ST 2022-7 flag is per-flow (`flow.st2022_7Protected: boolean`)
- Wide sender flag is per-flow (`flow.senderType: 'N' | 'NL' | 'W'` from ST 2110-21)
- VLAN tag present flag is per-link (`link.properties.vlanTagged: boolean`)
- ANC bandwidth estimate must be labeled "ASSUMPTION" in all reports
