import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { AIServiceError } from '../lib/errors.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import {
  getMockImageAnalysis,
  getMockConstraintParsing,
  getMockItinerary,
} from './mockData.js';

export const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'placeholder-gemini-key'
    ? env.GEMINI_API_KEY
    : 'placeholder',
});

// Model Roles (configured via env variables, never hardcoded in logic)
export const MODEL_ROLES = {
  PRIMARY: env.GEMINI_MODEL_PRIMARY || 'gemini-3.8-flash',
  ESCALATION: env.GEMINI_MODEL_ESCALATION || 'gemini-3.1-pro-preview',
  FALLBACK: env.GEMINI_MODEL_FALLBACK || 'gemini-3.1-flash-lite',
};

export const MODEL = MODEL_ROLES.PRIMARY;

// Fallback Chain resolution
// PRIMARY -> FALLBACK
// ESCALATION -> PRIMARY -> FALLBACK
function getModelChain(role = 'PRIMARY') {
  if (role === 'ESCALATION') {
    return [MODEL_ROLES.ESCALATION, MODEL_ROLES.PRIMARY, MODEL_ROLES.FALLBACK].filter(
      (m, idx, arr) => m && arr.indexOf(m) === idx
    );
  }
  if (role === 'FALLBACK') {
    return [MODEL_ROLES.FALLBACK].filter(Boolean);
  }
  return [MODEL_ROLES.PRIMARY, MODEL_ROLES.FALLBACK].filter(
    (m, idx, arr) => m && arr.indexOf(m) === idx
  );
}

// Global cached health status
let cachedModelHealth = {
  PRIMARY: { model: MODEL_ROLES.PRIMARY, status: 'UNKNOWN' },
  ESCALATION: { model: MODEL_ROLES.ESCALATION, status: 'UNKNOWN' },
  FALLBACK: { model: MODEL_ROLES.FALLBACK, status: 'UNKNOWN' },
  checked_at: null,
};

// Helper to log metadata to ai_request_logs (NEVER prompts or images)
async function logAiRequest({ userId, tripId, kind, model, latencyMs, success, errorCode }) {
  try {
    const row = {
      id: crypto.randomUUID(),
      user_id: userId,
      trip_id: tripId || null,
      kind,
      model: model || MODEL_ROLES.PRIMARY,
      latency_ms: latencyMs,
      success,
      error_code: errorCode || null,
      created_at: new Date().toISOString(),
    };

    if (isDevPlaceholderSupabase) {
      devStore.ai_request_logs.push(row);
      return;
    }

    await supabaseAdmin.from('ai_request_logs').insert(row);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to write ai_request_logs metadata');
  }
}

/**
 * Universal Gemini JSON caller with fallback chain, retry, schema validation, repair retry, and metadata logging.
 */
