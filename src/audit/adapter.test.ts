import { describe, it, expect } from 'vitest';
import { toAuditPayload, toAssetsAuditPayload, EVIDENCE_CORE_VERSION } from './adapter';
import type { ValidationResult } from '../evidence-validator';

const makeResult = (hasGaps: boolean): ValidationResult => ({
  hasGaps,
  gapCount: hasGaps ? 2 : 0,
  gaps: hasGaps
    ? [
        {
          pillar: 'Experience',
          requirement: 'case_studies',
          severity: 'high',
          needed: 2,
          found: 0,
          missing: 2,
          message: 'Missing case studies',
          description: 'Add case studies',
          examples: [],
        },
        {
          pillar: 'Trustworthiness',
          requirement: 'ai_disclosure',
          severity: 'critical',
          needed: 1,
          found: 0,
          missing: 1,
          message: 'Missing AI disclosure',
          description: 'Add AI disclosure',
          examples: [],
        },
      ]
    : [],
  policyVersion: 'google_baseline_2023',
  policyName: 'Google Baseline 2023',
  requirements: {} as ValidationResult['requirements'],
  suggestions: hasGaps
    ? [{ pillar: 'Experience', priority: 'high', gapCount: 1, actions: [] }]
    : [],
});

describe('toAuditPayload', () => {
  it('emits evidence.validation.completed event type', () => {
    const record = toAuditPayload(makeResult(true), { contentId: 'abc123' });
    expect(record.event_type).toBe('evidence.validation.completed');
  });

  it('uses default namespace and actor', () => {
    const record = toAuditPayload(makeResult(false), { contentId: 'abc123' });
    expect(record.namespace).toBe('content:abc123');
    expect(record.actor).toBe('system:evidence-engine');
  });

  it('respects custom namespace and actor', () => {
    const record = toAuditPayload(makeResult(false), {
      contentId: 'abc123',
      namespace: 'tenant:t1:content:abc123',
      actor: 'user:editor@example.com',
    });
    expect(record.namespace).toBe('tenant:t1:content:abc123');
    expect(record.actor).toBe('user:editor@example.com');
  });

  it('counts gap severities correctly', () => {
    const record = toAuditPayload(makeResult(true), { contentId: 'abc123' });
    expect(record.payload.criticalSeverityCount).toBe(1);
    expect(record.payload.highSeverityCount).toBe(1);
    expect(record.payload.pillarsAffected).toEqual(['Experience', 'Trustworthiness']);
  });

  it('includes validatorVersion', () => {
    const record = toAuditPayload(makeResult(false), { contentId: 'abc123' });
    expect(record.payload.validatorVersion).toBe(EVIDENCE_CORE_VERSION);
  });

  it('omits contentHash when not provided', () => {
    const record = toAuditPayload(makeResult(false), { contentId: 'abc123' });
    expect('contentHash' in record.payload).toBe(false);
  });

  it('includes contentHash when provided', () => {
    const record = toAuditPayload(makeResult(false), {
      contentId: 'abc123',
      contentHash: 'sha256:deadbeef',
    });
    expect(record.payload.contentHash).toBe('sha256:deadbeef');
  });

  it('payload hasGaps matches result', () => {
    expect(toAuditPayload(makeResult(true), { contentId: 'x' }).payload.hasGaps).toBe(true);
    expect(toAuditPayload(makeResult(false), { contentId: 'x' }).payload.hasGaps).toBe(false);
  });
});

describe('toAssetsAuditPayload', () => {
  it('emits evidence.assets.merged event type', () => {
    const record = toAssetsAuditPayload(
      { caseStudies: [{ title: 'A', summary: 'B' }], citations: [], visuals: [] },
      { contentId: 'abc123' },
    );
    expect(record.event_type).toBe('evidence.assets.merged');
  });

  it('counts added assets correctly', () => {
    const record = toAssetsAuditPayload(
      {
        caseStudies: [{ title: 'A', summary: 'B' }],
        citations: [{ url: 'https://a.com' }, { url: 'https://b.com' }],
        visuals: [],
      },
      { contentId: 'abc123' },
    );
    expect(record.payload.caseStudiesAdded).toBe(1);
    expect(record.payload.citationsAdded).toBe(2);
    expect(record.payload.visualsAdded).toBe(0);
  });

  it('handles undefined asset arrays', () => {
    const record = toAssetsAuditPayload({}, { contentId: 'abc123' });
    expect(record.payload.caseStudiesAdded).toBe(0);
    expect(record.payload.citationsAdded).toBe(0);
    expect(record.payload.visualsAdded).toBe(0);
  });
});
