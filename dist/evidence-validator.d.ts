/**
 * Evidence Validator (TypeScript)
 *
 * Detects evidence gaps in content based on policy requirements.
 * Self-contained extraction from claudeTest without policy-engine coupling.
 *
 * Key Features:
 * - Policy-driven gap detection using built-in presets or a supplied policy
 * - Pillar-specific validation (Experience, Expertise, Authoritativeness, Trustworthiness)
 * - Actionable feedback (tells creators exactly what's missing)
 * - Compatibility with the evidence library schema
 */
export type EvidencePillar = 'Experience' | 'Expertise' | 'Authoritativeness' | 'Trustworthiness';
export type EvidenceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceRequirement = 'case_studies' | 'original_visuals' | 'first_hand_evidence' | 'citations' | 'data_points' | 'unique_insights' | 'author_byline' | 'author_bio' | 'external_validation' | 'editorial_process' | 'last_updated' | 'ai_disclosure' | 'source_attribution';
export interface EvidenceGap {
    pillar: EvidencePillar;
    requirement: EvidenceRequirement;
    severity: EvidenceSeverity;
    needed: number;
    found: number;
    missing: number;
    message: string;
    description: string;
    examples: string[];
}
export interface ExperienceRequirements {
    minCaseStudies?: number;
    minOriginalVisuals?: number;
    minFirstHandEvidence?: number;
}
export interface ExpertiseRequirements {
    minCitations?: number;
    minDataPoints?: number;
    minUniqueInsights?: number;
}
export interface AuthoritativenessRequirements {
    requiresAuthorByline: boolean;
    requiresAuthorBio: boolean;
    requiresCredentials?: boolean;
    requiresExternalValidation: boolean;
    requiresEditorialProcess?: boolean;
}
export interface TrustworthinessRequirements {
    requiresLastUpdated: boolean;
    requiresAIDisclosure: boolean;
    requiresSourceAttribution: boolean;
    minFactCheckPasses?: number;
}
export interface EvidenceRequirements {
    experience: ExperienceRequirements;
    expertise: ExpertiseRequirements;
    authoritativeness: AuthoritativenessRequirements;
    trustworthiness: TrustworthinessRequirements;
}
export interface EvidencePolicy {
    version: string;
    name: string;
    description?: string;
    requirements: EvidenceRequirements;
}
export type EvidencePolicyVersion = 'google_baseline_2023' | 'google_march_2024_core' | 'google_november_2024_reputation';
export interface SuggestionAction {
    requirement: EvidenceRequirement;
    action: string;
    examples: string[];
}
export interface Suggestion {
    pillar: EvidencePillar;
    priority: 'medium' | 'high';
    gapCount: number;
    actions: SuggestionAction[];
}
export interface ValidationResult {
    hasGaps: boolean;
    gapCount: number;
    gaps: EvidenceGap[];
    policyVersion: string;
    policyName: string;
    requirements: EvidenceRequirements;
    suggestions: Suggestion[];
}
export interface ContentMetadata {
    author?: string;
    authorBio?: string;
    lastUpdated?: string;
    aiDisclosure?: string;
    editorialReview?: boolean;
    certifications?: string[];
    awards?: string[];
    reviewer?: string;
    factChecked?: boolean;
    [key: string]: unknown;
}
export type ResearchContent = string | Record<string, unknown>;
export interface ContentInput {
    text?: string;
    content?: string;
    draft?: string;
    research?: ResearchContent;
    metadata?: ContentMetadata;
    author?: string;
    authorBio?: string;
    lastUpdated?: string;
    aiDisclosure?: string;
    editorialReview?: boolean;
}
export interface ValidationOptions {
    policyVersion?: EvidencePolicyVersion | string;
    policy?: EvidencePolicy;
}
export interface EvidenceCaseStudy {
    title: string;
    summary: string;
    url?: string;
    date?: string;
    [key: string]: unknown;
}
export interface EvidenceCitation {
    url: string;
    title?: string;
    publishedDate?: string;
    [key: string]: unknown;
}
export interface EvidenceVisual {
    url: string;
    alt: string;
    caption?: string;
    [key: string]: unknown;
}
export interface MergeableContent extends ContentInput {
    caseStudies?: EvidenceCaseStudy[];
    citations?: EvidenceCitation[];
    visuals?: EvidenceVisual[];
}
export interface MergeableEvidence {
    caseStudies?: EvidenceCaseStudy[];
    citations?: EvidenceCitation[];
    visuals?: EvidenceVisual[];
    metadata?: ContentMetadata;
}
/** @deprecated Use {@link MergeableEvidence}. Kept for 0.1.x compatibility. */
export type SubmittedEvidence = MergeableEvidence;
export declare const DEFAULT_EVIDENCE_POLICY_VERSION: EvidencePolicyVersion;
export declare const EVIDENCE_POLICY_PRESETS: Record<EvidencePolicyVersion, EvidencePolicy>;
/**
 * Validate content against policy requirements and detect evidence gaps.
 */
export declare function validateEvidence(content: ContentInput | string, options?: ValidationOptions): Promise<ValidationResult>;
/**
 * Merge library-retrieved evidence assets into a draft.
 *
 * Pure, deterministic transformation over {@link ContentInput}: case studies,
 * citations, and visuals are appended to their corresponding arrays; metadata
 * is shallow-merged into the existing metadata block. Does not mutate the
 * input. Does not call an LLM. If an evidence field is absent, the
 * corresponding output field is left exactly as it was (no empty array or
 * null coercion).
 *
 * Intended as the deterministic "inject" step of the Evidence Engine gap-fill
 * loop: validate → query library → mergeEvidence → LLM re-draft → re-validate.
 */
export declare function mergeEvidence(content: MergeableContent, evidence: MergeableEvidence): MergeableContent;
//# sourceMappingURL=evidence-validator.d.ts.map