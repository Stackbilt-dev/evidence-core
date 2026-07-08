import type { MergeableEvidence, ValidationResult } from '../evidence-validator';
export declare const EVIDENCE_CORE_VERSION = "@stackbilt/evidence-core@0.1.0";
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
export declare function toAuditPayload(result: ValidationResult, options: ToAuditPayloadOptions): EvidenceAuditRecord;
/** Build an assets-merged record from a MergeableEvidence object. */
export declare function toAssetsAuditPayload(evidence: MergeableEvidence, options: ToAuditPayloadOptions): EvidenceAuditRecord;
//# sourceMappingURL=adapter.d.ts.map