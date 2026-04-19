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
export const DEFAULT_EVIDENCE_POLICY_VERSION = 'google_november_2024_reputation';
export const EVIDENCE_POLICY_PRESETS = {
    google_baseline_2023: {
        version: 'google_baseline_2023',
        name: 'Google Baseline (Pre-2024 Updates)',
        description: 'Baseline E-E-A-T rules before the March 2024 core update. Used for historical comparison.',
        requirements: {
            experience: {
                minCaseStudies: 1,
                minOriginalVisuals: 2,
                minFirstHandEvidence: 1,
            },
            expertise: {
                minCitations: 3,
                minDataPoints: 1,
                minUniqueInsights: 1,
            },
            authoritativeness: {
                requiresAuthorByline: true,
                requiresAuthorBio: true,
                requiresExternalValidation: false,
            },
            trustworthiness: {
                requiresLastUpdated: true,
                requiresAIDisclosure: false,
                requiresSourceAttribution: true,
                minFactCheckPasses: 0.85,
            },
        },
    },
    google_march_2024_core: {
        version: 'google_march_2024_core',
        name: 'Google March 2024 Core Update',
        description: 'Scaled content abuse detection plus helpful content integration with stricter disclosure and data requirements.',
        requirements: {
            experience: {
                minCaseStudies: 1,
                minOriginalVisuals: 2,
                minFirstHandEvidence: 1,
            },
            expertise: {
                minCitations: 3,
                minDataPoints: 2,
                minUniqueInsights: 1,
            },
            authoritativeness: {
                requiresAuthorByline: true,
                requiresAuthorBio: true,
                requiresExternalValidation: true,
            },
            trustworthiness: {
                requiresLastUpdated: true,
                requiresAIDisclosure: true,
                requiresSourceAttribution: true,
                minFactCheckPasses: 0.9,
            },
        },
    },
    google_november_2024_reputation: {
        version: 'google_november_2024_reputation',
        name: 'Google November 2024 Site Reputation Abuse',
        description: 'Adds editorial-process expectations to stricter E-E-A-T requirements for reputation-sensitive content.',
        requirements: {
            experience: {
                minCaseStudies: 1,
                minOriginalVisuals: 2,
                minFirstHandEvidence: 1,
            },
            expertise: {
                minCitations: 3,
                minDataPoints: 2,
                minUniqueInsights: 1,
            },
            authoritativeness: {
                requiresAuthorByline: true,
                requiresAuthorBio: true,
                requiresExternalValidation: true,
                requiresEditorialProcess: true,
            },
            trustworthiness: {
                requiresLastUpdated: true,
                requiresAIDisclosure: true,
                requiresSourceAttribution: true,
                minFactCheckPasses: 0.9,
            },
        },
    },
};
/**
 * Validate content against policy requirements and detect evidence gaps.
 */
export async function validateEvidence(content, options = {}) {
    const policy = resolveEvidencePolicy(options);
    const normalizedContent = normalizeContentInput(content);
    const gaps = [];
    gaps.push(...validateExperience(normalizedContent, policy.requirements.experience));
    gaps.push(...validateExpertise(normalizedContent, policy.requirements.expertise));
    gaps.push(...validateAuthoritativeness(normalizedContent, policy.requirements.authoritativeness));
    gaps.push(...validateTrustworthiness(normalizedContent, policy.requirements.trustworthiness));
    return {
        hasGaps: gaps.length > 0,
        gapCount: gaps.length,
        gaps,
        policyVersion: policy.version,
        policyName: policy.name,
        requirements: policy.requirements,
        suggestions: generateSuggestions(gaps),
    };
}
function resolveEvidencePolicy(options) {
    if (options.policy) {
        return options.policy;
    }
    if (!options.policyVersion) {
        return EVIDENCE_POLICY_PRESETS[DEFAULT_EVIDENCE_POLICY_VERSION];
    }
    const preset = EVIDENCE_POLICY_PRESETS[options.policyVersion];
    if (!preset) {
        const supported = Object.keys(EVIDENCE_POLICY_PRESETS).join(', ');
        throw new Error(`Unknown evidence policy version "${options.policyVersion}". Supported versions: ${supported}`);
    }
    return preset;
}
function normalizeContentInput(content) {
    return typeof content === 'string' ? { text: content } : content;
}
/**
 * Validate Experience pillar requirements.
 */
