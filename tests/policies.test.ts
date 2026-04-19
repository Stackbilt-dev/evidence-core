import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EVIDENCE_POLICY_VERSION,
  EVIDENCE_POLICY_PRESETS,
  validateEvidence,
} from '../src';

describe('policy presets', () => {
  it('exposes all three Google policy versions', () => {
    expect(EVIDENCE_POLICY_PRESETS.google_baseline_2023).toBeDefined();
    expect(EVIDENCE_POLICY_PRESETS.google_march_2024_core).toBeDefined();
    expect(EVIDENCE_POLICY_PRESETS.google_november_2024_reputation).toBeDefined();
  });

  it('defaults to november_2024_reputation', () => {
    expect(DEFAULT_EVIDENCE_POLICY_VERSION).toBe('google_november_2024_reputation');
  });

  it('each preset has all four pillars', () => {
    for (const preset of Object.values(EVIDENCE_POLICY_PRESETS)) {
      expect(preset.requirements.experience).toBeDefined();
      expect(preset.requirements.expertise).toBeDefined();
      expect(preset.requirements.authoritativeness).toBeDefined();
      expect(preset.requirements.trustworthiness).toBeDefined();
    }
  });

  it('november_2024_reputation requires editorial process (stricter than march_2024)', () => {
    const nov = EVIDENCE_POLICY_PRESETS.google_november_2024_reputation;
    const mar = EVIDENCE_POLICY_PRESETS.google_march_2024_core;
    expect(nov.requirements.authoritativeness.requiresEditorialProcess).toBe(true);
    expect(mar.requirements.authoritativeness.requiresEditorialProcess).toBeFalsy();
  });

  it('march_2024_core requires AI disclosure (stricter than baseline_2023)', () => {
    const mar = EVIDENCE_POLICY_PRESETS.google_march_2024_core;
    const base = EVIDENCE_POLICY_PRESETS.google_baseline_2023;
    expect(mar.requirements.trustworthiness.requiresAIDisclosure).toBe(true);
    expect(base.requirements.trustworthiness.requiresAIDisclosure).toBe(false);
  });

  it('throws on unknown policy version', async () => {
    await expect(
      validateEvidence('some content', { policyVersion: 'not_a_real_version' }),
    ).rejects.toThrow(/Unknown evidence policy version/);
  });

  it('accepts a custom policy directly', async () => {
    const result = await validateEvidence('draft', {
      policy: {
        version: 'custom_v1',
        name: 'Custom',
        requirements: {
          experience: {},
          expertise: {},
          authoritativeness: {
            requiresAuthorByline: false,
            requiresAuthorBio: false,
            requiresExternalValidation: false,
          },
          trustworthiness: {
            requiresLastUpdated: false,
            requiresAIDisclosure: false,
            requiresSourceAttribution: false,
          },
        },
      },
    });
    expect(result.policyVersion).toBe('custom_v1');
    expect(result.hasGaps).toBe(false);
  });
});
