import { generateCacheKey, getCached, setCached } from './memory-cache';
import {
  PredictionAnalyzer,
  PredictionReflection,
  PredictionReflectionInput,
} from '../ai/prediction-analyzer';

const analyzer = new PredictionAnalyzer();
const reflectionTagIndex = new Map<string, string>();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

function resolveTag(input: PredictionReflectionInput, explicitTag?: string): string {
  if (explicitTag) return explicitTag;
  if (input.insightId) return input.insightId;
  return `${input.question}:${input.actualOutcome}`;
}

export async function getReflectionWithCache(
  input: PredictionReflectionInput,
  options: { ttlMs?: number; tag?: string } = {},
): Promise<PredictionReflection> {
  const tag = resolveTag(input, options.tag);
  const cachedByTag = reflectionTagIndex.get(tag);
  if (cachedByTag) {
    const taggedEntry = getCached<PredictionReflection>(cachedByTag);
    if (taggedEntry) {
      return taggedEntry.data;
    }
  }

  const cacheKey = generateCacheKey('ai_reflection', {
    insight: input.insightId || input.question,
    outcome: input.actualOutcome,
    resolved: input.resolutionDate || 'unknown',
  });

  const cached = getCached<PredictionReflection>(cacheKey);
  if (cached) {
    reflectionTagIndex.set(tag, cacheKey);
    return cached.data;
  }

  const reflection = await analyzer.reflectPrediction(input);
  setCached(cacheKey, reflection, options.ttlMs ?? DEFAULT_TTL);
  reflectionTagIndex.set(tag, cacheKey);
  return reflection;
}

export function primeReflectionCache(
  tag: string,
  reflection: PredictionReflection,
  ttlMs: number = DEFAULT_TTL,
): void {
  const cacheKey = generateCacheKey('ai_reflection', {
    insight: reflection.insightId || tag,
    outcome: reflection.metrics.outcome,
    resolved: reflection.metrics.resolutionDate || 'unknown',
  });
  setCached(cacheKey, reflection, ttlMs);
  reflectionTagIndex.set(tag, cacheKey);
}

export function getReflectionFromTag(tag: string): PredictionReflection | null {
  const cacheKey = reflectionTagIndex.get(tag);
  if (!cacheKey) return null;
  const cached = getCached<PredictionReflection>(cacheKey);
  return cached ? cached.data : null;
}

export function clearReflectionTag(tag: string): void {
  reflectionTagIndex.delete(tag);
}
