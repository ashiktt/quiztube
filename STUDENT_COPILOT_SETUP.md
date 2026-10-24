# Student Copilot — AI Automation Assistant for Saberio AI

## 1. Feature Architecture

Student Copilot is an end-to-end academic automation assistant built for Saberio AI. It enables students to transform unstructured college notices, exam dates, syllabi, assignment sheets, screenshots, and PDFs into verified events, study checkpoints, and automated scheduled reminders.

### End-to-End Pipeline
```
Student Input (Text / Image / PDF / Voice)
       │
       ▼
Google Gemini AI Extraction Engine (Deterministic Schema, Temporal Awareness, Anti-Injection)
       │
       ▼
Server-Side Event Validation & Normalization (ISO-8601 with explicit timezone, Asia/Kolkata fallback)
       │
       ▼
Student Review & Approval Workflow (draft → needs_confirmation → confirmed → scheduled)
       │
       ▼
Saberio Automation Engine (Idempotency Checks, Allowlisted Action Dispatch)
       │
       ▼
n8n Workflow Automation (Event Automation & 1-minute Reminder Polling)
       │
       ▼
Notification Delivery & Calendar Planner (MongoDB Persistence, Overdue Tracking, Study Roadmaps)
```

No external side effect or notification is ever triggered merely because Gemini proposed an event. Explicit student approval is strictly required.

---

## 2. New Files and Their Purposes

### Core Types & Models
- `src/types/assistant.ts`: TypeScript interfaces for academic events, study tasks, reminders, n8n action runs, extraction proposals, and planner overviews.
- `src/models/StudentEvent.ts`: Mongoose schema for persistent academic events with user ownership, status state machine (`draft`, `needs_confirmation`, `confirmed`, `scheduled`, `completed`, `cancelled`, `rejected`), and date indexes.
- `src/models/StudentTask.ts`: Mongoose schema for linked study tasks and revision checkpoints with status, priority, and due dates.
- `src/models/StudentReminder.ts`: Mongoose schema for scheduled reminders with delivery status, attempt counts, channel (`in_app` or `email`), and unique idempotency keys preventing duplicate triggers.
- `src/models/AssistantActionRun.ts`: Mongoose schema recording every automation run, execution status (`pending`, `dispatched`, `completed`, `failed`, `skipped`), and n8n execution IDs.

### AI Extraction & Security
- `src/lib/assistant/eventSchema.ts`: Strict `@google/genai` JSON schema specifying structured academic event fields, confidence scores, and missing-fields detection.
- `src/lib/assistant/eventValidation.ts`: Server-side sanitization and ISO datetime normalization with temporal validation and prompt injection defense.
- `src/lib/assistant/geminiEventParser.ts`: Gemini multimodal extraction handler supporting text, PNG, JPEG, WebP, and PDF documents with temporal context injection and model fallback.
- `src/lib/assistant/rateLimiter.ts`: In-memory sliding-window rate limiter protecting extraction (20 req/min) and dispatch endpoints (30 req/min).
- `src/lib/assistant/internalAuth.ts`: Fail-closed authentication helper verifying `ASSISTANT_INTERNAL_API_SECRET` on internal callback routes.
- `src/lib/assistant/n8nClient.ts`: Authenticated webhook client managing n8n dispatch, timeouts, idempotency checks, and soft failure handling when unconfigured.

### Server API Routes
- `src/app/api/assistant/extract/route.ts`: Authenticated endpoint running Gemini multimodal extraction with rate limiting.
- `src/app/api/assistant/events/route.ts`: GET (list user events) and POST (create draft event with tasks & reminders).
- `src/app/api/assistant/events/[id]/route.ts`: GET, PATCH, and DELETE operations with strict user ownership enforcement.
- `src/app/api/assistant/events/[id]/confirm/route.ts`: Approves event proposal, promotes status to `scheduled`, and dispatches `event.confirmed` to n8n.
- `src/app/api/assistant/events/[id]/reject/route.ts`: Discards proposed event and cancels associated tasks/reminders.
- `src/app/api/assistant/tasks/route.ts` & `[id]/route.ts`: Task creation, status toggling (`pending` ↔ `completed`), and deletion.
- `src/app/api/assistant/reminders/route.ts` & `[id]/route.ts`: Reminder creation and status updates.
- `src/app/api/assistant/actions/route.ts`: Automation activity logs.
- `src/app/api/assistant/dispatch/route.ts`: Allowlisted automation action dispatcher.
- `src/app/api/assistant/planner/route.ts`: Aggregated planner overview endpoint.
- `src/app/api/assistant/internal/reminders/due/route.ts`: Internal endpoint called by n8n scheduler to fetch due reminders.
- `src/app/api/assistant/internal/reminders/deliver/route.ts`: Internal endpoint called by n8n to confirm notification delivery.

