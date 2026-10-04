import { describe, it, expect, beforeEach } from 'vitest';
import {
  isCheckinDue,
  getDaysSince,
  getCheckinDueDate,
  saveReasoningRecord,
  getSavedReasoningRecords,
  getLatestSavedReasoning,
} from '@/lib/storage';
import { SavedReasoningRecord } from '@/types';

describe('30-Day Check-in Date & Storage Logic', () => {
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;

  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('isCheckinDue', () => {
    it('returns false when saved today (0 days elapsed)', () => {
      const now = new Date(2026, 9, 4, 12, 0, 0);
      const savedAt = now.getTime();
      expect(isCheckinDue(savedAt, now)).toBe(false);
    });

    it('returns false when saved 15 days ago (< 30 days)', () => {
      const now = new Date(2026, 9, 20, 12, 0, 0);
      const savedAt = now.getTime() - 15 * ONE_DAY_MS;
      expect(isCheckinDue(savedAt, now)).toBe(false);
    });

    it('returns false when saved 29 days ago (< 30 days)', () => {
      const now = new Date(2026, 9, 30, 12, 0, 0);
      const savedAt = now.getTime() - 29 * ONE_DAY_MS;
      expect(isCheckinDue(savedAt, now)).toBe(false);
    });

    it('returns true when saved exactly 30 days ago (>= 30 days)', () => {
      const now = new Date(2026, 10, 4, 12, 0, 0);
      const savedAt = now.getTime() - 30 * ONE_DAY_MS;
      expect(isCheckinDue(savedAt, now)).toBe(true);
    });

    it('returns true when saved 45 days ago (> 30 days)', () => {
      const now = new Date(2026, 10, 19, 12, 0, 0);
      const savedAt = now.getTime() - 45 * ONE_DAY_MS;
      expect(isCheckinDue(savedAt, now)).toBe(true);
    });
  });

  describe('getDaysSince', () => {
    it('accurately calculates elapsed days', () => {
      const now = new Date(2026, 9, 10, 12, 0, 0);
      const past = new Date(2026, 9, 3, 12, 0, 0);
      expect(getDaysSince(past, now)).toBe(7);
    });
  });

  describe('getCheckinDueDate', () => {
    it('adds 30 days to the timestamp date', () => {
      const base = new Date(2026, 9, 4, 12, 0, 0);
      const due = getCheckinDueDate(base, 30);
      const diffDays = Math.round((due.getTime() - base.getTime()) / ONE_DAY_MS);
      expect(diffDays).toBe(30);
    });
  });

  describe('saveReasoningRecord & getSavedReasoningRecords', () => {
    it('persists reasoning record to localStorage and retrieves it', () => {
      const mockRecord: SavedReasoningRecord = {
        id: 'rec_1',
        skill: 'Rust',
        context: 'Unsure about learning curve',
        initialConfidence: 50,
        postConfidence: 65,
        confidenceChange: 15,
        beliefs: {
          skill: 'Rust',
          assumptions: [],
          thinking_summary: 'Test summary',
        },
        tags: { A1: 'know', A2: 'guess' },
        questionAnswers: { q_0: 'My answer' },
        reflection: null,
        experiment: null,
        savedAt: Date.now(),
        checkinDueAt: Date.now() + 30 * ONE_DAY_MS,
      };

      const saved = saveReasoningRecord(mockRecord);
      expect(saved).toBe(true);

      const records = getSavedReasoningRecords();
      expect(records.length).toBe(1);
      expect(records[0].skill).toBe('Rust');
      expect(records[0].confidenceChange).toBe(15);

      const latest = getLatestSavedReasoning();
      expect(latest?.id).toBe('rec_1');
    });
  });
});