function validateExperience(content, requirements) {
    const gaps = [];
    const contentText = extractText(content);
    const minCaseStudies = requirements.minCaseStudies ?? 0;
    if (minCaseStudies > 0) {
        const caseStudyCount = countCaseStudies(contentText);
        if (caseStudyCount < minCaseStudies) {
            gaps.push({
                pillar: 'Experience',
                requirement: 'case_studies',
                severity: 'high',
                needed: minCaseStudies,
                found: caseStudyCount,
                missing: minCaseStudies - caseStudyCount,
                message: `Need ${minCaseStudies - caseStudyCount} more case study/studies`,
                description: 'Real-world examples demonstrating hands-on experience with the topic',
                examples: [
                    'Detailed walkthrough of using a product/service',
                    'Before/after results from personal projects',
                    'Step-by-step implementation with outcomes',
                ],
            });
        }
    }
    const minOriginalVisuals = requirements.minOriginalVisuals ?? 0;
    if (minOriginalVisuals > 0) {
        const visualCount = countVisuals(contentText);
        if (visualCount < minOriginalVisuals) {
            gaps.push({
                pillar: 'Experience',
                requirement: 'original_visuals',
                severity: 'medium',
                needed: minOriginalVisuals,
                found: visualCount,
                missing: minOriginalVisuals - visualCount,
                message: `Need ${minOriginalVisuals - visualCount} more original visual(s)`,
                description: 'Screenshots, photos, or diagrams from personal experience',
                examples: [
                    'Screenshots showing actual usage',
                    'Original photos from testing/review',
                    'Custom diagrams explaining concepts',
                ],
            });
        }
    }
    const minFirstHandEvidence = requirements.minFirstHandEvidence ?? 0;
    if (minFirstHandEvidence > 0) {
        const evidenceCount = countFirstHandEvidence(contentText);
        if (evidenceCount < minFirstHandEvidence) {
            gaps.push({
                pillar: 'Experience',
                requirement: 'first_hand_evidence',
                severity: 'high',
                needed: minFirstHandEvidence,
                found: evidenceCount,
                missing: minFirstHandEvidence - evidenceCount,
                message: `Need ${minFirstHandEvidence - evidenceCount} more first-hand evidence statement(s)`,
                description: 'Direct personal experience statements ("I tested...", "In my experience...")',
                examples: [
                    '"I spent 3 months testing this product..."',
                    '"Based on my experience implementing..."',
                    '"When I personally used this service..."',
                ],
            });
        }
    }
    return gaps;
}
/**
 * Validate Expertise pillar requirements.
 */