### User Interface Components
- `src/components/copilot/StudentCopilotView.tsx`: Main workspace view containing the assistant panel, voice dictation, file uploader, planner, tasks, reminders, activity logs, and integrations.
- `src/components/copilot/EventReviewCard.tsx`: Extracted event review card allowing inline editing, adding/removing tasks & reminders, and explicit approval.
- `src/components/copilot/PlannerView.tsx`: Student calendar planner view displaying today's tasks, overdue alerts, upcoming exams, and study roadmap recommendations.
- `src/components/copilot/AutomationHistoryPanel.tsx`: Audit trail displaying recent n8n executions, idempotency keys, and payload inspections.
- `src/components/copilot/IntegrationsPanel.tsx`: Honest integration boundaries for n8n, Notifications, Google Calendar, and Voice Dictation.

### n8n Workflows
- `n8n/workflows/student-copilot-event-automation.json`: Webhook-triggered automation workflow for allowlisted actions (`event.confirmed`, `task.created`, `reminders.create`, `event.updated`, `event.cancelled`).
- `n8n/workflows/student-copilot-reminder-scheduler.json`: Cron-triggered scheduler that queries due reminders from the internal API, dispatches notifications, and marks delivery status.

---

## 3. Database Configuration

Saberio AI uses MongoDB via Mongoose as the canonical persistence layer.

### Connection
Set `MONGODB_URI` in `.env.local` or environment:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/saberio?retryWrites=true&w=majority
```

### Automatic Indexing
Indexes are automatically created on startup:
- `StudentEvent`: `{ userId: 1, startAt: 1 }`, `{ userId: 1, status: 1 }`
- `StudentTask`: `{ userId: 1, dueDate: 1 }`, `{ userId: 1, status: 1 }`
- `StudentReminder`: `{ idempotencyKey: 1 }` (unique), `{ status: 1, scheduledAt: 1 }`, `{ userId: 1, scheduledAt: 1 }`
- `AssistantActionRun`: `{ idempotencyKey: 1 }` (unique), `{ userId: 1, createdAt: -1 }`

---

## 4. Required Environment Variables

Add the following to `.env.local`:

| Variable Name | Required | Purpose | Example |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | **Yes** | 32+ char secret for JWT authentication. Fails closed if missing. | `your_long_random_jwt_secret_key_32_chars` |
| `MONGODB_URI` | **Yes** | MongoDB connection string (Atlas or local mongod). | `mongodb+srv://user:pass@cluster0.mongodb.net/saberio` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key from Google AI Studio. | `AIzaSy...` |
| `N8N_EVENT_WEBHOOK_URL` | Optional | Webhook URL for the event automation workflow in n8n. | `http://localhost:5678/webhook/student-copilot-events` |
| `N8N_WEBHOOK_SECRET` | Optional | Shared secret sent in `X-Webhook-Secret` header to n8n. | `n8n_secret_token_123` |
| `APP_INTERNAL_BASE_URL` | Optional | Base URL where n8n reaches Saberio AI. | `http://localhost:3000` |
| `ASSISTANT_INTERNAL_API_SECRET` | Optional | Secret token for n8n to call `/api/assistant/internal/*`. | `internal_cron_secret_456` |

*Note: When `N8N_EVENT_WEBHOOK_URL` is omitted, the application records actions locally in `pending`/`skipped` state and operates normally without errors.*

---

## 5. Local Setup and Build Commands

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure variables
cp .env.example .env.local

# 3. Start local development server
npm run dev

