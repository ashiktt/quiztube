import { AssistantActionRun } from '@/models/AssistantActionRun';
import { AssistantActionType } from '@/types/assistant';

export const ALLOWED_AUTOMATION_ACTIONS: readonly AssistantActionType[] = [
  'event.confirmed',
  'task.created',
  'reminders.create',
  'event.updated',
  'event.cancelled',
  'study_plan.suggested',
] as const;

export interface DispatchActionPayload {
  userId: string;
  eventId?: string;
  actionType: AssistantActionType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}

export interface DispatchActionResult {
  success: boolean;
  status: 'completed' | 'dispatched' | 'failed' | 'unconfigured' | 'already_processed';
  actionRunId?: string;
  n8nExecutionId?: string;
  message?: string;
  error?: string;
}

/**
 * Checks whether n8n webhook integration is configured
 */
export function isN8nConfigured(): boolean {
  const url = process.env.N8N_EVENT_WEBHOOK_URL;
  return Boolean(url && (url.startsWith('https://') || url.startsWith('http://')));
}

/**
 * Dispatches an approved academic event action to n8n webhook
 */
export async function dispatchAutomationAction(
  params: DispatchActionPayload
): Promise<DispatchActionResult> {
  const { userId, eventId, actionType, payload, idempotencyKey } = params;

  // 1. Validate action is on the strict allowlist
  if (!ALLOWED_AUTOMATION_ACTIONS.includes(actionType)) {
    throw new Error(`Unauthorized automation action type: ${actionType}`);
  }

  // 2. Check for existing action run with same idempotency key
  const existingRun = await AssistantActionRun.findOne({ idempotencyKey });
  if (existingRun) {
    if (existingRun.status === 'completed') {
      return {
        success: true,
        status: 'already_processed',
        actionRunId: existingRun._id.toString(),
        n8nExecutionId: existingRun.n8nExecutionId,
        message: 'Action already completed previously.',
      };
    }
  }

  // Filter sensitive fields from payload
  const sanitizedPayload: Record<string, unknown> = {
    userId,
    eventId,
    actionType,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  delete sanitizedPayload.token;
  delete sanitizedPayload.password;
  delete sanitizedPayload.apiKey;

  // 3. If n8n is not configured, record skipped/unconfigured run and fail soft
  if (!isN8nConfigured()) {
    const run = await AssistantActionRun.findOneAndUpdate(
      { idempotencyKey },
      {
        userId,
        eventId,
        actionType,
        payload: sanitizedPayload,
        status: 'skipped',
        error: 'N8N_EVENT_WEBHOOK_URL is not configured.',
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      status: 'unconfigured',
      actionRunId: run._id.toString(),
      message: 'Action recorded locally. n8n automation webhook is pending configuration.',
    };
  }

  const webhookUrl = process.env.N8N_EVENT_WEBHOOK_URL!;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

  // 4. Save/update ActionRun to 'dispatched'
  const actionRun = await AssistantActionRun.findOneAndUpdate(
    { idempotencyKey },
    {
      userId,
      eventId,
      actionType,
      payload: sanitizedPayload,
      status: 'dispatched',
    },
    { upsert: true, new: true }
  );

  // 5. Send authenticated webhook request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
        'X-Idempotency-Key': idempotencyKey,
        'X-Action-Type': actionType,
      },
      body: JSON.stringify({
        actionType,
        idempotencyKey,
        data: sanitizedPayload,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errMsg = `n8n webhook error (${res.status}): ${errText.slice(0, 300)}`;

      await AssistantActionRun.findByIdAndUpdate(actionRun._id, {
        status: 'failed',
        error: errMsg,
      });

      return {
        success: false,
        status: 'failed',
        actionRunId: actionRun._id.toString(),
        error: errMsg,
      };
    }

    const responseJson = await res.json().catch(() => ({}));
    const executionId = responseJson?.executionId || responseJson?.id || undefined;

    await AssistantActionRun.findByIdAndUpdate(actionRun._id, {
      status: 'completed',
      n8nExecutionId: executionId,
      result: responseJson,
    });

    return {
      success: true,
      status: 'completed',
      actionRunId: actionRun._id.toString(),
      n8nExecutionId: executionId,
      message: 'Automation successfully executed via n8n.',
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errMessage = err instanceof Error ? err.message : 'Unknown network failure';

    await AssistantActionRun.findByIdAndUpdate(actionRun._id, {
      status: 'failed',
      error: `Webhook delivery error: ${errMessage}`,
    });

    return {
      success: false,
      status: 'failed',
      actionRunId: actionRun._id.toString(),
      error: `Failed to communicate with n8n: ${errMessage}`,
    };
  }
}