function validateExpertise(content, requirements) {
    const gaps = [];
    const contentText = extractText(content);
    const minCitations = requirements.minCitations ?? 0;
    if (minCitations > 0) {
        const citationCount = countCitations(contentText);
        if (citationCount < minCitations) {
            gaps.push({
                pillar: 'Expertise',
                requirement: 'citations',
                severity: 'high',
                needed: minCitations,
                found: citationCount,
                missing: minCitations - citationCount,
                message: `Need ${minCitations - citationCount} more citation(s) from authoritative sources`,
                description: 'References to research papers, expert quotes, or authoritative publications',
                examples: [
                    'Journal articles or research papers',
                    'Expert interviews or quotes',
                    'Industry reports or whitepapers',
                ],
            });
        }
    }
    const minDataPoints = requirements.minDataPoints ?? 0;
    if (minDataPoints > 0) {
        const dataPointCount = countDataPoints(contentText);
        if (dataPointCount < minDataPoints) {
            gaps.push({
                pillar: 'Expertise',
                requirement: 'data_points',
                severity: 'medium',
                needed: minDataPoints,
                found: dataPointCount,
                missing: minDataPoints - dataPointCount,
                message: `Need ${minDataPoints - dataPointCount} more data point(s) or statistic(s)`,
                description: 'Quantitative data, statistics, or research findings supporting claims',
                examples: [
                    'Statistical data (percentages, numbers)',
                    'Research findings with measurements',
                    'Industry benchmarks or comparisons',
                ],
            });
        }
    }
    const minUniqueInsights = requirements.minUniqueInsights ?? 0;
    if (minUniqueInsights > 0) {
        const insightCount = countUniqueInsights(contentText);
        if (insightCount < minUniqueInsights) {
            gaps.push({
                pillar: 'Expertise',
                requirement: 'unique_insights',
                severity: 'medium',
                needed: minUniqueInsights,
                found: insightCount,
                missing: minUniqueInsights - insightCount,
                message: `Need ${minUniqueInsights - insightCount} more unique insight(s) or analysis`,
                description: 'Original analysis or perspectives beyond surface-level information',
                examples: [
                    'Novel connections between concepts',
                    'Expert-level analysis of trade-offs',
                    'Industry predictions based on expertise',
                ],
            });
        }
    }
    return gaps;
}
/**
 * Validate Authoritativeness pillar requirements.
 */
function validateAuthoritativeness(content, requirements) {
    const gaps = [];
    const contentText = extractText(content);
    const metadata = extractMetadata(content);
    if (requirements.requiresAuthorByline && !hasAuthorByline(metadata)) {
        gaps.push({
            pillar: 'Authoritativeness',
            requirement: 'author_byline',
            severity: 'high',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'Author byline required',
            description: 'Clear author attribution with name visible',
            examples: [
                '"By John Smith, Senior Engineer"',
                '"Written by Dr. Jane Doe"',
                'Author bio at top or bottom of content',
            ],
        });
    }
    if (requirements.requiresAuthorBio && !hasAuthorBio(metadata)) {
        gaps.push({
            pillar: 'Authoritativeness',
            requirement: 'author_bio',
            severity: 'high',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'Author bio with credentials required',
            description: 'Brief bio demonstrating subject matter expertise',
            examples: [
                '"John Smith has 10 years of experience in..."',
                '"Dr. Jane Doe is a certified expert in..."',
                'Bio with relevant credentials, education, or experience',
            ],
        });
    }
    if (requirements.requiresExternalValidation && !hasExternalValidation(contentText, metadata)) {
        gaps.push({
            pillar: 'Authoritativeness',
            requirement: 'external_validation',
            severity: 'medium',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'External validation or recognition required',
            description: 'Third-party recognition of expertise (awards, certifications, media mentions)',
            examples: [
                'Industry certifications or licenses',
                'Published in authoritative outlets',
                'Expert recognition or awards',
            ],
        });
    }
    if (requirements.requiresEditorialProcess && !hasEditorialProcess(metadata)) {
        gaps.push({
            pillar: 'Authoritativeness',
            requirement: 'editorial_process',
            severity: 'medium',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'Editorial process documentation required',
            description: 'Evidence of review, fact-checking, or editorial oversight',
            examples: [
                '"Reviewed by Subject Matter Expert"',
                '"Fact-checked on [date]"',
                'Editorial standards page or review process',
            ],
        });
    }
    return gaps;
}
/**
 * Validate Trustworthiness pillar requirements.
 */
