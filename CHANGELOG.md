# Changelog

All notable changes to `@stackbilt/evidence-core` will be documented in this file.

## [0.1.0] - Unreleased

### Added
- Initial extraction from `aegis-daemon` (`web/src/lib/evidence/`).
- `validateEvidence(content, options)` — async validator emitting pillar-scoped gap reports with actionable suggestions.
- `mergeEvidence(content, evidence)` — pure, deterministic helper for injecting library-retrieved evidence (case studies, citations, visuals, metadata) into a draft. No LLM call, no input mutation, no null coercion for absent fields.
- Typed asset shapes `EvidenceCaseStudy`, `EvidenceCitation`, `EvidenceVisual`, and the `MergeableEvidence` input type (supersedes the looser `SubmittedEvidence`, kept as a deprecated alias).
- Three built-in policy presets tied to real Google algorithm updates:
  - `google_baseline_2023` — pre-update baseline.
  - `google_march_2024_core` — scaled content abuse + helpful content integration.
  - `google_november_2024_reputation` — adds editorial-process requirements for reputation-sensitive content (default).
- Four E-E-A-T pillars × thirteen requirement types covering Experience, Expertise, Authoritativeness, and Trustworthiness.
- Evidence library JSON Schema (`@stackbilt/evidence-core/schema`) for validating consumer asset stores.

### Notes
- Pre-1.0; API may still change. Not yet published to npm — consume via git dependency or the published tarball in the GitHub release once tagged.
