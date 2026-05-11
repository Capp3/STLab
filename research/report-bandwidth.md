# ST 2110 Bandwidth & Capacity Calculation Truth Report for ST Lab

**Document Purpose:** Define what can be calculated reliably from standards, what requires assumptions, and how to model uncertainty safely in SMPTE ST 2110 IP media networks.

**Edition:** May 2026 | **Audience:** ST Lab capacity planners and network engineers

---

## 1. Executive Summary

SMPTE ST 2110 transports video, audio, and ancillary data as separate, synchronized RTP essence streams over managed IP networks. Unlike SDI, which carries all essences in a single fixed-bandwidth signal, ST 2110 disaggregates the signal into independently routable flows — each with its own bandwidth footprint, traffic profile, and packetization behavior. This disaggregation introduces precision in capacity planning but also expands the number of variables that must be accounted for.[^1][^2]

**What is reliably calculable from standards:**

- Video (ST 2110-20) essence bandwidth using the VSF TR-05 Approximate Signal Bandwidth (ASB) formula, derived from SDP parameters and pgroup values in SMPTE ST 2110-20:2017[^3][^4]
- Audio (ST 2110-30/AES67) essence bandwidth using sample rate, bit depth, channel count, and packet time[^5]
- Transport overhead structure (IP + UDP + RTP headers = 40 bytes per packet; Layer 1 Ethernet overhead = 20 bytes per packet)[^6][^7]
- ST 2110-21 leaky bucket model parameters (CMAX and VRXFULL) for Narrow (N), Narrow-Linear (NL), and Wide (W) sender types[^8][^9]

**What requires engineering assumptions (must be labeled):**

- Aggregate link utilization headroom (no normative percentage defined in ST 2110 standards)
- Safety margins for traffic bursts and simultaneous flow activations
- Join-before-leave bandwidth double-counting during routing transitions
- Switch buffer adequacy for Wide (W) sender mixes

**What is implementation-dependent (must be marked Unverified unless provided by operator):**

- Actual packet size per sender implementation
- PTP management traffic contribution
- NMOS/IGMP control plane overhead per link
- Flow activation concurrency patterns

---

## 2. Standards and Formula Source Map

The following primary standards govern the bandwidth and capacity domain. All formulas in this report are traced to one of these documents.

| Standard / Document   | Version / Date                           | Relevance to Capacity Calculation                                                     |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| SMPTE ST 2110-20      | 2017 (original); amendments through 2022 | Uncompressed video payload format; pgroup tables; active-only pixel transport[^10]    |
| SMPTE ST 2110-21      | 2017 (original)                          | Traffic shaping; leaky bucket model; Narrow/Wide/NL sender compliance parameters[^11] |
| SMPTE ST 2110-30      | 2017 (original)                          | PCM audio transport; AES67 profile constraints; conformance levels A–C[^12]           |
| SMPTE ST 2110-40      | 2018/2023                                | Ancillary data (ANC/VANC) transport over RTP; RFC 8331 payload[^13]                   |
| SMPTE ST 2110-10      | 2017                                     | System timing; PTP (IEEE 1588) reference[^10]                                         |
| SMPTE ST 2022-7       | —                                        | Seamless protection switching; dual-path redundancy (doubles bandwidth budget)[^14]   |
| VSF TR-05             | June 2018                                | ASB bandwidth formula; pgroup calculation methodology for ST 2110-20[^4]              |
| IETF RFC 4175         | September 2005                           | RTP payload format for uncompressed video; referenced normatively by ST 2110-20[^15]  |
| IETF RFC 8331         | —                                        | RTP payload for SMPTE ST 291-1 ancillary data; referenced by ST 2110-40[^13]          |
| AES67-2018            | 2018                                     | Audio-over-IP interoperability standard; referenced normatively by ST 2110-30[^12]    |
| AMWA IS-04            | v1.2+                                    | Discovery and registration; flow/sender metadata model[^16]                           |
| AMWA IS-05            | v1.0+                                    | Connection management; flow activation control[^17]                                   |
| AMWA IS-06            | v1.0                                     | Network control API; bandwidth reservation and flow enforcement via SDN[^18]          |
| IEEE 802.3 (Ethernet) | Current                                  | Layer 1 framing overhead: Preamble + SFD + IFG = 20 bytes per frame[^7]               |

> **Note on VSF TR-05 Status:** The bandwidth formulas in VSF TR-05 Section 7 are explicitly marked **Informative** (not normative) in the document itself. They remain the primary engineering reference for ASB estimation, used by the industry and referenced by vendors, but they are not a "shall" mandate. This must be reflected in all outputs labeled "ASB."[^4]

---

## 3. Calculation Rules Catalog

### 3.1 ST 2110-20 Video Essence Bandwidth (Normative Source / Informative Formula)

**Source:** VSF TR-05:2018, Section 7.2.1 — "Approximate Signal Bandwidth (ASB)"; pgroup values from SMPTE ST 2110-20:2017, Section 6.2.4[^19][^4]

The ASB is calculated from SDP parameters using General Packing Mode (GPM):

\[
\text{packets_per_frame} = 1 + \text{INT}\left(\frac{width \times height}{\text{INT}\left(\frac{1426}{pgroupsize}\right) \times pgroupcoverage}\right)
\]

\[
\text{bits_per_packet} = 8 \times \text{INT}\left(\frac{1426}{pgroupsize}\right) \times pgroupsize + 94
\]

\[
ASB \; (Mbit/s) = \frac{\text{packets_per_frame} \times \text{bits_per_packet} \times exactframerate}{1{,}000{,}000}
\]

Where 94 bits = RTP and RTP extended payload header contribution per packet (derived from 12-byte RTP header + application-specific header bytes).[^6][^4]

**pgroup values (from ST 2110-20:2017, Table 4 / Section 6.2.4):**[^19]

| Sampling Format   | Bit Depth | pgroupsize (bytes) | pgroupcoverage (pixels) |
| ----------------- | --------- | ------------------ | ----------------------- |
| YCbCr-4:2:2       | 10-bit    | 5                  | 2                       |
| YCbCr-4:2:2       | 12-bit    | 3                  | 1                       |
| RGB / YCbCr-4:4:4 | 10-bit    | 15                 | 4                       |
| RGB / YCbCr-4:4:4 | 12-bit    | 9                  | 2                       |
| YCbCr-4:2:0       | 8-bit     | 3                  | 2                       |

