import type { MergeableEvidence, ValidationResult } from '../evidence-validator';

export const EVIDENCE_CORE_VERSION = '@stackbilt/evidence-core@0.1.0';

/** Shape-compatible with audit-chain's writeRecord() options (minus bindings + chainHead). */
export interface EvidenceAuditRecord {
  namespace: string;
  event_type: string;
  actor: string;
  payload: Record<string, unknown>;
}

export interface ToAuditPayloadOptions {
  contentId: string;
  /** Defaults to `content:{contentId}` */
  namespace?: string;
  /** Defaults to `system:evidence-engine` */
  actor?: string;
  /** SHA-256 or other hash of the content body */
  contentHash?: string;
}

/**
 * Usage with audit-chain:
 *   const record = toAuditPayload(result, { contentId });
 *   await writeRecord(bindings, { ...record, chainHead });
 *
 * Emits `evidence.validation.completed`. Callers emit supplemental events
 * (gaps.detected, assets.merged, publish.allowed/blocked) from workflow context.
 */
export function toAuditPayload(
  result: ValidationResult,
  options: ToAuditPayloadOptions,
): EvidenceAuditRecord {
  const namespace = options.namespace ?? `content:${options.contentId}`;
  const actor = options.actor ?? 'system:evidence-engine';

  const criticalSeverityCount = result.gaps.filter(g => g.severity === 'critical').length;
  const highSeverityCount = result.gaps.filter(g => g.severity === 'high').length;
  const pillarsAffected = [...new Set(result.gaps.map(g => g.pillar))];

  return {
    namespace,
    event_type: 'evidence.validation.completed',
    actor,
    payload: {
      contentId: options.contentId,
      policyVersion: result.policyVersion,
      policyName: result.policyName,
      hasGaps: result.hasGaps,
      gapCount: result.gapCount,
      suggestionCount: result.suggestions.length,
      criticalSeverityCount,
      highSeverityCount,
      pillarsAffected,
      validatorVersion: EVIDENCE_CORE_VERSION,
      timestamp: new Date().toISOString(),
      ...(options.contentHash !== undefined && { contentHash: options.contentHash }),
    },
  };
}

/** Build an assets-merged record from a MergeableEvidence object. */
export function toAssetsAuditPayload(
  evidence: MergeableEvidence,
  options: ToAuditPayloadOptions,
): EvidenceAuditRecord {
  const namespace = options.namespace ?? `content:${options.contentId}`;
  const actor = options.actor ?? 'system:evidence-engine';

  return {
    namespace,
    event_type: 'evidence.assets.merged',
    actor,
    payload: {
      contentId: options.contentId,
      caseStudiesAdded: evidence.caseStudies?.length ?? 0,
      citationsAdded: evidence.citations?.length ?? 0,
      visualsAdded: evidence.visuals?.length ?? 0,
      timestamp: new Date().toISOString(),
    },
  };
}
