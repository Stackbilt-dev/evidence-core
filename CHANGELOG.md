# Changelog

All notable changes to `@stackbilt/evidence-core` will be documented in this file.

## [0.1.0] - Unreleased

### Added
- Initial extraction from `aegis-daemon` (`web/src/lib/evidence/`).
- `validateEvidence(content, options)` — async validator emitting pillar-scoped gap reports with actionable suggestions.
- `mergeEvidence(content, submitted)` — helper for injecting user-submitted evidence (case studies, citations, visuals) into a draft.
- Three built-in policy presets tied to real Google algorithm updates:
  - `google_baseline_2023` — pre-update baseline.
  - `google_march_2024_core` — scaled content abuse + helpful content integration.
  - `google_november_2024_reputation` — adds editorial-process requirements for reputation-sensitive content (default).
- Four E-E-A-T pillars × thirteen requirement types covering Experience, Expertise, Authoritativeness, and Trustworthiness.
- Evidence library JSON Schema (`@stackbilt/evidence-core/schema`) for validating consumer asset stores.

### Notes
- Pre-1.0; API may still change. Not yet published to npm — consume via git dependency or the published tarball in the GitHub release once tagged.