**Subsampling factors for performance-level calculations (VSF TR-05, Table 1):**[^4]

| Sampling Format                    | Subsampling Factor |
| ---------------------------------- | ------------------ |
| RGB, XYZ, YCbCr-4:4:4, ICtCp-4:4:4 | 3                  |
| YCbCr-4:2:2, ICtCp-4:2:2           | 2                  |
| YCbCr-4:2:0, ICtCp-4:2:0           | 1.5                |
| Key                                | 1                  |

**Worked Example (VSF TR-05:2018, Section 7.2.2):**[^4]

For 1080p59.94 (YCbCr-4:2:2, 10-bit, GPM):

- pgroupsize = 5, pgroupcoverage = 2
- packets_per_frame = 1 + INT((1920 × 1080) / (INT(1426/5) × 2)) = 3,638
- bits_per_packet = 8 × INT(1426/5) × 5 + 94 = 12,152
- ASB = (3,638 × 12,152 × 60000/1001) / 1,000,000 ≈ **2,650 Mbit/s**

**ST 2110-20 vs ST 2022-6 efficiency comparison (from AIMS/RAVENNA):** ST 2110-20 transports active pixels only, yielding approximately 30% bandwidth saving over ST 2022-6 SDI encapsulation for equivalent signals (e.g., 1080p50: ST 2022-6 = 3.074 Gbit/s vs ST 2110-20 = 2.143 Gbit/s).[^20][^21]

**Confidence: High** (formula is widely used industry reference; pgroup values are normative in ST 2110-20)

**Label: INFORMATIVE formula on NORMATIVE pgroup data**

---

### 3.2 Simplified Video Bandwidth Estimation Formula

**Source:** Vendor/industry implementation reference (Megapixel VR / CT Group) — **NOT a normative formula**. Provided for quick estimation only.[^22][^23]

\[
\text{Data Rate} = \text{Active Width} \times \text{Active Height} \times \text{Frame Rate} \times \frac{\text{Bits}}{\text{Color}} \times \text{Pixel Format Factor} \times (1 + \text{Packet Overhead})
\]

Where:

- Pixel Format Factor = 2 for YCbCr-4:2:2; = 3 for RGB or 4:4:4[^22]
- Packet overhead = typically 5–7% (implementation-dependent; not normatively specified)[^22]

**⚠ ASSUMPTION — LABELED:** The 5–7% overhead figure is a vendor-derived implementation estimate, not a normative value from any SMPTE standard. The ASB formula (Section 3.1) should be used for engineering-grade calculations.

**Confidence: Medium** (for quick estimation only)

---

### 3.3 ST 2110-30 Audio Essence Bandwidth

**Source:** SMPTE ST 2110-30:2017; AES67-2018; TVTechnology / AES67 Practical Guide analysis[^24][^5][^6]

Raw audio payload per second:
\[
\text{Audio Payload} \; (bytes/s) = f_s \times \frac{b}{8} \times N_c
\]

Where:

- \(f_s\) = sample rate (48,000 Hz mandatory minimum)[^12]
- \(b\) = bit depth (16 or 24 bits; both mandatory at Level A)[^25]
- \(N_c\) = number of channels per stream (1–8 at Level A; up to 64 at Level C)[^26]

**Example (ST 2110-30:2017 minimum interoperability — Level A):** 48 kHz, 24-bit stereo (2 channels): 48,000 × 3 × 2 = 288,000 bytes/s = **2.304 Mbit/s** raw audio payload.[^5]

**Packets per second** at 1 ms packet time (mandatory at Level A): 1,000 packets/second per stream.[^25]

**Per-packet audio payload size** (1 ms @ 48 kHz, 8ch, L24):
\[
1\,ms \times 48\,kHz \times 8 \times 3\,bytes = 1{,}152\,bytes/packet
\]

**Transport overhead added per packet:** IP (20 bytes) + UDP (8 bytes) + RTP (12 bytes) = 40 bytes. Ethernet Layer 2 header (14 bytes) + FCS (4 bytes) = 18 bytes; Layer 1 Preamble + SFD + IFG = 20 bytes.[^27][^7][^28][^6]

**Lawo reference bandwidth figures (informative, rounded):**[^29]

| Format           | Bandwidth  | Packets/sec |
| ---------------- | ---------- | ----------- |
| L16, 8ch, 48kHz  | ~7 Mbit/s  | ~1,500 pps  |
| L16, 16ch, 48kHz | ~14 Mbit/s | ~2,000 pps  |
| L24, 16ch, 48kHz | ~20 Mbit/s | ~2,000 pps  |
| L24, 32ch, 48kHz | ~53 Mbit/s | ~6,000 pps  |

These figures include RTP/UDP/IP overhead but may not include Layer 1 Ethernet framing overhead. Treat as estimates.

**Confidence: High** (core formula is derived from normative parameters in ST 2110-30 and AES67)

---

### 3.4 ST 2110-40 Ancillary Data Bandwidth

**Source:** SMPTE ST 2110-40:2018/2023; IETF RFC 8331; IP Showcase presentation[^13]

ST 2110-40 carries SMPTE ST 291-1 ANC data packets (VANC, captions, timecodes, AFD, etc.) wrapped in RTP per RFC 8331. The standard does not define a fixed bit rate — bandwidth is wholly dependent on the volume and frequency of ANC data packets in the source signal.[^13]

**Typical practical range:** 50–100 kbps per flow (from monitoring observations). However, this is a **non-normative observation** and may vary with the ANC payload types carried.[^30][^31]

**⚠ UNVERIFIED VALUE:** No normative floor or ceiling bandwidth for ST 2110-40 flows is defined in SMPTE standards. The 50–100 kbps figure is an engineering approximation only and must be verified per deployment.

**Confidence: Low** (bandwidth must be measured or estimated per specific ANC payload inventory)

---

### 3.5 Transport Encapsulation Overhead Breakdown

**Source:** IETF RFC 3550 (RTP); IEEE 802.3 (Ethernet)[^7][^28][^6]

The total on-wire overhead per ST 2110 packet can be decomposed as follows:

| Layer                      | Header Component                  | Bytes                   | Source           |
| -------------------------- | --------------------------------- | ----------------------- | ---------------- |
| L5 (Application)           | RTP Header                        | 12                      | RFC 3550[^6]     |
| L4 (Transport)             | UDP Header                        | 8                       | RFC 768[^27]     |
| L3 (Network)               | IPv4 Header (no options)          | 20                      | RFC 791[^27]     |
| **L3+L4+L5 total**         | **IP/UDP/RTP**                    | **40**                  | [^6][^27]        |
| L2 (Data Link)             | Ethernet Header (DA+SA+EtherType) | 14                      | IEEE 802.3[^28]  |
| L2 (Data Link)             | VLAN Tag (802.1Q, if used)        | +4                      | IEEE 802.1Q[^28] |
| L2 (Data Link)             | FCS                               | 4                       | IEEE 802.3[^28]  |
| L1 (Physical)              | Preamble (7) + SFD (1) + IFG (12) | 20                      | IEEE 802.3[^7]   |
| **Total L1 wire overhead** | **All non-payload**               | **~78 bytes (no VLAN)** | —                |

The practical significance of L1 overhead depends on packet size. For a standard 1,500-byte MTU Ethernet frame, L1 overhead is approximately 1.3% of wire bandwidth. For smaller audio packets (e.g., 192-byte payload), the percentage overhead is substantially higher — up to ~24% at minimum packet sizes.[^7]

**⚠ ASSUMPTION:** ST 2110-20 video packets typically target ~1,500-byte MTU (jumbo frames may reduce overhead further). Audio packets at 1 ms/1ch/L16 are 32 bytes of payload, making overhead proportionally very large. Actual implementation packet sizes must be confirmed per sender.

---

### 3.6 ST 2110-21 Traffic Shaping — Leaky Bucket Parameters

**Source:** SMPTE ST 2110-21:2017; EBU/IP Showcase analysis[^32][^9][^8]

ST 2110-21 defines three sender types, each with normatively defined leaky bucket compliance parameters:[^11]

| Sender Type        | CMAX | VRXFULL | Typical Implementation                             | Burstiness                         |
| ------------------ | ---- | ------- | -------------------------------------------------- | ---------------------------------- |
| Narrow (N)         | 4    | 8       | FPGA hardware senders; SDI-aware timing            | Low (SDI-like gaps during VBI)[^8] |
| Narrow-Linear (NL) | 4    | 8       | Hardware; evenly spaced across full frame period   | Lowest[^8]                         |
| Wide (W)           | 16   | 720     | Software-based senders (graphics generators, etc.) | High[^8][^33]                      |

**Definitions:**

- **CMAX**: Maximum instantaneous packet count allowed in the leaky bucket at any moment[^8]
- **VRXFULL**: Virtual Receiver Buffer capacity in packets; determines switch/receiver buffer sizing[^11]
- **TDRAIN**: Inter-packet drain interval = (TFRAME / NPACKETS) × (1/β)[^9]
- **β (Beta)**: Scaling factor in drain rate calculation (implementation-dependent; not normatively fixed)[^32]

**Compliance measurement:** CINST (instantaneous bucket occupancy) must never exceed CMAX. If CPEAK > CMAX, the sender is non-compliant.[^9]

**Critical design implication:** Wide (W) senders require significantly larger switch buffers than Narrow senders. A mixed environment with multiple simultaneous Wide senders can cause unpredictable buffer overflow if switch buffer depth is not sized for VRXFULL = 720 per concurrent Wide flow. This is a **normative requirement** from ST 2110-21.[^20][^32]

---

### 3.7 ST 2022-7 Redundancy Bandwidth Multiplier

**Source:** SMPTE ST 2022-7; Clearcom / RIST documentation[^14][^34]

ST 2022-7 provides seamless protection switching by transmitting two identical, independent copies of each RTP stream over separate network paths (commonly called Red and Blue). The receiver buffers both and reconstructs a single output using RTP sequence numbers.[^35][^14]

**Bandwidth implication:** Each flow protected by ST 2022-7 consumes **double** the bandwidth — once on each network path. Aggregate link budgets must apply a multiplier of 2× for all ST 2022-7-protected flows.[^22]

**⚠ ASSUMPTION — LABELED:** In a dual-network (n+n) topology, each physical network must be capable of carrying the full load independently. In a single-network ST 2022-7 implementation (requiring SDN path disjointness per IS-06), total network capacity must accommodate both streams simultaneously.[^36][^37]

---

## 4. Required Inputs for ST Lab

The following inputs must be provided or confirmed before bandwidth and capacity calculations can proceed. Inputs are categorized by whether they are derivable from standards or must be operator-supplied.

### 4.1 Per-Essence Inputs (Required for Each Flow)

| Input Field                  | Source           | Standards Derivable? | Notes                                                    |
| ---------------------------- | ---------------- | -------------------- | -------------------------------------------------------- |
| Video width (pixels)         | SDP / device     | Yes (via SDP)        | From `width=` parameter                                  |
| Video height (pixels)        | SDP / device     | Yes (via SDP)        | From `height=` parameter                                 |
| Exact frame rate (M/N ratio) | SDP / device     | Yes                  | Use exact rational (e.g., 60000/1001 not 59.94)[^4]      |
| Sampling format              | SDP / device     | Yes                  | YCbCr-4:2:2, 4:4:4, RGB, etc.[^4]                        |
| Bit depth                    | SDP / device     | Yes                  | 8, 10, 12-bit; determines pgroup[^19]                    |
| Packing mode                 | SDP / device     | Yes                  | GPM (2110GPM) or BPM; GPM recommended[^4]                |
| Sender type (TP parameter)   | SDP / device     | Yes                  | 2110TPN, 2110TPNL, 2110TPW[^20][^38]                     |
| Audio sample rate            | SDP / device     | Partially            | 48 kHz mandatory; 96 kHz optional[^25]                   |
| Audio bit depth              | SDP / device     | Partially            | L16 or L24 mandatory; others optional[^5]                |
| Audio channels per stream    | SDP / device     | No                   | 1–8 at Level A; operator must confirm                    |
| Audio packet time            | SDP / device     | Partially            | 1 ms mandatory; 125 µs optional[^25]                     |
| ST 2022-7 active?            | Operator / IS-05 | No                   | Doubles all bandwidth figures[^22]                       |
| Flow activation state        | IS-04 / IS-05    | No                   | Active vs staged/inactive flows affect measurement scope |

### 4.2 Per-Link / Per-Switch Inputs

