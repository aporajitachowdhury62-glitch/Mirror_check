import { describe, it, expect } from 'vitest';
import { isAllBeliefsTagged } from '@/lib/storage';
import { BeliefTag } from '@/types';

describe('Belief Tagging Completion Logic', () => {
  const assumptionIds = ['A1', 'A2', 'A3', 'A4'];

  it('returns false when assumptionIds is empty or null', () => {
    expect(isAllBeliefsTagged([], {})).toBe(false);
    // @ts-expect-error test null safety
    expect(isAllBeliefsTagged(null, {})).toBe(false);
  });

  it('returns false when no assumptions are tagged yet', () => {
    const tags: Record<string, BeliefTag> = {};
    expect(isAllBeliefsTagged(assumptionIds, tags)).toBe(false);
  });

  it('returns false when only a subset of assumptions are tagged', () => {
    const tags: Record<string, BeliefTag> = {
      A1: 'know',
      A2: 'guess',
      A3: 'not_sure',
      // A4 is missing
    };
    expect(isAllBeliefsTagged(assumptionIds, tags)).toBe(false);
  });

  it('returns true when all assumptions are tagged with valid tags', () => {
    const tags: Record<string, BeliefTag> = {
      A1: 'know',
      A2: 'guess',
      A3: 'not_sure',
      A4: 'know',
    };
    expect(isAllBeliefsTagged(assumptionIds, tags)).toBe(true);
  });

  it('returns true when all assumptions are tagged with the same tag', () => {
    const allKnow: Record<string, BeliefTag> = {
      A1: 'know',
      A2: 'know',
      A3: 'know',
      A4: 'know',
    };
    expect(isAllBeliefsTagged(assumptionIds, allKnow)).toBe(true);

    const allNotSure: Record<string, BeliefTag> = {
      A1: 'not_sure',
      A2: 'not_sure',
      A3: 'not_sure',
      A4: 'not_sure',
    };
    expect(isAllBeliefsTagged(assumptionIds, allNotSure)).toBe(true);
  });

  it('returns false if a tag has an invalid or undefined value', () => {
    const tags: Record<string, BeliefTag> = {
      A1: 'know',
      A2: 'guess',
      A3: 'not_sure',
      // @ts-expect-error invalid tag test
      A4: 'maybe',
    };
    expect(isAllBeliefsTagged(assumptionIds, tags)).toBe(false);
  });
});
