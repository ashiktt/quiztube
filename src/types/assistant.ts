export type AcademicEventType =
  | 'exam'
  | 'assignment'
  | 'class'
  | 'project_deadline'
  | 'meeting'
  | 'study_session'
  | 'general';

export type EventStatus =
  | 'draft'
  | 'needs_confirmation'
  | 'confirmed'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export type ReminderStatus = 'scheduled' | 'delivered' | 'failed' | 'cancelled';
export type ReminderChannel = 'in_app' | 'email';

export type AssistantActionType =
  | 'event.confirmed'
  | 'task.created'
  | 'reminders.create'
  | 'event.updated'
  | 'event.cancelled'
  | 'study_plan.suggested';

export type AssistantActionStatus = 'pending' | 'dispatched' | 'completed' | 'failed' | 'skipped';

export interface ProposedReminder {
  offsetMinutes: number; // e.g. 1440 (1 day), 60 (1 hour)
  channel?: ReminderChannel;
}

export interface ExtractedEventProposal {
  title: string;
  eventType: AcademicEventType;
  description: string;
  startAt: string; // ISO-8601 string with explicit offset
  endAt?: string | null;
  timezone: string; // e.g. 'Asia/Kolkata'
  location?: string | null;
  tasks: string[];
  proposedReminders: ProposedReminder[];
  confidence: number;
  needsConfirmation: boolean;
  missingFields: string[];
  clarificationPrompt?: string | null;
  studyPlanSuggestions?: Array<{
    topic: string;
    suggestedDate: string;
    durationMinutes: number;
  }>;
}

export interface StudentEventItem {
  id: string;
  userId: string;
  title: string;
  eventType: AcademicEventType;
  description?: string;
  startAt: string;
  endAt?: string | null;
  timezone: string;
  location?: string | null;
  status: EventStatus;
  confidence: number;
  tasks?: StudentTaskItem[];
  reminders?: StudentReminderItem[];
  rawInputSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentTaskItem {
  id: string;
  eventId?: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentReminderItem {
  id: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  offsetMinutes: number;
  scheduledAt: string;
  timezone: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  attemptCount: number;
  lastError?: string;
  deliveredAt?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantActionRunItem {
  id: string;
  userId: string;
  eventId?: string;
  actionType: AssistantActionType;
  payload: Record<string, unknown>;
  status: AssistantActionStatus;
  idempotencyKey: string;
  n8nExecutionId?: string;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerOverview {
  todayTasks: StudentTaskItem[];
  upcomingExams: StudentEventItem[];
  upcomingAssignments: StudentEventItem[];
  upcomingReminders: StudentReminderItem[];
  overdueTasks: StudentTaskItem[];
  stats: {
    totalActiveEvents: number;
    pendingTasksCount: number;
    upcomingRemindersCount: number;
    completionRatePercent: number;
  };
}
