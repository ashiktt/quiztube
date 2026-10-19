import {
  AcademicEventType,
  ExtractedEventProposal,
  ProposedReminder,
} from '@/types/assistant';

const ALLOWED_EVENT_TYPES: AcademicEventType[] = [
  'exam',
  'assignment',
  'class',
  'project_deadline',
  'meeting',
  'study_session',
  'general',
];

export interface ValidationResult {
  isValid: boolean;
  sanitized: ExtractedEventProposal;
  errors: string[];
}

/**
 * Clean and sanitize free-text string against control chars and excessive length
 */
export function sanitizeString(val: unknown, maxLength = 2000): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Parse and validate ISO date string
 */
export function validateIsoDateString(dateStr: string): {
  isValid: boolean;
  dateObj: Date | null;
  normalizedIso: string | null;
} {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, dateObj: null, normalizedIso: null };
  }

  const trimmed = dateStr.trim();
  const timestamp = Date.parse(trimmed);
  if (isNaN(timestamp)) {
    return { isValid: false, dateObj: null, normalizedIso: null };
  }

  const dateObj = new Date(timestamp);
  return {
    isValid: true,
    dateObj,
    normalizedIso: dateObj.toISOString(),
  };
}

/**
 * Validates, normalizes, and sanitizes Gemini extraction results or student edits
 */
export function validateEventProposal(
  raw: Partial<ExtractedEventProposal>,
  userTimezone = 'Asia/Kolkata',
  referenceNow = new Date()
): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = Array.isArray(raw.missingFields)
    ? raw.missingFields.map((f) => sanitizeString(f, 50)).filter(Boolean)
    : [];

  // 1. Title validation
  const title = sanitizeString(raw.title, 250);
  if (!title) {
    errors.push('Event title is required.');
    if (!missingFields.includes('title')) missingFields.push('title');
  }

  // 2. Event type validation
  let eventType: AcademicEventType = 'general';
  if (raw.eventType && ALLOWED_EVENT_TYPES.includes(raw.eventType as AcademicEventType)) {
    eventType = raw.eventType as AcademicEventType;
  } else if (raw.eventType) {
    eventType = 'general';
  }

  // 3. Description
  const description = sanitizeString(raw.description, 2000);

  // 4. Timezone normalization
  let timezone = sanitizeString(raw.timezone, 100) || userTimezone || 'Asia/Kolkata';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    timezone = 'Asia/Kolkata';
  }

  // 5. Start date & time validation
  let startAt = '';
  let needsConfirmation = Boolean(raw.needsConfirmation);
  let clarificationPrompt = sanitizeString(raw.clarificationPrompt, 500) || null;

  if (!raw.startAt || typeof raw.startAt !== 'string' || !raw.startAt.trim()) {
    errors.push('Event start date and time are missing.');
    if (!missingFields.includes('startAt')) missingFields.push('startAt');
    needsConfirmation = true;
    if (!clarificationPrompt) {
      clarificationPrompt = 'Could you please specify the exact date and time for this event?';
    }
  } else {
    const parsedDate = validateIsoDateString(raw.startAt);
    if (!parsedDate.isValid || !parsedDate.dateObj) {
      errors.push('Event start date is in an invalid format.');
      if (!missingFields.includes('startAt')) missingFields.push('startAt');
      needsConfirmation = true;
      if (!clarificationPrompt) {
        clarificationPrompt = 'The date or time seems ambiguous. Could you confirm the exact date and start time?';
      }
    } else {
      startAt = raw.startAt.trim();
      // Check if start date is far in the past
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (parsedDate.dateObj.getTime() < referenceNow.getTime() - oneDayMs) {
        needsConfirmation = true;
        if (!missingFields.includes('future_date_confirmation')) {
          missingFields.push('future_date_confirmation');
        }
        if (!clarificationPrompt) {
          clarificationPrompt = `This event date appears to be in the past (${parsedDate.dateObj.toLocaleDateString()}). Did you mean an upcoming date?`;
        }
      }
    }
  }

  // 6. End date (optional)
  let endAt: string | null = null;
  if (raw.endAt && typeof raw.endAt === 'string' && raw.endAt.trim()) {
    const parsedEnd = validateIsoDateString(raw.endAt);
    if (parsedEnd.isValid) {
      endAt = raw.endAt.trim();
    }
  }

  // 7. Location
  const location = sanitizeString(raw.location, 200) || null;

  // 8. Tasks (study items, revision topics)
  const tasks: string[] = [];
  if (Array.isArray(raw.tasks)) {
    const seen = new Set<string>();
    for (const t of raw.tasks) {
      const cleanTask = sanitizeString(t, 250);
      if (cleanTask && !seen.has(cleanTask.toLowerCase())) {
        seen.add(cleanTask.toLowerCase());
        tasks.push(cleanTask);
      }
    }
  }

  // 9. Proposed reminders
  const proposedReminders: ProposedReminder[] = [];
  if (Array.isArray(raw.proposedReminders)) {
    const seenOffsets = new Set<number>();
    for (const r of raw.proposedReminders) {
      if (typeof r?.offsetMinutes === 'number' && r.offsetMinutes >= 0 && !seenOffsets.has(r.offsetMinutes)) {
        seenOffsets.add(r.offsetMinutes);
        proposedReminders.push({
          offsetMinutes: Math.floor(r.offsetMinutes),
          channel: r.channel === 'email' ? 'email' : 'in_app',
        });
      }
    }
  }

  // Default reminders if none proposed for exam or assignment
  if (proposedReminders.length === 0 && (eventType === 'exam' || eventType === 'assignment')) {
    proposedReminders.push({ offsetMinutes: 1440, channel: 'in_app' }); // 1 day before
    proposedReminders.push({ offsetMinutes: 60, channel: 'in_app' });   // 1 hour before
  }

  // 10. Confidence
  let confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.85;
  if (confidence < 0) confidence = 0;
  if (confidence > 1) confidence = 1;

  // 11. Study plan suggestions
  const studyPlanSuggestions: Array<{ topic: string; suggestedDate: string; durationMinutes: number }> = [];
  if (Array.isArray(raw.studyPlanSuggestions)) {
    for (const s of raw.studyPlanSuggestions) {
      const topic = sanitizeString(s?.topic, 200);
      const suggestedDate = sanitizeString(s?.suggestedDate, 30);
      const duration = typeof s?.durationMinutes === 'number' ? Math.max(15, Math.min(240, s.durationMinutes)) : 45;
      if (topic && suggestedDate) {
        studyPlanSuggestions.push({
          topic,
          suggestedDate,
          durationMinutes: duration,
        });
      }
    }
  }

  const sanitized: ExtractedEventProposal = {
    title: title || 'Untitled Academic Event',
    eventType,
    description,
    startAt,
    endAt,
    timezone,
    location,
    tasks,
    proposedReminders,
    confidence,
    needsConfirmation: needsConfirmation || missingFields.length > 0,
    missingFields,
    clarificationPrompt,
    studyPlanSuggestions: studyPlanSuggestions.length > 0 ? studyPlanSuggestions : undefined,
  };

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}
