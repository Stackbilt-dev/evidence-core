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
- `./audit` subpath export — `toAuditPayload()` / `toAssetsAuditPayload()` transform a `validateEvidence()` / `mergeEvidence()` result into a `{namespace, event_type, actor, payload}` record shape-compatible with `@stackbilt/audit-chain`'s `writeRecord()` options. `EvidenceAuditEvent` — union of 8 event types spanning the validate → merge → redraft → approve → publish lifecycle. No dependency on audit-chain; wire it at the application layer.

### Notes
- Pre-1.0; API may still change.
- Published to npm as `0.1.0`; `main` has moved ahead of that tag (mergeEvidence type-tightening, the `./audit` subpath) — consumers tracking latest should use `github:Stackbilt-dev/evidence-core#main` until the next npm publish.