function validateTrustworthiness(content, requirements) {
    const gaps = [];
    const contentText = extractText(content);
    const metadata = extractMetadata(content);
    if (requirements.requiresLastUpdated && !hasLastUpdated(metadata)) {
        gaps.push({
            pillar: 'Trustworthiness',
            requirement: 'last_updated',
            severity: 'high',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'Last updated date required',
            description: 'Clear indication of when content was last reviewed/updated',
            examples: [
                '"Last updated: January 15, 2025"',
                '"Reviewed: Q1 2025"',
                'Publication/update timestamp',
            ],
        });
    }
    if (requirements.requiresAIDisclosure && !hasAIDisclosure(metadata)) {
        gaps.push({
            pillar: 'Trustworthiness',
            requirement: 'ai_disclosure',
            severity: 'high',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'AI usage disclosure required',
            description: 'Transparent disclosure of AI assistance in content creation',
            examples: [
                '"AI-assisted research and drafting"',
                '"Generated with AI, reviewed by human experts"',
                'Clear AI usage statement',
            ],
        });
    }
    if (requirements.requiresSourceAttribution && !hasSourceAttribution(contentText)) {
        gaps.push({
            pillar: 'Trustworthiness',
            requirement: 'source_attribution',
            severity: 'medium',
            needed: 1,
            found: 0,
            missing: 1,
            message: 'Source attribution required for claims',
            description: 'Clear attribution for facts, statistics, and quotes',
            examples: [
                'Inline citations for data',
                'Source links for statistics',
                'Proper quote attribution',
            ],
        });
    }
    return gaps;
}
/**
 * Extract text from various content formats.
 */
function extractText(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (content.text) {
        return content.text;
    }
    if (content.content) {
        return content.content;
    }
    if (content.draft) {
        return content.draft;
    }
    if (content.research) {
        if (typeof content.research === 'string') {
            return content.research;
        }
        return Object.values(content.research)
            .map((value) => stringifyResearchValue(value))
            .join('\n\n');
    }
    return JSON.stringify(content);
}
/**
 * Extract metadata from content object.
 */
function extractMetadata(content) {
    const metadata = content.metadata ?? {};
    return {
        ...metadata,
        author: content.author ?? metadata.author,
        authorBio: content.authorBio ?? metadata.authorBio,
        lastUpdated: content.lastUpdated ?? metadata.lastUpdated,
        aiDisclosure: content.aiDisclosure ?? metadata.aiDisclosure,
        editorialReview: content.editorialReview ?? metadata.editorialReview,
    };
}
function stringifyResearchValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (value == null) {
        return '';
    }
    return JSON.stringify(value);
}
/**
 * Count case studies in content.
 */
function countCaseStudies(text) {
    const caseStudyPatterns = [
        /case study:/gi,
        /real[- ]world example:/gi,
        /in (my|our) experience.*:/gi,
        /i (tested|tried|used).*and (found|discovered)/gi,
        /when (i|we) (implemented|deployed|tried)/gi,
    ];
    let count = 0;
    for (const pattern of caseStudyPatterns) {
        const matches = text.match(pattern) ?? [];
        count += matches.length;
    }
    return count;
}
/**
 * Count original visuals (images, screenshots).
 */
function countVisuals(text) {
    const visualPatterns = [
        /!\[.*?\]\(.*?\)/g,
        /<img.*?>/gi,
        /\[screenshot\]/gi,
        /\[photo\]/gi,
        /\[diagram\]/gi,
    ];
    let count = 0;
    for (const pattern of visualPatterns) {
        const matches = text.match(pattern) ?? [];
        count += matches.length;
    }
    return count;
}
/**
 * Count first-hand evidence statements.
 */
function countFirstHandEvidence(text) {
    const evidencePatterns = [
        /i (personally|actually|directly) (tested|used|tried|experienced)/gi,
        /in my (experience|testing|usage)/gi,
        /based on my (experience|testing|analysis)/gi,
        /after (testing|using|trying).*for.*weeks?|months?|years?/gi,
    ];
    let count = 0;
    for (const pattern of evidencePatterns) {
        const matches = text.match(pattern) ?? [];
        count += matches.length;
    }
    return count;
}
/**
 * Count citations (references, sources).
 */
function countCitations(text) {
    const citationPatterns = [
        /\[\d+\]/g,
        /\(https?:\/\/[^\)]+\)/g,
        /according to.*?:/gi,
        /research (shows|indicates|suggests)/gi,
        /study (published|conducted|found)/gi,
    ];
    let count = 0;
    for (const pattern of citationPatterns) {
        const matches = text.match(pattern) ?? [];
        count += matches.length;
    }
    return count;
}
/**
 * Count data points (statistics, measurements).
 */