| Input Field                                 | Who Provides       | Notes                                          |
| ------------------------------------------- | ------------------ | ---------------------------------------------- |
| Physical link speed (Gbps)                  | Network topology   | 1G, 10G, 25G, 40G, 100G[^39]                   |
| VLAN tagging in use?                        | Network config     | Adds 4 bytes per packet overhead[^28]          |
| Switch port type (access/trunk)             | Network config     | Affects multicast replication traffic          |
| Connected device list per port              | Network topology   | Needed for ingress/egress budgeting            |
| Multicast group memberships                 | IGMP state / IS-06 | Determines which flows traverse each link[^40] |
| Jumbo frames enabled?                       | Network config     | Affects per-packet L1 overhead fraction[^7]    |
| ST 2022-7 topology (single vs dual network) | Operator           | Determines bandwidth multiplier[^36]           |

### 4.3 System-Level Inputs

| Input Field                                                               | Who Provides         | Notes                                                      |
| ------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------- |
| Target link utilization ceiling (%)                                       | Engineering policy   | No normative value exists; must be operator-defined        |
| Safety margin (%)                                                         | Engineering policy   | Non-normative; must be labeled as assumption               |
| PTP / management traffic budget                                           | Network design       | Typically low but non-zero; must be measured               |
| Flow count at peak concurrency                                            | Operator / scheduler | Active vs subscribed vs reserved distinction required[^41] |
| Routing transition model (join-before-leave, leave-before-join, hard cut) | Operator             | Affects peak bandwidth during routing changes[^41]         |

---

## 5. Derived Outputs and Reporting Requirements

### 5.1 Per-Essence Bandwidth Output

For each defined essence flow, ST Lab should output:

- **ASB (Mbit/s):** Calculated using VSF TR-05 formula; labeled as Informative[^4]
- **Packets per second:** Derived from packets_per_frame × frame_rate (video) or 1/packet_time (audio)
- **Transport overhead add-on:** IP/UDP/RTP = 40 bytes per packet; L2 = 18 bytes; L1 = 20 bytes[^6][^7]
- **Wire-rate bandwidth:** ASB adjusted for total header overhead
- **Sender type declared:** N, NL, or W — affects switch buffer requirement[^8]

### 5.2 Aggregate Link Budget Output

For each monitored link:

- **Sum of active ingress flows × bandwidth per flow:** This is the active bandwidth load
- **Comparison against physical link capacity**
- **Utilization percentage:** (Active bandwidth / Link capacity) × 100
- **Available headroom:** Link capacity − active bandwidth − management/control traffic reserve

### 5.3 ST 2022-7 Adjusted Output

Where ST 2022-7 is active, all flow bandwidths must be reported as doubled, and the report must clearly indicate which paths carry the redundant copies.[^36][^22]

### 5.4 Snapshot vs Time-Window Reporting

The ST 2110 standard does not define a reporting window. However, IS-04/IS-05 maintain version-stamped state of active connections. ST Lab should:[^17]

- **Snapshot report:** Capture current active flow state at a point in time via IS-04 query
- **Time-window report:** Track flow activations and deactivations over a period; report peak concurrent bandwidth
- Distinguish between **staged** (IS-05 staged but not activated) and **active** (IS-05 activated) flows[^17]
- Report ingress and egress separately per switch port; these can differ where multicast replication occurs[^40]

---

## 6. Link-Level and Switch-Level Modeling Guidance

### 6.1 Link-Level Capacity Model

A link budget must account for all active multicast flows traversing that link, not just the flows originating from or terminating at connected devices. In a spine-leaf topology, uplink links may carry aggregated traffic from multiple leaf-connected devices simultaneously.[^37][^41]

**Non-blocking condition (AIMS Alliance guidance):**[^41]

> "The bandwidth of an uplink trunk from a router, connected to a second router (analogous to Leaf and Spine) must be equal to, or greater than, the total bandwidth which could be routed to it by the network tributaries feeding the router generating the uplink."

This is an **engineering guidance statement** (not a normative standard), but it represents the accepted design target for non-blocking media networks.

**Link utilization targets:** No normative ceiling is defined in ST 2110 standards. Engineering convention typically targets 40–50% utilization for media-critical links to provide headroom for burst traffic, simultaneous routing changes, and Wide sender traffic spikes. This is an **ASSUMPTION** and must be confirmed against organizational policy.[^42][^37]

### 6.2 Switch-Level Capacity Model

Switches must be sized for:

1. **Total forwarding bandwidth:** Sum of all simultaneously active multicast streams passing through the switch fabric
2. **Packet buffer depth per port:** Must accommodate VRXFULL = 720 packets for Wide senders; VRXFULL = 8 for Narrow/NL senders[^8]
3. **Multicast replication capacity:** One ingress multicast flow may be replicated to N egress ports; internal switching fabric must support this without head-of-line blocking[^40][^41]
4. **IGMP snooping table size:** Must accommodate all multicast group memberships; overflow causes flooding[^40]

**IS-06 (AMWA Network Control) role:** IS-06 enables a Network Controller to receive bandwidth reservation requests from a Broadcast Controller, enforce per-flow bandwidth limits, and provide feedback on link capacity availability. Where IS-06 is deployed, bandwidth reservation is software-enforced. Where it is not, capacity planning is purely manual and subject to misconfiguration risk.[^43][^18]

### 6.3 Connected Device Count vs Flow Count

The number of physical devices connected to a switch does not directly determine bandwidth load. A single device may originate multiple simultaneous flows (e.g., one 1080p59.94 video flow + multiple 8-channel audio flows + one ANC flow). Conversely, a device may be subscribed to many inbound flows simultaneously. ST Lab must model at the **flow level**, not the device level, and must know:

- Number of active sender flows per device
- Number of active receiver subscriptions per device
- Whether the device is multicast source or subscriber (affects which links carry traffic)[^44][^1]

---

## 7. Validation Checklist for Capacity Planning

The following checks must pass before a capacity planning report is considered valid.

### Formula and Input Validation

- [ ] All video bandwidths are calculated using the ASB formula with correct pgroup values from ST 2110-20 tables — not the simplified multiplication formula alone
- [ ] Frame rate is expressed as an exact rational (M/N) — not a decimal approximation (e.g., 60000/1001, not 59.94)[^4]
- [ ] Sampling and depth parameters are confirmed from SDP, not assumed from format name
- [ ] Audio bandwidth includes RTP/UDP/IP overhead per packet, not raw payload only[^6]
- [ ] ST 2110-40 bandwidth is measured or conservatively estimated per ANC payload type — not zero[^30]

### Traffic and Overhead Validation

