/**
 * Saberio AI - Model Orchestrator & Cost Optimization Engine
 * Implements Phase 6: Multi-model tiering, retry logic with exponential backoff & jitter,
 * request timeouts, in-memory caching, token usage tracking, and zero-budget free tier compatibility.
 */

import { GoogleGenAI, Schema } from '@google/genai';
import { formatGeminiErrorMessage } from '@/lib/gemini';

export interface ModelExecutionConfig {
  apiKey?: string;
  preferredModel?: string;
  systemInstruction?: string;
  responseSchema?: Schema;
  responseMimeType?: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  maxOutputTokens?: number;
}

export interface ModelExecutionResult {
  text: string;
  modelUsed: string;
  cached: boolean;
  latencyMs: number;
  estimatedTokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd: number; // 0.00 for free tier
}

// Ordered models prioritized for Google AI Studio Free-Tier stability & quota
export const ORCHESTRATOR_MODELS = {
  flashFast: [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ],
  proReasoning: [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ],
};

// In-memory LRU cache to prevent duplicate API hits
interface CacheEntry {
  result: ModelExecutionResult;
  expiresAt: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Computes a lightweight fast deterministic hash of the request prompt.
 */
function computeCacheKey(model: string, contents: any[], systemInstruction?: string): string {
  const contentStr = JSON.stringify(contents);
  const raw = `${model}:${systemInstruction || ''}:${contentStr}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `gemini_cache_${Math.abs(hash)}`;
}

/**
 * Executes a Gemini content generation call with exponential backoff, jitter,
 * timeout controls, caching, and fallback model degradation.
 */
export async function executeModelWithOrchestration(
  contents: any[],
  config: ModelExecutionConfig = {}
): Promise<ModelExecutionResult> {
  const apiKey = (config.apiKey || process.env.GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in environment or app settings.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const timeoutMs = config.timeoutMs || 45000;
  const maxRetries = config.maxRetries ?? 2;
  const temperature = config.temperature ?? 0.2;

  // Build candidate models list
  const defaultList = ORCHESTRATOR_MODELS.flashFast;
  const pref = config.preferredModel ? config.preferredModel.trim() : '';
  const candidateModels = pref
    ? [pref, ...defaultList.filter(m => m !== pref)]
    : defaultList;

  // 1. Cache Lookup
  const cacheKey = computeCacheKey(candidateModels[0], contents, config.systemInstruction);
  const cachedItem = MEMORY_CACHE.get(cacheKey);
  if (cachedItem && cachedItem.expiresAt > Date.now()) {
    return {
      ...cachedItem.result,
      cached: true,
    };
  }

  let lastError: any = null;
  const startTime = Date.now();

  for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
    const currentModel = candidateModels[modelIdx];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute request with strict timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms on model ${currentModel}`)), timeoutMs);
        });

        const apiPromise = ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            systemInstruction: config.systemInstruction,
            responseMimeType: config.responseMimeType || 'application/json',
            responseSchema: config.responseSchema,
            temperature,
            maxOutputTokens: config.maxOutputTokens || 16384,
          },
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const responseText = response.text;

        if (!responseText) {
          throw new Error(`Empty text response received from model ${currentModel}`);
        }

        const latencyMs = Date.now() - startTime;
        const usage = response.usageMetadata || {};
        const promptTokens = usage.promptTokenCount || 0;
        const completionTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || promptTokens + completionTokens;

        const result: ModelExecutionResult = {
          text: responseText,
          modelUsed: currentModel,
          cached: false,
          latencyMs,
          estimatedTokens: {
            promptTokens,
            completionTokens,
            totalTokens,
          },
          estimatedCostUsd: 0.0, // Free Tier budget
        };

        // Cache the successful result
        if (MEMORY_CACHE.size >= MAX_CACHE_ENTRIES) {
          const firstKey = MEMORY_CACHE.keys().next().value;
          if (firstKey) MEMORY_CACHE.delete(firstKey);
        }
        MEMORY_CACHE.set(cacheKey, {
          result,
          expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
        });

        return result;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);

        // Check if rate limited (429 or RESOURCE_EXHAUSTED) or temporarily unavailable (503)
        const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
        const isTemporary = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('timed out');

        if ((isRateLimit || isTemporary) && attempt < maxRetries) {
          // Exponential backoff with jitter: base 1000ms * 2^attempt + jitter
          const jitter = Math.floor(Math.random() * 500);
          const backoffDelay = Math.min(8000, 1000 * Math.pow(2, attempt) + jitter);
          console.warn(`[Orchestrator] Model ${currentModel} error (attempt ${attempt + 1}/${maxRetries + 1}): ${errMsg}. Backing off ${backoffDelay}ms...`);
          await new Promise(r => setTimeout(r, backoffDelay));
          continue;
        }

        // Break attempt loop and try next fallback model
        console.warn(`[Orchestrator] Switching from model ${currentModel} to next fallback due to:`, errMsg);
        break;
      }
    }
  }

  throw new Error(formatGeminiErrorMessage(lastError) || 'Failed to complete AI model generation after exhausting all available models and retries.');
}
