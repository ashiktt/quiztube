import { Type, Schema } from '@google/genai';

export const academicEventResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Clear, concise title of the academic event, course, exam, or deadline',
    },
    eventType: {
      type: Type.STRING,
      enum: ['exam', 'assignment', 'class', 'project_deadline', 'meeting', 'study_session', 'general'],
      description: 'Categorization of the academic event',
    },
    description: {
      type: Type.STRING,
      description: 'Comprehensive description summarizing topics, chapters, exam syllabus, or instructions',
    },
    startAt: {
      type: Type.STRING,
      description: 'ISO-8601 formatted datetime with explicit offset (e.g. 2026-10-22T10:00:00+05:30). If ambiguous or missing date/time, set to empty string.',
    },
    endAt: {
      type: Type.STRING,
      description: 'Optional ISO-8601 formatted end datetime with explicit offset. If not specified, empty string.',
    },
    timezone: {
      type: Type.STRING,
      description: 'IANA timezone string, defaults to Asia/Kolkata',
    },
    location: {
      type: Type.STRING,
      description: 'Physical hall, room number, or virtual meeting link, if mentioned',
    },
    tasks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific study tasks, revision topics, or action items extracted from the notice/text',
    },
    proposedReminders: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          offsetMinutes: {
            type: Type.INTEGER,
            description: 'Minutes before the event to trigger reminder (e.g. 1440 for 24h before, 60 for 1h before)',
          },
          channel: {
            type: Type.STRING,
            enum: ['in_app', 'email'],
            description: 'Notification channel, defaults to in_app',
          },
        },
        required: ['offsetMinutes'],
      },
      description: 'Proposed reminders requested by user or suggested based on event importance',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score from 0.0 to 1.0 in the extraction accuracy',
    },
    needsConfirmation: {
      type: Type.BOOLEAN,
      description: 'True if key information (such as exact date, time, year, or subject) is missing or ambiguous',
    },
    missingFields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of ambiguous or missing critical fields (e.g. ["startAt", "time", "date"])',
    },
    clarificationPrompt: {
      type: Type.STRING,
      description: 'If needsConfirmation is true, a polite question asking the student for the missing details',
    },
    studyPlanSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          suggestedDate: { type: Type.STRING, description: 'ISO-8601 date (YYYY-MM-DD)' },
          durationMinutes: { type: Type.INTEGER, description: 'Recommended study block length in minutes (e.g. 45)' },
        },
        required: ['topic', 'suggestedDate', 'durationMinutes'],
      },
      description: 'Structured study sessions recommended before the exam or deadline',
    },
  },
  required: [
    'title',
    'eventType',
    'description',
    'startAt',
    'timezone',
    'tasks',
    'proposedReminders',
    'confidence',
    'needsConfirmation',
    'missingFields',
  ],
};
