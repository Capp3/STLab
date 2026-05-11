# ST Lab — Product Context

## Problem Being Solved

IP convergence (ST 2110) places audio, video, timing, control, and management on shared network infrastructure. Engineers struggle with:
- Path tracing across complex multi-plane topologies
- Capacity reasoning (bandwidth budgets, switch utilization)
- Documentation that stays in sync with the design

## Target User

Broadcast/media engineers designing ST 2110 facilities and IP media networks.

## Core Workflow

**Model → Validate → Document**

1. Create project, place nodes (sources, destinations, switches, grandmaster, NMOS devices)
2. Connect with plane-aware links, assign capacities and essence counts
3. Review violations (oversubscribed switches, utilization warnings, PTP inconsistencies)
4. Generate engineering report from persisted state
5. Export for design review package

## Why Node-RED as UX Reference

- Engineers already understand flow-based visual editors
- Palette + workspace + wiring + inspect pattern is proven
- ST Lab adapts the model for ST 2110 domain semantics (essences, planes, PTP)

## Reports as First-Class Deliverable

Reports are not an afterthought — they are the primary engineering output. Must be:
- Generated server-side from PostgreSQL state
- Exportable as HTML and print-ready PDF
- Reproducible from any saved design revision

## Key Differentiators

- Essence-centric language (SMPTE terminology throughout)
- Multiple simultaneous network planes without cross-plane confusion
- PTP engineering calculations during planning (not after deployment)
- Time-aware bandwidth datapoints (design-time placeholders; simulation-ready later)