- [ ] All overhead contributions are accounted for: RTP header (12B) + UDP (8B) + IP (20B) + Ethernet L2 (18B) + L1 (20B)[^7][^6]
- [ ] VLAN tagging (+4 bytes) is included if 802.1Q is active on the link[^28]
- [ ] ST 2022-7 protected flows have their bandwidth doubled in all link budget calculations[^22]
- [ ] Wide (W) sender flows have switch buffer requirements flagged separately from Narrow flows[^8]

### Scope and State Validation

- [ ] Flow state is confirmed: active (IS-05 activated) vs staged vs inactive[^17]
- [ ] Multicast replication factor is accounted for at switch ingress vs egress[^40]
- [ ] Routing transition model is declared (join-before-leave adds double bandwidth during transition)[^41]
- [ ] PTP/management traffic is budgeted separately and not included in essence flow totals

### Assumption and Label Validation

- [ ] Every safety margin percentage is labeled "ASSUMPTION — Engineering Policy, not normative"
- [ ] Every link utilization ceiling is labeled "ASSUMPTION — not normatively defined in ST 2110"
- [ ] Simplified overhead estimates (5–7%) are labeled as vendor-derived, non-normative[^22]
- [ ] ST 2110-40 bandwidth figures are labeled "estimated / unverified" unless measured

---

## 8. Risk Notes and Ambiguity Areas

### Risk 1: Wide (W) Sender Burst Risk

Wide senders are permitted to exhibit significantly greater burstiness (CMAX = 16, VRXFULL = 720) compared to Narrow senders. A facility with multiple concurrent software-based graphics generators, virtual production systems, or cloud-native senders may have predominantly Wide sources. If switch buffers are sized for Narrow/NL assumptions only, Wide sender bursts can cause packet loss even when average link utilization is below capacity. **Mitigation:** Inventory TP parameter from SDP for all senders; flag all Wide senders; size buffers accordingly.[^20][^8]

### Risk 2: Multicast Replication at Spine-Leaf Boundaries

In spine-leaf topologies, a single inbound multicast stream may be replicated to multiple egress ports at a spine switch. Total egress bandwidth from a spine can exceed the single ingress flow bandwidth by a factor equal to the number of subscribed receivers. Link budgets must model egress traffic, not just ingress.[^37]

### Risk 3: Join-Before-Leave Transition Bandwidth

When IS-05 triggers a routing change with join-before-leave behavior, two active flows coexist briefly on the receiving link — double the expected bandwidth. In a high-density routing environment, simultaneous routing changes can temporarily spike aggregate link bandwidth beyond design capacity. This is **not addressed normatively** in ST 2110 and is an engineering risk that must be managed via routing policy.[^41]

### Risk 4: PTP Grandmaster and Management Traffic Underestimation

PTP (IEEE 1588 / ST 2059) synchronization traffic, IGMP membership reports, IS-04 heartbeats, and IS-05 API traffic all consume link bandwidth. These are typically low per-flow but can accumulate in high-density systems. They are **not included** in ASB calculations and must be budgeted separately or accounted for in safety margins.[^45][^17]

### Risk 5: SDP Parameter Discrepancy

Bandwidth calculations are only as reliable as the SDP parameters they are derived from. If a device reports incorrect SDP metadata (e.g., mismatched exactframerate or incorrect TP value), calculated bandwidth will not match actual wire traffic. ST Lab should cross-validate calculated bandwidth against live measurement where possible.

### Risk 6: Compressed Video (ST 2110-22) Bandwidth Variability

SMPTE ST 2110-22 defines transport for Constant Bit Rate (CBR) compressed video. If ST 2110-22 flows are present in the monitored system, their bandwidth is codec-dependent and cannot be calculated from the ST 2110-20 ASB formula. This is **implementation-dependent** and requires encoder specification data.[^46]

---

## 9. Open Questions / Unverified Items

The following items could not be confirmed from primary normative sources and are flagged as requiring verification or operator input:

| Item                                                          | Status                                          | Action Required                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Normative link utilization ceiling for ST 2110 media networks | **Unverified — no standard defines this**       | Engineering policy must be set by facility; common practice is 40–50% but this is non-normative                     |
| ST 2110-40 per-flow bandwidth                                 | **Unverified — no normative value in standard** | Must be measured per deployment or estimated from ANC payload inventory; typical 50–100 kbps is an observation[^31] |
| PTP and management traffic overhead per link                  | **Unverified — implementation-dependent**       | Must be measured or estimated from switch telemetry                                                                 |
| Exact β (beta) scaling factor for TDRAIN calculation          | **Implementation-dependent**                    | Defined per sender implementation; not a fixed normative value in ST 2110-21[^32]                                   |
| IS-06 bandwidth reservation enforcement availability          | **Deployment-dependent**                        | Only constrains flow bandwidth if IS-06 Network Controller is deployed[^18]                                         |
| Actual packet size per sender implementation                  | **Implementation-dependent**                    | Vendors may use MTU other than 1,500 bytes; jumbo frames alter overhead fractions[^7]                               |
| ST 2110-22 compressed flow bandwidth                          | **Codec-dependent**                             | Requires encoder configuration data; not calculable from essence parameters alone                                   |
| Dual vs single network for ST 2022-7                          | **Topology-dependent**                          | Bandwidth doubling applies to both, but path routing behavior differs[^36][^37]                                     |
| Number of IGMP table entries per switch                       | **Vendor-dependent**                            | Overflow results in multicast flooding; must be validated against switch ASIC specifications                        |

---

## 10. Formula and Assumption Register