export async function callGeminiJson({
  systemInstruction,
  parts,
  schema,
  zodSchema,
  temperature = 0.2,
  kind,
  role = 'PRIMARY',
  userId,
  tripId,
  mockFallback = null,
}) {
  const startTime = Date.now();

  // If mock mode is explicitly enabled or API key is not configured
  const shouldUseMock =
    env.GEMINI_MOCK ||
    !env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY === 'placeholder-gemini-key' ||
    env.GEMINI_API_KEY.trim() === '';

  if (shouldUseMock) {
    logger.info({ kind, tripId, role }, 'Returning deterministic mock AI response');
    const mockData = mockFallback ? mockFallback() : null;
    await logAiRequest({
      userId,
      tripId,
      kind,
      model: MODEL_ROLES[role] || MODEL_ROLES.PRIMARY,
      latencyMs: Date.now() - startTime,
      success: true,
    });
    return mockData;
  }

  const modelChain = getModelChain(role);
  let lastError = null;

  for (let mIdx = 0; mIdx < modelChain.length; mIdx++) {
    const activeModel = modelChain[mIdx];
    const isLastModel = mIdx === modelChain.length - 1;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60s timeout

        const response = await ai.models.generateContent({
          model: activeModel,
          contents: [
            {
              role: 'user',
              parts: parts.map((p) => {
                if (p.inlineData) {
                  return {
                    inlineData: {
                      mimeType: p.inlineData.mimeType,
                      data: p.inlineData.data,
                    },
                  };
                }
                return { text: p.text || String(p) };
              }),
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature,
          },
        });

        clearTimeout(timeoutId);

        const rawText = response?.text;
        if (!rawText) {
          throw new AIServiceError('AI_INVALID_OUTPUT', `Empty response received from Gemini model ${activeModel}`);
        }

        // Parse JSON
        let parsed;
        try {
          parsed = JSON.parse(rawText);
        } catch (parseErr) {
          logger.warn({ parseErr: parseErr.message, rawText, activeModel }, 'JSON parse error, attempting repair');
          parsed = await attemptRepair({
            rawText,
            errorInfo: parseErr.message,
            schema,
            systemInstruction,
            model: activeModel,
          });
        }

        // Validate against Zod schema
        if (zodSchema) {
          const valResult = zodSchema.safeParse(parsed);
          if (!valResult.success) {
            logger.warn({ errors: valResult.error.format(), activeModel }, 'Zod validation failed, attempting repair');
            const repaired = await attemptRepair({
              rawText: JSON.stringify(parsed),
              errorInfo: JSON.stringify(valResult.error.format()),
              schema,
              systemInstruction,
              model: activeModel,
            });
            const revalidated = zodSchema.safeParse(repaired);
            if (!revalidated.success) {
              throw new AIServiceError(
                'AI_INVALID_OUTPUT',
                `AI output failed schema validation on ${activeModel} after repair attempt`,
                revalidated.error.errors
              );
            }
            parsed = revalidated.data;
          } else {
            parsed = valResult.data;
          }
        }

        // Success! Log metadata with model that finally succeeded
        const latencyMs = Date.now() - startTime;
        await logAiRequest({
          userId,
          tripId,
          kind,
          model: activeModel,
          latencyMs,
          success: true,
        });

        logger.info(
          { kind, tripId, model: activeModel, role, attempt, latencyMs },
          `Gemini request succeeded on model ${activeModel}`
        );

        return parsed;
      } catch (err) {
        lastError = err;

        // Classify error
        const isNotFound = err?.status === 404 || (err?.message && (err.message.includes('404') || err.message.includes('not found')));
        const isRateLimit = err?.status === 429 || (err?.message && err.message.includes('429'));
        const isServerError = err?.status >= 500 && err?.status < 600;
        const isTimeout = err?.name === 'AbortError' || (err?.message && err.message.includes('timeout'));
        const isBlocked = err?.message && (err.message.includes('blocked') || err.message.includes('SAFETY'));
        const isInvalidOutput = err?.code === 'AI_INVALID_OUTPUT';

        if (isBlocked) {
          await logAiRequest({
            userId,
            tripId,
            kind,
            model: activeModel,
            latencyMs: Date.now() - startTime,
            success: false,
            errorCode: 'AI_BLOCKED',
          });
          throw new AIServiceError('AI_BLOCKED', 'Content could not be processed due to safety guidelines.');
        }

        // 404 model not found -> Do not retry on this model; cascade immediately
        if (isNotFound) {
          logger.error({ activeModel, err: err.message }, `Model ${activeModel} not found (404). Cascading immediately to next model in fallback chain.`);
          break; // break retry loop to go to next model
        }

        // Rate limits / 5xx server errors: retry with backoff on same model first
        if ((isRateLimit || isServerError) && attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          logger.warn({ attempt, delayMs, err: err.message, activeModel }, 'Retrying Gemini API call');
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // If this model failed all retries, or timed out / invalid output:
        if (!isLastModel) {
          const nextModel = modelChain[mIdx + 1];
          logger.warn(
            { failedModel: activeModel, nextModel, error: err.message },
            `Model ${activeModel} failed with ${isTimeout ? 'TIMEOUT' : isInvalidOutput ? 'INVALID_OUTPUT' : err.message}. Retrying on fallback model ${nextModel}...`
          );
          break; // break retry loop to proceed to next model in chain
        }
      }
    }
  }

  // All models in fallback chain failed
  const isTimeout = lastError?.name === 'AbortError' || (lastError?.message && lastError.message.includes('timeout'));
  const isRateLimit = lastError?.status === 429 || (lastError?.message && lastError.message.includes('429'));
  const errorCode = isTimeout ? 'AI_TIMEOUT' : isRateLimit ? 'AI_BUSY' : 'AI_ERROR';
  const friendlyMessage = isTimeout
    ? 'Gemini AI request timed out. Please try again.'
    : isRateLimit
    ? 'WanderShot AI is experiencing high demand. Please try again shortly.'
    : `AI processing failed across all fallback models: ${lastError?.message || 'Unknown error'}`;

  await logAiRequest({
    userId,
    tripId,
    kind,
    model: modelChain[0],
    latencyMs: Date.now() - startTime,
    success: false,
    errorCode,
  });

  if (mockFallback) {
    logger.warn('All Gemini models failed, serving fallback mock data fixture');
    return mockFallback();
  }

  throw new AIServiceError(errorCode, friendlyMessage);
}

