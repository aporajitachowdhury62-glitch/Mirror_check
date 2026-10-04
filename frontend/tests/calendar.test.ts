import { describe, it, expect } from 'vitest';
import {
  buildGoogleCalendarUrl,
  formatCalendarDate,
  calculateCheckinDate,
} from '@/lib/calendar';

describe('Google Calendar URL Builder & Date Utilities', () => {
  it('formats calendar date to UTC YYYYMMDDTHHmmssZ string without hyphens or colons', () => {
    // 2026-10-04T12:00:00Z
    const testDate = new Date(Date.UTC(2026, 9, 4, 12, 0, 0));
    const formatted = formatCalendarDate(testDate);
    expect(formatted).toBe('20261004T120000Z');
  });

  it('calculates a date 30 days ahead from a given start date', () => {
    const baseDate = new Date(Date.UTC(2026, 9, 4, 10, 0, 0));
    const targetDate = calculateCheckinDate(baseDate, 30);

    const diffDays = Math.round(
      (targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });

  it('builds a valid Google Calendar TEMPLATE URL with all required query params', () => {
    const checkinDate = new Date(Date.UTC(2026, 10, 4, 10, 0, 0)); // Nov 4, 2026
    const url = buildGoogleCalendarUrl({
      skill: 'Rust Programming',
      checkinDate,
      initialConfidence: 60,
      postConfidence: 75,
      durationMinutes: 30,
      appUrl: 'http://localhost:3000',
    });

    expect(url).toContain('https://calendar.google.com/calendar/render?');

    const parsed = new URL(url);
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsed.searchParams.get('text')).toBe('Mirror Check 30-Day Reflection: Rust Programming');
    expect(parsed.searchParams.get('dates')).toBe('20261104T100000Z/20261104T103000Z');

    const details = parsed.searchParams.get('details') || '';
    expect(details).toContain('Rust Programming');
    expect(details).toContain('Initial Confidence: 60% -> Post-Examination: 75%');
    expect(details).toContain('http://localhost:3000');
  });

  it('handles optional parameters and custom details gracefully', () => {
    const checkinDate = new Date(Date.UTC(2026, 10, 4, 10, 0, 0));
    const url = buildGoogleCalendarUrl({
      skill: 'Solidity',
      checkinDate,
      customDetails: 'Focus on whether Web3 hype subsided.',
    });

    const parsed = new URL(url);
    const details = parsed.searchParams.get('details') || '';
    expect(details).toContain('Solidity');
    expect(details).toContain('Focus on whether Web3 hype subsided.');
  });
});
