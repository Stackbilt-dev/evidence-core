import type { EvidencePillar } from '../evidence-validator';
export interface EvidenceAuditEventBase {
    event_type: string;
    namespace: string;
    actor: string;
    timestamp: string;
}
export interface EvidenceValidationStarted extends EvidenceAuditEventBase {
    event_type: 'evidence.validation.started';
    contentId: string;
    policyVersion: string;
}
export interface EvidenceValidationCompleted extends EvidenceAuditEventBase {
    event_type: 'evidence.validation.completed';
    contentId: string;
    policyVersion: string;
    policyName: string;
    hasGaps: boolean;
    gapCount: number;
    suggestionCount: number;
    validatorVersion: string;
    contentHash?: string;
}
export interface EvidenceGapsDetected extends EvidenceAuditEventBase {
    event_type: 'evidence.gaps.detected';
    contentId: string;
    policyVersion: string;
    gapCount: number;
    pillarsAffected: EvidencePillar[];
    highSeverityCount: number;
    criticalSeverityCount: number;
}
export interface EvidenceAssetsMerged extends EvidenceAuditEventBase {
    event_type: 'evidence.assets.merged';
    contentId: string;
    caseStudiesAdded: number;
    citationsAdded: number;
    visualsAdded: number;
}
export interface EvidenceRedraftCompleted extends EvidenceAuditEventBase {
    event_type: 'evidence.redraft.completed';
    contentId: string;
    policyVersion: string;
}
export interface EvidenceApprovalGranted extends EvidenceAuditEventBase {
    event_type: 'evidence.approval.granted';
    contentId: string;
    approvedBy: string;
}
export interface EvidencePublishAllowed extends EvidenceAuditEventBase {
    event_type: 'evidence.publish.allowed';
    contentId: string;
    policyVersion: string;
    validatorVersion: string;
}
export interface EvidencePublishBlocked extends EvidenceAuditEventBase {
    event_type: 'evidence.publish.blocked';
    contentId: string;
    policyVersion: string;
    reason: string;
    gapCount: number;
}
export type EvidenceAuditEvent = EvidenceValidationStarted | EvidenceValidationCompleted | EvidenceGapsDetected | EvidenceAssetsMerged | EvidenceRedraftCompleted | EvidenceApprovalGranted | EvidencePublishAllowed | EvidencePublishBlocked;
//# sourceMappingURL=events.d.ts.map