# @stackbilt/evidence-core

E-E-A-T content-quality validator: Google policy-versioned gap detection for AI-generated content.

## Why

Post-March 2024 Google core update + November 2024 site reputation abuse update, AI-generated content without Experience / Expertise / Authoritativeness / Trustworthiness signals is buried in search. Most SEO tooling emits vague guidance ("your content needs more authority"). `evidence-core` emits **concrete actions tied to specific Google policy versions** so a creator — or a content pipeline — knows exactly what evidence is missing and what to add.

This package is the OSS core of [Evidence Engine](https://github.com/Stackbilt-dev/stackbilt-web/issues/82), a pre-publish content-quality gate shipped as part of Stackbilder Pro.

## Install

```bash
npm install @stackbilt/evidence-core
# or
pnpm add @stackbilt/evidence-core
```

## Quick start

```ts
import { validateEvidence } from '@stackbilt/evidence-core';

const result = await validateEvidence({
  text: 'Your draft content here...',
  author: 'Jane Doe',
  authorBio: 'Senior content strategist with 10 years...',
  lastUpdated: '2026-04-19',
  aiDisclosure: 'AI-assisted, human-reviewed',
}, {
  policyVersion: 'google_november_2024_reputation',
});

if (result.hasGaps) {
  for (const suggestion of result.suggestions) {
    console.log(`[${suggestion.priority}] ${suggestion.pillar}:`);
    for (const action of suggestion.actions) {
      console.log(`  - ${action.action}`);
      console.log(`    e.g. ${action.examples[0]}`);
    }
  }
}
```

## Policy versions

Each preset maps to a real Google algorithm update. Pick the version that matches your content's risk surface.

| Version | When to use |
|---|---|
| `google_baseline_2023` | Historical comparison / legacy archive re-scoring |
| `google_march_2024_core` | Scaled content abuse + helpful content guidance; lower bar than reputation preset |
| `google_november_2024_reputation` (default) | Reputation-sensitive verticals (YMYL, review, how-to); adds editorial-process requirements |

You can also supply a custom `EvidencePolicy` via `options.policy`.

## Pillars and requirements

**Experience** — real-world first-hand signals
- `minCaseStudies`, `minOriginalVisuals`, `minFirstHandEvidence`

**Expertise** — substantive, informed treatment
- `minCitations`, `minDataPoints`, `minUniqueInsights`

**Authoritativeness** — signals of the author's or publisher's credibility
- `requiresAuthorByline`, `requiresAuthorBio`, `requiresExternalValidation`, `requiresEditorialProcess`

**Trustworthiness** — transparency + source integrity
- `requiresLastUpdated`, `requiresAIDisclosure`, `requiresSourceAttribution`

## Evidence library schema

A JSON Schema for modeling an evidence asset library (case studies, customer quotes, original visuals, proprietary data, etc.) is exported at `@stackbilt/evidence-core/schema`:

```ts
import schema from '@stackbilt/evidence-core/schema' assert { type: 'json' };
```

The schema is a reference contract; storage is left to the consumer (D1, Postgres, flat file, etc.). The companion `mergeEvidence(content, evidence)` helper injects library-retrieved evidence into a draft.

## Gap-fill with `mergeEvidence`

`mergeEvidence(content, evidence)` is the deterministic "inject" step of a gap-fill loop. Validate a draft, look up library assets that address the gaps, merge them into the draft, then re-draft with an LLM and re-validate. The merge itself is a pure, synchronous transformation — no LLM call, no mutation of the input, and no null coercion (absent evidence fields leave the output fields absent).

```ts
import { validateEvidence, mergeEvidence } from '@stackbilt/evidence-core';

let draft = {
  text: 'Your draft...',
  author: 'Jane Doe',
  authorBio: 'Senior content strategist with 10 years...',
};

let result = await validateEvidence(draft);
while (result.hasGaps) {
  const assets = await queryEvidenceLibrary(result.gaps); // consumer-supplied
  draft = mergeEvidence(draft, {
    caseStudies: assets.caseStudies, // [{ title, summary, url?, date? }]
    citations: assets.citations,     // [{ url, title?, publishedDate? }]
    visuals: assets.visuals,         // [{ url, alt, caption? }]
    metadata: { lastUpdated: '2026-04-19' },
  });
  draft.text = await llmRedraft(draft); // consumer-supplied
  result = await validateEvidence(draft);
}
```

## Audit integration

The `./audit` export provides audit trail hooks for validation and evidence-merge events. Records are shaped to be compatible with `@stackbilt/audit-chain`'s `writeRecord()` — no production dependency, but integration point is well-defined.

### Exported types

- `EvidenceAuditEvent` — union of 8 event types: `validation.started`, `validation.completed`, `gaps.detected`, `assets.merged`, `redraft.completed`, `approval.granted`, `publish.allowed`, `publish.blocked`
- `EvidenceAuditRecord` — audit record shape (`namespace`, `event_type`, `actor`, `payload`), matching `@stackbilt/audit-chain`'s `writeRecord()` options minus `chainHead` (caller supplies that when writing — see usage example below). `contentId` and other event-specific fields live inside `payload`, not top-level.
- `ToAuditPayloadOptions` — config for payload generation

### Transform functions

```ts
toAuditPayload(result: ValidationResult, options: ToAuditPayloadOptions): EvidenceAuditRecord
```
Converts a `validateEvidence()` result into an audit record. Records the event type based on validation outcome (gaps detected, validation completed, etc.).

```ts
toAssetsAuditPayload(evidence: MergeableEvidence, options: ToAuditPayloadOptions): EvidenceAuditRecord
```
Records the assets-merge event after calling `mergeEvidence()`.

### Usage example

```ts
import { validateEvidence, mergeEvidence } from '@stackbilt/evidence-core';
import { toAuditPayload, toAssetsAuditPayload } from '@stackbilt/evidence-core/audit';
// audit-chain is optional — wire it at the app layer, not imported here
import { writeRecord, getChainHead } from '@stackbilt/audit-chain';

const contentId = 'article:uuid-12345';
const content = { text: '...', author: 'Jane Doe' };

// Validate and record the event
const result = await validateEvidence(content, { policyVersion: 'google_march_2024_core' });
const record = toAuditPayload(result, {
  contentId,
  contentHash: sha256(content.text), // optional
  actor: 'user:operator-id',         // optional, defaults to 'system:evidence-engine'
});

// Wire with audit-chain if available
const chainHead = await getChainHead(bindings, record.namespace);
await writeRecord(bindings, { ...record, chainHead });

// After merging evidence assets
const evidence = { caseStudies: [...], citations: [...] };
const mergedContent = mergeEvidence(content, evidence);
const assetsRecord = toAssetsAuditPayload(evidence, { contentId });
const updatedHead = await getChainHead(bindings, assetsRecord.namespace);
await writeRecord(bindings, { ...assetsRecord, chainHead: updatedHead });
```

### Namespace conventions

- Default namespace: `content:{contentId}` (e.g., `content:article-123`)
- Multi-tenant: `tenant:{tenantId}:content:{contentId}` (e.g., `tenant:t-456:content:article-123`)
- Override via `ToAuditPayloadOptions.namespace`

`@stackbilt/audit-chain` is not declared as a dependency (peer or otherwise) — evidence-core ships with zero runtime dependencies. Consumers wire audit records into a chain at the application layer.

## Heuristic scope

Pillar counters use regex patterns (case-study markers, citation links, first-hand-experience phrases, data points, etc.) — intentional design trade-off: deterministic, fast, no LLM dependency, runs in any environment including Cloudflare Workers. Consumers who want LLM-grade semantic counting should layer that on top.

## License

Apache-2.0 © Stackbilt LLC. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