# 4. Run tests
npm test

# 5. Typecheck & build for production
npm run build
```

---

## 6. How to Import Both n8n Workflows

1. Start your local or hosted n8n instance (e.g. `npx n8n` on `http://localhost:5678`).
2. Log into n8n and click **Workflows** → **Add Workflow** (or the **...** menu on the top right) → **Import from File**.
3. Import `n8n/workflows/student-copilot-event-automation.json`.
4. Import `n8n/workflows/student-copilot-reminder-scheduler.json`.
5. Open each workflow and activate it using the **Active** toggle in the top-right corner.

---

## 7. How to Configure Webhook Authentication

1. In the imported **Student Copilot - Academic Event Automation** workflow:
   - Select the **Authenticate Secret** node.
   - Verify that the condition checks `$json.headers['x-webhook-secret']`.
   - Set the expected secret matching `N8N_WEBHOOK_SECRET` in your `.env.local`.
2. In the **Student Copilot - Scheduled Reminders Dispatcher** workflow:
   - Select the **Fetch Due Reminders from API** node.
   - Set the `Authorization` header to `Bearer <YOUR_ASSISTANT_INTERNAL_API_SECRET>`.
   - Set the URL to `{{ $env.APP_INTERNAL_BASE_URL }}/api/assistant/internal/reminders/due`.
   - Select the **Confirm Delivery in App Database** node and verify the same `Authorization` header.

---

## 8. How to Configure the Notification Provider

In the **Student Copilot - Scheduled Reminders Dispatcher** workflow:
1. Double-click the **Dispatch Email Notification** node.
2. Under **Credential to connect with**, select or create an **SMTP** credential (e.g. SendGrid, Mailgun, Amazon SES, or Gmail App Password).
3. Specify your verified sender address (e.g. `notifications@yourdomain.com`).
4. If an external email provider is not yet configured, the workflow routes reminders to the **Record In-App Delivery** node which marks them delivered in MongoDB.

---

## 9. How to Test Event Extraction, Confirmation, Scheduling, and Retries

### A. Testing AI Extraction
1. Sign in to Saberio AI and navigate to **Student Copilot** from the top navbar.
2. In the input area, paste:
   ```
   I have a DBMS exam on October 22 at 10 AM. I need to revise indexing, B-trees, and hashing. Remind me the previous evening and one hour before the exam.
   ```
3. Click **Extract & Structure**.
4. Verify that:
   - Event title is extracted as `DBMS Exam` or `DBMS Internal Examination`.
   - Event category is `exam`.
   - Date is normalized to `2026-10-22T10:00:00+05:30`.
   - Study tasks contain `Revise indexing`, `Study B-trees`, `Review hashing`.
   - Proposed reminders include `1440` (1 day before) and `60` (1 hour before).

### B. Testing Review and Inline Edits
1. Click **Edit Details** on the proposal card.
2. Modify the event title or add an extra task.
3. Click **Apply Changes**.

### C. Testing Confirmation and Automation Dispatch
1. Click **Confirm & Schedule**.
2. Notice the event advances to `scheduled`.
3. Switch to the **Planner** tab to see the event in upcoming commitments.
4. Switch to the **Activity Log** tab to verify that `event.confirmed` was dispatched with an idempotency key.

### D. Testing Missing/Ambiguous Clarification
1. Enter an ambiguous prompt like: `I have an exam on the 5th.`
2. Click **Extract & Structure**.
3. Verify that the proposal card displays an amber **Ambiguous Details Detected** warning and asks for clarification.

---

## 10. Known Limitations & Future Roadmap

1. **Google Calendar 2-Way Synchronization**: Direct export to `.ics` is supported. Full 2-way Google Calendar synchronization requires completing Google Cloud Console OAuth verification for the `calendar.events` scope.
2. **External Email Dispatch**: In-app notifications are active and verified. Outbound email dispatch requires connecting an SMTP credential in n8n.
3. **Legacy Authentication Notice**: Existing Google sign-in and password reset flows require JWT/token proof-of-possession verification before being exposed to untrusted production traffic. The custom JWT implementation now strictly fails closed when `JWT_SECRET` is unconfigured.