// 1 Repair retry helper
async function attemptRepair({ rawText, errorInfo, schema, systemInstruction, model = MODEL_ROLES.PRIMARY }) {
  try {
    const repairPrompt = `The previous output was invalid JSON or did not match the required schema:
Invalid Output:
${rawText}

Errors:
${errorInfo}

Fix all errors and return ONLY the corrected, valid JSON object matching the schema.`;

    const repairResponse = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.1,
      },
    });

    const repairedText = repairResponse?.text;
    return JSON.parse(repairedText);
  } catch (e) {
    logger.error({ err: e.message, model }, 'Failed during repair retry');
    throw new AIServiceError('AI_INVALID_OUTPUT', 'AI output repair attempt failed');
  }
}

/**
 * Optional Google Search Grounded Verification (behind GEMINI_GROUNDING=true)
 */
export async function verifyPlaceWithGrounding({ placeName, destination }) {
  if (!env.GEMINI_GROUNDING) return null;

  try {
    const prompt = `Search the web to verify if "${placeName}" exists in or near "${destination}".
Return 1 concise sentence stating its exact location and what it is known for, or "Not found in ${destination}".`;

    const response = await ai.models.generateContent({
      model: MODEL_ROLES.PRIMARY,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    return response?.text?.trim() || null;
  } catch (err) {
    logger.warn({ err: err.message, placeName, destination }, 'Grounded search verification failed');
    return null;
  }
}

/**
 * Startup model reachability check for all 3 configured models.
 * Refuses to start in production if PRIMARY fails.
 */
export async function checkGeminiModelsHealth() {
  const isMock =
    env.GEMINI_MOCK ||
    !env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY === 'placeholder-gemini-key' ||
    env.GEMINI_API_KEY.trim() === '';

  if (isMock) {
    logger.info('Gemini is in MOCK mode. Skipping live health ping.');
    cachedModelHealth = {
      PRIMARY: { model: MODEL_ROLES.PRIMARY, status: 'MOCK_OK', latency_ms: 0 },
      ESCALATION: { model: MODEL_ROLES.ESCALATION, status: 'MOCK_OK', latency_ms: 0 },
      FALLBACK: { model: MODEL_ROLES.FALLBACK, status: 'MOCK_OK', latency_ms: 0 },
      checked_at: new Date().toISOString(),
    };
    return cachedModelHealth;
  }

  logger.info('Checking reachability of configured Gemini AI models...');
  const results = {};

  for (const [role, modelName] of Object.entries(MODEL_ROLES)) {
    const t0 = Date.now();
    try {
      await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
      const latency = Date.now() - t0;
      results[role] = { model: modelName, status: 'OK', latency_ms: latency };
      logger.info({ role, model: modelName, latency_ms: latency }, `[AI HEALTH] ${role} model (${modelName}): OK`);
    } catch (err) {
      const is404 = err?.status === 404 || (err?.message && (err.message.includes('404') || err.message.includes('not found')));
      results[role] = {
        model: modelName,
        status: 'FAILED',
        error: is404 ? 'Model not found (404)' : err.message,
      };
      logger.warn(
        { role, model: modelName, error: err.message },
        `[AI HEALTH] ${role} model (${modelName}): FAILED (${err.message})`
      );
    }
  }

  cachedModelHealth = {
    ...results,
    checked_at: new Date().toISOString(),
  };

  return cachedModelHealth;
}

/**
 * Return current model reachability status (without exposing secrets).
 */
export function getAiModelsHealth() {
  return cachedModelHealth;
}
