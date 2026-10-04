/**
 * Google Calendar Event URL Builder for 30-Day Reflection Check-ins
 */

export interface CalendarEventOptions {
  skill: string;
  checkinDate: Date;
  initialConfidence?: number;
  postConfidence?: number;
  durationMinutes?: number;
  customDetails?: string;
  appUrl?: string;
}

/**
 * Format a Date object into UTC YYYYMMDDTHHmmssZ string required by Google Calendar URL
 */
export function formatCalendarDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Calculate a check-in date N days from a given start date (default 30 days)
 */
export function calculateCheckinDate(fromDate: Date = new Date(), daysAhead = 30): Date {
  const target = new Date(fromDate.getTime());
  target.setDate(target.getDate() + daysAhead);
  // Default to 10:00 AM local time for convenient scheduling
  target.setHours(10, 0, 0, 0);
  return target;
}

/**
 * Build a Google Calendar template URL for adding a 30-day reflection reminder
 */
export function buildGoogleCalendarUrl(options: CalendarEventOptions): string {
  const {
    skill,
    checkinDate,
    initialConfidence,
    postConfidence,
    durationMinutes = 30,
    customDetails,
    appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  } = options;

  const startDate = new Date(checkinDate.getTime());
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const datesParam = `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`;
  const title = `Mirror Check 30-Day Reflection: ${skill}`;

  const confidenceLine =
    initialConfidence !== undefined && postConfidence !== undefined
      ? `Initial Confidence: ${initialConfidence}% -> Post-Examination: ${postConfidence}%\n`
      : '';

  const details = [
    `30-Day Reflection for your learning inquiry on: "${skill}"`,
    '',
    `Time to check your blind spot again! Has the initial hype faded? Has your schedule opened up, or did you observe key signals?`,
    '',
    confidenceLine,
    customDetails ? `Notes:\n${customDetails}\n` : '',
    `Review your original inquiry and unexamined assumptions: ${appUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
