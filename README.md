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

The schema is a reference contract; storage is left to the consumer (D1, Postgres, flat file, etc.). The companion `mergeEvidence(content, submitted)` helper injects library-retrieved evidence into a draft.

## Heuristic scope

Pillar counters use regex patterns (case-study markers, citation links, first-hand-experience phrases, data points, etc.) — intentional design trade-off: deterministic, fast, no LLM dependency, runs in any environment including Cloudflare Workers. Consumers who want LLM-grade semantic counting should layer that on top.

## License

Apache-2.0 © Stackbilt LLC. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