function countDataPoints(text) {
    const dataPatterns = [
        /\d+%/g,
        /\d+\s*(users|customers|people|participants)/gi,
        /\d+x\s*(faster|slower|better|worse)/gi,
        /increased by \d+/gi,
        /decreased by \d+/gi,
    ];
    let count = 0;
    for (const pattern of dataPatterns) {
        const matches = text.match(pattern) ?? [];
        count += matches.length;
    }
    return count;
}
/**
 * Count unique insights (analysis markers).
 */
function countUniqueInsights(text) {
    const insightPatterns = [
        /interestingly,/gi,
        /what's surprising is/gi,
        /the key insight is/gi,
        /this suggests that/gi,
        /analysis reveals/gi,
        /deep dive.*shows/gi,
    ];
    let count = 0;
    for (const pattern of insightPatterns) {
        const matches = text.match(pattern) ?? [];
        count += matches.length;
    }
    return count;
}
function hasAuthorByline(metadata) {
    return Boolean(metadata.author && metadata.author.length > 0);
}
function hasAuthorBio(metadata) {
    return Boolean(metadata.authorBio && metadata.authorBio.length > 50);
}
function hasExternalValidation(text, metadata) {
    const validationPatterns = [
        /certified/gi,
        /licensed/gi,
        /award/gi,
        /recognized by/gi,
        /featured in/gi,
        /published in/gi,
    ];
    return (validationPatterns.some((pattern) => pattern.test(text)) ||
        Boolean(metadata.certifications?.length || metadata.awards?.length));
}
function hasEditorialProcess(metadata) {
    return Boolean(metadata.editorialReview || metadata.reviewer || metadata.factChecked);
}
function hasLastUpdated(metadata) {
    return Boolean(metadata.lastUpdated);
}
function hasAIDisclosure(metadata) {
    return Boolean(metadata.aiDisclosure);
}
function hasSourceAttribution(text) {
    const attributionPatterns = [/according to/gi, /source:/gi, /\(via.*?\)/gi, /credit:/gi];
    return attributionPatterns.some((pattern) => pattern.test(text));
}
/**
 * Generate actionable suggestions for fixing gaps.
 */
function generateSuggestions(gaps) {
    const groupedGaps = gaps.reduce((acc, gap) => {
        acc[gap.pillar] ??= [];
        acc[gap.pillar]?.push(gap);
        return acc;
    }, {});
    return Object.entries(groupedGaps)
        .map(([pillar, pillarGaps]) => {
        const priority = pillarGaps.some((gap) => gap.severity === 'high' || gap.severity === 'critical')
            ? 'high'
            : 'medium';
        return {
            pillar,
            priority,
            gapCount: pillarGaps.length,
            actions: pillarGaps.map((gap) => ({
                requirement: gap.requirement,
                action: gap.message,
                examples: gap.examples,
            })),
        };
    })
        .sort((left, right) => {
        const leftPriority = left.priority === 'high' ? 0 : 1;
        const rightPriority = right.priority === 'high' ? 0 : 1;
        return leftPriority - rightPriority;
    });
}
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
export function mergeEvidence(content, evidence) {
    const merged = { ...content };
    if (evidence.caseStudies !== undefined) {
        merged.caseStudies = [...(content.caseStudies ?? []), ...evidence.caseStudies];
    }
    if (evidence.citations !== undefined) {
        merged.citations = [...(content.citations ?? []), ...evidence.citations];
    }
    if (evidence.visuals !== undefined) {
        merged.visuals = [...(content.visuals ?? []), ...evidence.visuals];
    }
    if (evidence.metadata !== undefined) {
        merged.metadata = { ...(content.metadata ?? {}), ...evidence.metadata };
    }
    return merged;
}
//# sourceMappingURL=evidence-validator.js.map