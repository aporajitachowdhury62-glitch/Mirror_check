import { SessionData, BeliefTag, SavedReasoningRecord } from '@/types';

const SESSION_STORAGE_KEY = 'mirror_check_session_v1';
const SAVED_RECORDS_KEY = 'mirror_check_saved_reasoning_v1';

export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__mc_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save active session state to localStorage
 */
export function saveSession(data: Partial<SessionData>): void {
  if (!isStorageAvailable()) return;

  try {
    const current = loadSession();
    const updated: SessionData = {
      id: data.id ?? current?.id ?? `session_${Date.now()}`,
      skill: data.skill ?? current?.skill ?? '',
      context: data.context ?? current?.context ?? '',
      confidence: data.confidence ?? current?.confidence ?? 50,
      postConfidence: data.postConfidence ?? current?.postConfidence ?? undefined,
      step: data.step ?? current?.step ?? 1,
      beliefs: data.beliefs !== undefined ? data.beliefs : (current?.beliefs ?? null),
      tags: data.tags ?? current?.tags ?? {},
      questionAnswers: data.questionAnswers ?? current?.questionAnswers ?? {},
      questions: data.questions !== undefined ? data.questions : (current?.questions ?? null),
      reflection: data.reflection !== undefined ? data.reflection : (current?.reflection ?? null),
      experiment: data.experiment !== undefined ? data.experiment : (current?.experiment ?? null),
      savedAt: data.savedAt ?? current?.savedAt,
      checkinDueAt: data.checkinDueAt ?? current?.checkinDueAt,
      lastUpdated: Date.now(),
      isCompleted: data.isCompleted ?? current?.isCompleted ?? false,
    };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e);
  }
}

/**
 * Load active session from localStorage
 */
export function loadSession(): SessionData | null {
  if (!isStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.step === 'number') {
      return parsed as SessionData;
    }
    return null;
  } catch (e) {
    console.warn('Failed to load session from localStorage:', e);
    return null;
  }
}

/**
 * Clear working session from localStorage
 */
export function clearSession(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear session from localStorage:', e);
  }
}

/**
 * Store completed reasoning record with 30-day follow-up date
 */
export function saveReasoningRecord(record: SavedReasoningRecord): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const existing = getSavedReasoningRecords();
    // Filter out if same id exists to update in place
    const updated = [record, ...existing.filter((r) => r.id !== record.id)].slice(0, 20);
    window.localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('Failed to save reasoning record to localStorage:', e);
    return false;
  }
}

/**
 * Retrieve all saved reasoning records
 */
export function getSavedReasoningRecords(): SavedReasoningRecord[] {
  if (!isStorageAvailable()) return [];

  try {
    const raw = window.localStorage.getItem(SAVED_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as SavedReasoningRecord[];
    }
    return [];
  } catch (e) {
    console.warn('Failed to read saved reasoning records:', e);
    return [];
  }
}

/**
 * Retrieve the most recent saved reasoning record
 */
export function getLatestSavedReasoning(): SavedReasoningRecord | null {
  const records = getSavedReasoningRecords();
  return records.length > 0 ? records[0] : null;
}

/**
 * Calculate the 30-day check-in date from a timestamp or date
 */
export function getCheckinDueDate(savedAt: number | Date, daysAhead = 30): Date {
  const base = typeof savedAt === 'number' ? new Date(savedAt) : savedAt;
  const due = new Date(base.getTime());
  due.setDate(due.getDate() + daysAhead);
  return due;
}

/**
 * Calculate full days passed since a given date
 */
export function getDaysSince(date: number | Date, now: Date = new Date()): number {
  const baseTime = typeof date === 'number' ? date : date.getTime();
  const diffMs = now.getTime() - baseTime;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a saved session is 30+ days old and due for reflection check-in
 */
export function isCheckinDue(
  savedAt: number | Date,
  now: Date = new Date(),
  thresholdDays = 30
): boolean {
  const daysPassed = getDaysSince(savedAt, now);
  return daysPassed >= thresholdDays;
}

/**
 * Check if all surfaced assumptions have been assigned a valid tag
 */
export function isAllBeliefsTagged(
  assumptionIds: string[],
  tags: Record<string, BeliefTag>
): boolean {
  if (!assumptionIds || assumptionIds.length === 0) return false;
  return assumptionIds.every((id) => {
    const tag = tags[id];
    return tag === 'know' || tag === 'guess' || tag === 'not_sure';
  });
}
