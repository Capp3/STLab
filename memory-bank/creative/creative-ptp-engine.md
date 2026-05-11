# Creative Phase: C3 — PTP Domain Tracing Algorithm

**Type:** Algorithm Design  
**Status:** DECIDED  
**Date:** 2026-05-11  
**Source:** `research/report-ptp.md`

## Decision

**BFS Domain-Reachability Traversal from each Grandmaster Clock**

## Algorithm Summary

```
Input:  DesignGraph (nodes + PTP-plane links)
Output: { domainMap: Map<domainNumber, Set<nodeId>>, violations: Violation[] }

For each GrandmasterClock node:
  1. Get domain_number from GM properties
  2. BFS outward on PTP-plane links only
  3. For each traversed node:
     - If switch: check ptpClockMode declared (BC or TC)
     - If link has domain_number: check matches GM domain
  4. Record all reachable nodes in domainMap[domain]

Post-traversal checks:
  - Any PTP-plane node NOT in any domainMap entry → PTP_NO_GRANDMASTER error
  - Any GM with zero PTP-plane links → PTP_GRANDMASTER_ISOLATED warning
```

## Violation Types (sourced from research/report-ptp.md)

| Violation | Severity | Source |
|-----------|----------|--------|
| `PTP_NO_GRANDMASTER` | error | RFC 7273 §4.3; no GM reachable on PTP path |
| `PTP_DOMAIN_CONFLICT` | error | RFC 7273 §4.8; conflicting domain numbers on same path |
| `PTP_SWITCH_NO_CLOCK_MODE` | warning | IEEE 1588-2019; switch on PTP path without BC/TC declared |
| `PTP_GRANDMASTER_ISOLATED` | warning | IEEE 1588-2019; GM has no PTP-plane links |
| `PTP_MIXED_TRACEABILITY` | error | RFC 7273 §4.8; traceable + non-traceable mixed at same level |

## Key Field Requirements (from research/report-ptp.md)

### GrandmasterClock node properties
- `clockIdentity`: string (64-bit EUI-64 format, e.g. "00-1A-2B-FF-FE-3C-4D-5E")
- `domainNumber`: number (0–127; default 127 for SMPTE ST 2059-2)
- `priority1`: number (0–255; lower = higher priority)
- `priority2`: number (0–255; tiebreaker)
- `clockClass`: number (e.g. 6 = locked to GPS/GNSS)
- `clockAccuracy`: string (enum, e.g. "< 1 µs")
- `traceabilitySource`: 'gnss' | 'atomic' | 'ntp' | 'unknown'
- `redundancyRole`: 'primary' | 'secondary'
- `holdoverCapability`: boolean

### Switch node properties (PTP-relevant)
- `ptpClockMode`: 'boundary' | 'transparent' | null
- `ptpDomainNumber`: number | null (should match connected GM)

### Link properties (PTP-relevant)
- `networkPlane`: includes 'ptp'
- `ptpPresence`: boolean
- `ptpRoleReference`: string (node ID of GM or BC providing timing on this link)

## Confidence Levels (aligned with research/report-ptp.md uncertainty model)

| Check | Evidence Level |
|-------|----------------|
| GM presence per domain | RFC 7273 §4.3 — normative RFC clause |
| Domain consistency | RFC 7273 §4.8 — normative RFC clause |
| Switch clock mode | IEEE 1588-2019 metadata; clause text Unverified → output as `warning` not `error` |
| Path asymmetry | Secondary guidance only → informational flag, not violation |
| Offset < 1 µs target | Secondary (WSTS/ATIS) → output as informational, labeled "secondary guidance" |

## Implementation Notes

- Adjacency built for PTP-plane links only (enforces plane isolation from §7.2 of project brief)
- BFS is bidirectional for path discovery (PTP synchronization flows bidirectionally)
- Phase 2 enhancement: count hop depth from GM; deeper hops → greater clock uncertainty warning
- Result stored in `derived_metrics` table with `metric_type = 'ptp_domain_trace'`
- Violations stored in `violations` table per usual pattern