| Calculation Name                                | Formula / Method                                                  | Inputs                                                       | Source Citation                                                                                             | Normative or Assumed                                              | Confidence        |
| ----------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------- |
| ST 2110-20 Video ASB (Approx. Signal Bandwidth) | Three-step pgroup formula (Section 3.1)                           | width, height, exactframerate, pgroupsize, pgroupcoverage    | VSF TR-05:2018 §7.2.1 (Informative section)[^4]; pgroup values from ST 2110-20:2017 §6.2.4 (Normative)[^19] | **Informative formula on normative pgroup data**                  | High              |
| Simplified video bandwidth estimate             | Active W × H × FPS × bits/color × chroma factor × (1 + overhead%) | Resolution, frame rate, bit depth, chroma format, % overhead | Vendor/industry practice only — not SMPTE[^22]                                                              | **Assumed (non-normative)**                                       | Medium            |
| Image samples per second                        | width × height × exactframerate                                   | SDP parameters                                               | VSF TR-05:2018 §7.1.1[^4]                                                                                   | Informative                                                       | High              |
| Chroma/luma samples per second                  | image-samples-per-sec × subsampling-factor                        | Chroma format                                                | VSF TR-05:2018 §7.1.2[^4]                                                                                   | Informative                                                       | High              |
| Audio payload bandwidth (raw)                   | fs × (b/8) × Nc                                                   | Sample rate, bit depth, channel count                        | ST 2110-30:2017; AES67-2018[^5]                                                                             | Normative parameters; formula is derived                          | High              |
| Audio packet overhead                           | 40 bytes (IP+UDP+RTP) per packet                                  | Fixed per RFC 3550, RFC 768, RFC 791                         | RFC 3550[^6]; RFC 2508[^47]                                                                                 | Normative (protocol header sizes)                                 | High              |
| Ethernet L2 overhead                            | 14 (header) + 4 (FCS) = 18 bytes/frame; +4 if VLAN                | Fixed per IEEE 802.3                                         | IEEE 802.3[^7][^28]                                                                                         | Normative                                                         | High              |
| Ethernet L1 overhead                            | 7 (Preamble) + 1 (SFD) + 12 (IFG) = 20 bytes/frame                | Fixed per IEEE 802.3                                         | IEEE 802.3[^7]                                                                                              | Normative                                                         | High              |
| ST 2022-7 bandwidth multiplier                  | ×2 for each ST 2022-7-protected flow                              | ST 2022-7 active flag                                        | SMPTE ST 2022-7[^14]; implementation refs[^22]                                                              | Normative behavior; bandwidth doubling is a necessary consequence | High              |
| ST 2110-21 Narrow/NL CMAX                       | CMAX = 4, VRXFULL = 8                                             | Sender type = N or NL                                        | SMPTE ST 2110-21:2017[^8][^9]                                                                               | **Normative**                                                     | High              |
| ST 2110-21 Wide CMAX                            | CMAX = 16, VRXFULL = 720                                          | Sender type = W                                              | SMPTE ST 2110-21:2017[^8][^9]                                                                               | **Normative**                                                     | High              |
| ST 2110-21 Drain rate (TDRAIN)                  | (TFRAME / NPACKETS) × (1/β)                                       | Frame period, packet count, β factor                         | EBU / IP Showcase analysis of ST 2110-21[^9]                                                                | Normative structure; β is implementation-dependent                | Medium            |
| Aggregate link utilization ceiling              | No formula — engineering policy                                   | Link speed, total active flow bandwidth                      | **No normative standard defines this**                                                                      | **Assumed — engineering policy**                                  | Low (no standard) |
| Safety margin percentage                        | No formula — engineering policy                                   | Operator-defined                                             | **No normative standard defines this**                                                                      | **Assumed — engineering policy**                                  | Low (no standard) |
| ST 2110-40 ANC flow bandwidth                   | 50–100 kbps per flow (estimated range)                            | ANC payload inventory                                        | Observational reference only[^31][^30]                                                                      | **Assumed / Unverified**                                          | Low               |
| PTP / management traffic                        | Not calculable from standards                                     | Measured or estimated                                        | **Implementation-dependent**                                                                                | **Unverified**                                                    | Low               |

---

## Sources

Primary normative standards referenced:

- **SMPTE ST 2110-20:2017** — Professional Media Over Managed IP Networks: Uncompressed Active Video
- **SMPTE ST 2110-21:2017** — Traffic Shaping and Delivery Timing for Video
- **SMPTE ST 2110-30:2017** — PCM Digital Audio Transport
- **SMPTE ST 2110-40:2018/2023** — SMPTE ST 291-1 Ancillary Data Transport
- **SMPTE ST 2110-10:2017** — System Timing and Definitions
- **SMPTE ST 2022-7** — Seamless Protection Switching
- **VSF TR-05:2018** — Essential Formats and Descriptions for Interoperability of ST 2110-20 Video Signals[^4]
- **IETF RFC 4175** — RTP Payload Format for Uncompressed Video[^15]
- **IETF RFC 8331** — RTP Payload for SMPTE ST 291-1 Ancillary Data[^13]
- **IETF RFC 3550** — RTP: A Transport Protocol for Real-Time Applications[^6]
- **AES67-2018** — AES Standard for Audio Applications of Networks: High-Performance Streaming Audio-over-IP Interoperability[^25]
- **AMWA IS-04** — NMOS Discovery and Registration[^16]
- **AMWA IS-05** — NMOS Device Connection Management[^17]
- **AMWA IS-06** — NMOS Network Control API[^18]
- **IEEE 802.3** — Ethernet Standard (framing and L1 overhead)[^7]
- **IEEE 1588** — Precision Time Protocol (PTP)[^45]

Secondary / informative references:

- VSF/AIMS Alliance ST 2110-21 traffic model analysis (EBU Tech)[^48][^32]
- IP Showcase: Monitoring and Measuring IP Media Networks (Waidson)[^49][^8]
- IP Showcase: ST 2110-40 Deep Dive (Whitcomb)[^13]
- AIMS Alliance: ST 2110 Explained (Hildebrand)[^38][^20]
- AIMS Alliance IP Guidelines (March 2018)[^41]
- Lawo IP Networking Guide bandwidth tables[^29]
- RAVENNA/ALC Networx: AES67 & SMPTE ST 2110 Transport & Synchronization Fundamentals[^6]
- AES67 Practical Guide[^24]
- Megapixel VR: ST 2110 Inputs Calculation reference[^22]
- Cisco CVD Blueprint for IP Media (Panasonic)[^50]
- LinkedIn/SMPTE 2110 Monolithic vs Spine-Leaf (Kiss)[^37]

---

## References

