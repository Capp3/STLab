# Research

Research workspace for building a high-trust, citation-backed technical truth source for ST 2110 system design in ST Lab.

Prompts run on [Perplexity Pro](https://perplexity.ai/)

## Goal

Create accurate, standards-grounded reports that support:

- ST 2110 transport and essence modelling
- PTP timing design and validation
- Bandwidth and capacity planning
- Cross-domain architecture and implementation guidance

## Folder Structure

- `prompts/` - standalone LLM prompts (single-entry, non-layered)
  - `prompt-master.md`
  - `prompt-st2110.md`
  - `prompt-ptp.md`
  - `prompt-bandwidth.md`
- report outputs (root of `research/`)
  - `report-master.md`
  - `report-st2110.md`
  - `report-ptp.md`
  - `report-bandwidth.md`

## Prompt to Report Mapping

- `prompts/prompt-master.md` -> `report-master.md`
- `prompts/prompt-st2110.md` -> `report-st2110.md`
- `prompts/prompt-ptp.md` -> `report-ptp.md`
- `prompts/prompt-bandwidth.md` -> `report-bandwidth.md`

## Operating Rules

- Each prompt is run independently (no layered prompt dependency).
- Every technical claim should be citation-backed.
- Normative requirements must be separated from best practice.
- Uncertain items should be marked as `Unverified`.
- Source versions/dates should be captured in each report.
