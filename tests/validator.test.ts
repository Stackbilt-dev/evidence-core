import { describe, it, expect } from 'vitest';
import { mergeEvidence, validateEvidence } from '../src';

describe('validateEvidence', () => {
  it('flags all four pillars on empty content under default policy', async () => {
    const result = await validateEvidence('');
    expect(result.hasGaps).toBe(true);
    const pillars = new Set(result.gaps.map((gap) => gap.pillar));
    expect(pillars.has('Experience')).toBe(true);
    expect(pillars.has('Expertise')).toBe(true);
    expect(pillars.has('Authoritativeness')).toBe(true);
    expect(pillars.has('Trustworthiness')).toBe(true);
  });

  it('accepts a string or a ContentInput object', async () => {
    const asString = await validateEvidence('hello');
    const asObject = await validateEvidence({ text: 'hello' });
    expect(asString.gapCount).toBe(asObject.gapCount);
  });

  it('resolves author byline from top-level input', async () => {
    const result = await validateEvidence({
      text: 'body',
      author: 'Jane Doe',
    });
    const bylineGap = result.gaps.find((gap) => gap.requirement === 'author_byline');
    expect(bylineGap).toBeUndefined();
  });

  it('bio must be at least 50 characters to count', async () => {
    const tooShort = await validateEvidence({ text: 'x', authorBio: 'short' });
    const longEnough = await validateEvidence({
      text: 'x',
      authorBio: 'Jane is a senior engineer with a decade of experience in distributed systems.',
    });
    expect(tooShort.gaps.some((gap) => gap.requirement === 'author_bio')).toBe(true);
    expect(longEnough.gaps.some((gap) => gap.requirement === 'author_bio')).toBe(false);
  });

  it('detects case-study markers in content', async () => {
    const result = await validateEvidence({
      text: 'Case study: when I implemented the new pipeline, I tested three approaches and found the right one.',
    });
    const caseGap = result.gaps.find((gap) => gap.requirement === 'case_studies');
    expect(caseGap).toBeUndefined();
  });

  it('detects citations via bracketed numbers and URLs', async () => {
    const result = await validateEvidence({
      text: 'According to recent research [1] (https://example.com), research shows the trend. Also see study published here [2] (https://foo.bar).',
    });
    const citationGap = result.gaps.find((gap) => gap.requirement === 'citations');
    expect(citationGap).toBeUndefined();
  });

  it('source attribution satisfied by the phrase "according to"', async () => {
    const result = await validateEvidence(
      { text: 'According to industry reports, the number increased by 42%.' },
      { policyVersion: 'google_baseline_2023' },
    );
    const attrGap = result.gaps.find((gap) => gap.requirement === 'source_attribution');
    expect(attrGap).toBeUndefined();
  });

  it('suggestion priority is high when any gap has high severity', async () => {
    const result = await validateEvidence('');
    const highPrioritySuggestions = result.suggestions.filter(
      (suggestion) => suggestion.priority === 'high',
    );
    expect(highPrioritySuggestions.length).toBeGreaterThan(0);
  });

  it('suggestions are sorted with high priority first', async () => {
    const result = await validateEvidence('');
    const firstPriority = result.suggestions[0]?.priority;
    expect(firstPriority === 'high' || result.suggestions.length <= 1).toBe(true);
  });

  it('returns zero gaps when content satisfies all november_2024 requirements', async () => {
    const result = await validateEvidence({
      text: [
        'Case study: when I deployed this to production, I tested it across five regions.',
        'In my experience testing distributed systems for years, I found the pattern clear.',
        'I personally tested the rollout after trying three variants over weeks.',
        'According to recent research [1] (https://example.com), research shows the trend.',
        'Study published [2] (https://example.org) found measurable impact.',
        'In a study conducted by the vendor (https://example.net), research indicates 42% uplift.',
        'The deployment served 10000 users and was 3x faster than baseline, increased by 25%.',
        'Interestingly, this suggests that the caching layer is the bottleneck — analysis reveals a clear pattern.',
        '![screenshot](https://img.example.com/a.png)',
        '![photo](https://img.example.com/b.png)',
      ].join('\n\n'),
      author: 'Jane Doe',
      authorBio:
        'Jane is a senior site reliability engineer at ExampleCo with a decade of production experience in distributed systems.',
      lastUpdated: '2026-04-19',
      aiDisclosure: 'AI-assisted research and drafting, human-reviewed.',
      metadata: {
        author: 'Jane Doe',
        certifications: ['AWS SA Pro'],
        editorialReview: true,
      },
    });
    expect(result.hasGaps).toBe(false);
    expect(result.gapCount).toBe(0);
  });
});

describe('mergeEvidence', () => {
  const caseStudyA = { title: 'A', summary: 'First case study' };
  const caseStudyB = { title: 'B', summary: 'Second case study', url: 'https://ex.com/b' };
  const citationA = { url: 'https://a.example' };
  const citationB = { url: 'https://b.example', title: 'B paper', publishedDate: '2025-01-15' };
  const visualA = { url: 'https://img.example/a.png', alt: 'diagram A' };

  it('appends evidence case studies to existing array', () => {
    const merged = mergeEvidence(
      { caseStudies: [caseStudyA], citations: [] },
      { caseStudies: [caseStudyB], citations: [citationA] },
    );
    expect(merged.caseStudies).toEqual([caseStudyA, caseStudyB]);
    expect(merged.citations).toEqual([citationA]);
  });

  it('appends visuals when provided', () => {
    const merged = mergeEvidence({}, { visuals: [visualA] });
    expect(merged.visuals).toEqual([visualA]);
  });

  it('merges metadata shallowly (evidence values win)', () => {
    const merged = mergeEvidence(
      { metadata: { author: 'A', factChecked: false } },
      { metadata: { factChecked: true, reviewer: 'B' } },
    );
    expect(merged.metadata).toEqual({ author: 'A', factChecked: true, reviewer: 'B' });
  });

  it('leaves content untouched when empty evidence is submitted', () => {
    const original = { text: 'body', caseStudies: [caseStudyA] };
    const merged = mergeEvidence(original, {});
    expect(merged).toEqual(original);
  });

  it('round-trip: merging empty evidence is a deep-equal no-op', () => {
    const original = {
      text: 'draft body',
      author: 'Jane Doe',
      metadata: { lastUpdated: '2026-04-19' },
      caseStudies: [caseStudyA],
      citations: [citationB],
      visuals: [visualA],
    };
    const merged = mergeEvidence(original, {});
    expect(merged).toEqual(original);
  });

  it('does not mutate the input content', () => {
    const content = { text: 'body', caseStudies: [caseStudyA], metadata: { author: 'A' } };
    const snapshot = JSON.parse(JSON.stringify(content));
    mergeEvidence(content, {
      caseStudies: [caseStudyB],
      citations: [citationA],
      metadata: { reviewer: 'R' },
    });
    expect(content).toEqual(snapshot);
  });

  it('absent evidence fields leave output fields absent (no null coercion)', () => {
    const merged = mergeEvidence({ text: 'body' }, {});
    expect('caseStudies' in merged).toBe(false);
    expect('citations' in merged).toBe(false);
    expect('visuals' in merged).toBe(false);
    expect('metadata' in merged).toBe(false);
  });

  it('empty array evidence field still produces the field (explicit opt-in)', () => {
    const merged = mergeEvidence({}, { caseStudies: [] });
    expect(merged.caseStudies).toEqual([]);
  });
});