1. [SMPTE ST 2110 FAQ | Society of Motion Picture & Television ...](https://www.smpte.org/smpte-st-2110-faq) - The SMPTE ST 2110 standards suite specifies the carriage, synchronization, and description of separa...

2. [Introduction to SMPTE ST 2110 - RAVENNA Network](https://www.ravenna-network.com/introduction-to-smpte-st-2110/) - In that case, ST 2110 gives a 30% saving in bandwidth. A significant bandwidth saving is because it ...

3. [[PDF] Video Services Forum (VSF) Technical Recommendation TR-05](https://static.vsf.tv/download/technical_recommendations/VSF_TR-05_2018-06-23.pdf)

4. [Microsoft Word - VSF_TR-05_v1.0.docx](https://www.vsf.tv/download/technical_recommendations/VSF_TR-05_2018-06-23.pdf)

5. [SMPTE ST 2110-30: A Fair Hearing for Audio - TVTechnology](https://www.tvtechnology.com/opinions/smpte-st-2110-30-a-fair-hearing-for-audio) - Therefore, AES67 and ST 2110-30 only allow 16-bit and 24-bit audio sampling. · Packet time. This par...

6. [[PDF] AES67 & SMPTE ST 2110: Transport & Synchronization](https://www.ravenna-network.com/wp-content/uploads/2021/11/AoIP-Transport-Synchronization-Fundamentals-in-a-Nutshell.pdf) - Packet size in bytes. Bandwidth in Mbit/s. Packetization Latency. Streams per Link. Page 62. # 84. L...

7. [The cheat code for high throughput - Ostinato](https://ostinato.org/guides/ethernet-packet-size-and-throughput) - Discover how and why packet size affects link throughput

8. [[PDF] Monitoring and Measuring IP Media Networks - IP Showcase](https://www.ipshowcase.org/wp-content/uploads/2019/05/1200-michael-waidson-IPShowcase-Monitoring-and-Measuring-IP-Media-Networks-Tektronix-NAB-2019.pdf)

9. [[PDF] An Open-source Software Toolkit for Professional Media over IP (ST ...](https://tech.ebu.ch/docs/groups/list/Live_IP_Software_Toolkit-paper.pdf) - The table shows the calculated CMAX and VRXFULL values valid for 720p60,. 1080i25 and 1080p50 (see T...

10. [SMPTE 2110 - Wikipedia](https://en.wikipedia.org/wiki/SMPTE_2110)

11. [[PDF] SMPTE ST 2110-21-22.5x33.5-high res](https://www.smpte.org/hubfs/Final-SMPTE%20ST%202110-21-22.5x33.5-high%20res%5B1%5D.pdf?hsLang=en) - The VRX Model is also based on the leaky bucket algorithm. The PRS describes how packets are to be d...

12. [Conformance Levels In Audio Over IP Networking](https://www.thebroadcastbridge.com/content/entry/18081/conformance-levels-in-audio-over-ip-networking) - ST 2110-30 has six levels of conformance for payload and packet time. Only Level A is mandatory; it ...

13. [[PDF] Deep Dive into SMPTE ST 2110-40 Ancillary Data | IP Showcase](https://www.ipshowcase.org/wp-content/uploads/2018/11/Leigh-Whitcomb-Deep_dive_into_ST_2110-40_Ancillary_Data_replacement_v2.pdf) - Ancillary Data. • Over the years, lots of things have been put into the SDI “Ancillary. Data” system...

14. [ST 2022-7 Seamless Protection Switching (Red/Blue Redundant ...](https://clearcom.com/DownloadCenter/manuals/EclipseHX_EHX_Online_Manual/Content/Chapters/Eclipse%20EHX/Chapter17/ST%202022-7%20Seamless%20Protection%20Switching.htm) - When ST 2022-7 is enabled, a second, identical copy of the data is sent or received. This can mitiga...

15. [RFC 4175 - RTP Payload Format for Uncompressed Video](https://datatracker.ietf.org/doc/html/rfc4175) - This memo specifies a packetization scheme for encapsulating uncompressed video into a payload forma...

16. [[PDF] AMWA NMOS IS-04 & IS-05: Things You Might Not Know](https://aimsalliance.org/wp-content/uploads/2023/09/1700-Andrew-Bonney-AMWA-IS0405-Things-You-Might-Not-Know-IP-Showcase-FINAL.pdf) - What are IS-04 and IS-05? • IS-04: Discovery & Registration. ‒ Allows Media Nodes and their capabili...

17. [What You Need to Know About NMOS (IS‑04/05) When Building an ...](https://promwad.com/news/guide-what-you-need-to-know-about-nmos-is-04-05-building-an-av-system) - IS-04 defines how NMOS Nodes register their presence, capabilities and API endpoints with a central ...

18. [AMWA IS-06 NMOS Network Control API Specification: Overview](https://specs.amwa.tv/is-06/branches/v1.0.x/docs/Overview.html) - Control how flows move on the network; Assure bandwidth for these media flows; Ensure network securi...

19. [[PDF] Fundamentals of IP in Broadcast Production - IP Showcase](https://ipshowcase.org/wp-content/uploads/2019/10/1000-Fundamentals-of-IP-in-Broadcast-Production.pdf) - Pixel Group Sizes. • Every supported video format listed in ST 2110-20 tables. ‒ Tables also include...

20. [[PDF] What is SMPTE ST2110? | AIMS Alliance](https://www.aimsalliance.org/wp-content/uploads/2019/02/4.-AIMS-Reception-ISE-2019-ST2110-explained-Hildebrand.pdf)

21. [[PDF] Introduction AES67 & SMPTE ST 2110 2020 Webinar Series](https://ravenna-network.com/wp-content/uploads/2021/02/Introduction-to-AES67-ST2110.pdf) - What is AES67? • Interoperability Standard for high performance Audio-over-IP networks. • Based on e...

22. [Inputs Calculations - ST-2110 - Support - Megapixel](https://support.megapixelvr.com/support/solutions/articles/103000267153-inputs-calculations-st-2110) - Calculation Notes: For calculating 2110 inputs, there are a few notes to keep in mind. 2110 does not...

23. [2110 Video Bandwidth Calculator - CT Knowledge Base](https://kb.ct-group.com/2110-video-bandwidth-calculator/) - Use the below spreadsheet to calculate the estimated bandwidth for a 2110 video stream. You can chan...

24. [[PDF] AES67 Practical Guide](<https://s10552c2bc54233da.jimcontent.com/download/version/1582101203/module/14152484023/name/AES67%20Practical%20Guide%20(2).pdf>) - 33 Transport of linear PCM audio data will be defined in ST 2110-30. While ST 2110-30 defines a few ...

25. [[PDF] AES67 and ST2110-30 Interoperability in Real Life - AIMS Alliance](https://aimsalliance.org/wp-content/uploads/2023/09/1000-Claudio-Becker-Foss-IPShowcase_DirectOut_AES67_RealLife.pdf) - AES67 – What is mandatory? • Samplerate: 48kHz. • Packet time: 1ms. • PTP v2 Synchronisation. • IGMP...

26. [[PDF] The Audio Parts of ST 2110 Explained | IP Showcase](https://www.ipshowcase.org/wp-content/uploads/2018/11/ALC-NetworX-Hildebrand_IPShowcase_IBC2018_The-Audio-Parts-of-ST-2110-Explained.pdf) - 1 to 8 audio channels at packet times of 1 ms. B. Level A +. 1 to 8 channels at packet times of 125 ...

27. [Computing VoIP traffic bandwidth consumption - INE](https://ine.com/blog/2008-10-17-computing-voip-traffic-bandwidth-consumption) - RTP header size is 12 bytes and UDP header size is 8 bytes. Typical IP header (no options) is 20 byt...

28. [Ethernet, PPPoE, IP, IPv6, and other Overhead](https://blog.linfre.de/2022/11/ethernet-pppoe-ip-ipv6-and-other-overhead/)

29. [Bandwith Examples](https://lawo.com/ip-networking-guide/bandwith-examples/)

30. [Video: Live Closed Captioning and Subtitling in SMPTE 2110-40](https://thebroadcastknowledge.com/2019/06/25/video-live-closed-captioning-and-subtitling-in-smpte-2110-40/) - The ST 2110-40 standard specifies the real-time, RTP transport of SMPTE ST 291-1 Ancillary Data pack...

31. [ST 2110-40 Archives – Page 2 of 2 - The Broadcast Knowledge](https://thebroadcastknowledge.com/tag/st-2110-40/page/2/) - Test and measurment equipment for ST 2110-40 is still under developmnent. However, with date rates o...

32. [The art of conforming to](https://tech.ebu.ch/docs/groups/list/The_art_of_conforming_to_SMPTE_2110-21_traffic_model_Part_I.pdf)

33. [Renaud Talks IP - Narrow vs. Wide Sender in 2110 - YouTube](https://www.youtube.com/watch?v=ci3VpM2eBZI) - Say hello to Renaud, protagonist of our new video series "Renaud talks IP"! In this first video, Ren...

34. [Enhancing Network Reliability: SMPTE ST 2022-7 Hitless Switching ...](https://www.rist.tv/articles-and-deep-dives/2024/5/7/enhancing-network-reliability-smpte-st-2022-7-hitless-switching-explained) - It works by using two separate transmission paths to deliver identical packet streams from a source ...

35. [2022-7 hitless switching in the era of Internet Transport](https://www.obe.tv/2022-7-hitless-in-the-era-of-internet-transport/) - 2022-7 hitless switching has been used extensively for high value content by transmitting across two...

36. [[PDF] Implementing 2022-7 Over a Single Network - IP Showcase](https://www.ipshowcase.org/wp-content/uploads/2018/11/Hartmut-Opfermann-Opfermann_20180916_1500_final.pdf) - You can use n+1 redundancy to retain the full bandwidth in case of a single switch failure. ... If y...

37. [SMPTE 2110 – Monolithic or Spine/Leaf - LinkedIn](https://www.linkedin.com/pulse/smpte-2110-monolithic-spineleaf-gergely-kiss-vymof) - Here, IGMP/PIM is not ideal because inter-switch connections may not be non-blocking, and bandwidth ...

38. [PowerPoint Presentation](https://aimsalliance.org/wp-content/uploads/2023/09/4.-AIMS-Reception-ISE-2019-ST2110-explained-Hildebrand.pdf)

39. [ST 2110: An Introduction | AVNetwork](https://www.avnetwork.com/news/st-2110-an-introduction) - ST 2110 specifies the transport, synchronization, and description of 10-bit video, audio, and ancill...

40. [Switch Configurations and Routing Mechanisms in SMPTE 2110 ...](https://muratdemirci.com.tr/en/smpte2110-routing/) - SMPTE 2110 optimizes broadcast streams using multicast technology. Therefore, switches need to suppo...

41. [[PDF] Updated MARCH 2018 - AIMS Alliance](https://www.aimsalliance.org/wp-content/uploads/2018/04/AIMS-Updated-Guidelines-for-IP-0402108.pdf) - Because SMPTE ST 2110 is based on bandwidth agnostic RTP streams and uses RTP time stamps to indicat...

42. [Three Tips To Accelerate Your IP (ST 2110) Deployments](https://www.thebroadcastbridge.com/content/entry/16803/three-tips-to-accelerate-your-ip-st-2110-deployments) - There is a lot to consider when designing an ST2110 IP network architecture: redundancy, delays in y...

43. [Video: Using AMWA IS-06 for Flow Control on Professional Media ...](https://thebroadcastknowledge.com/2020/02/07/video-using-amwa-is-06-for-flow-control-on-professional-media-networks/) - To solve these issues on SMPTE ST 2110 professional media networks the NMOS IS-06 specification has ...

44. [What is SMPTE ST 2110? | Matrox Video](https://video.matrox.com/en/media/guides-articles/what-is-smpte-st-2110) - SMPTE ST 2110 is a suite of standards defining the transport, routing, and delivery of professional ...

45. [Understanding the Fundamentals of PTP and SMPTE ST 2110](https://leaderphabrix.com/understanding-the-fundamentals-of-ptp-and-smpte-st-2110/) - This blog post explores the core principles of Precision Time Protocol (PTP) and its integral role i...

46. [SMPTE ST 2110 Explained | Margin & Virtual Buffer](https://packetstorm.com/smpte-st-2110-explained-margin-virtual-buffer-and-their-importance/) - Learn how SMPTE ST 2110 uses margin and virtual buffer to ensure reliable, synchronized IP media tra...

47. [RFC 2508 - Compressing IP/UDP/RTP Headers for Low-Speed ...](https://datatracker.ietf.org/doc/html/rfc2508) - This document describes a method for compressing the headers of IP/UDP/RTP datagrams to reduce overh...

48. [The art of conforming to SMPTE 2110-21 traffic model Part I](https://tech.ebu.ch/files/live/sites/tech/files/shared/groups/list/The_art_of_conforming_to_SMPTE_2110-21_traffic_model_Part_I.pdf)

49. [PowerPoint Presentation](https://aimsalliance.org/wp-content/uploads/2023/09/1200-michael-waidson-IPShowcase-Monitoring-and-Measuring-IP-Media-Networks-Tektronix-NAB-2019.pdf)

50. [Cisco Validated Design with Panasonic - A blueprint for IP Media ...](https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/cisco-cvd-blueprint-for-ip-media-success.html) - In a Spine-Leaf network, it is recommended that the uplink bandwidth from each Leaf to the Spine be ...
