import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../db/prismaClient.js';
import { getLiveMetrics } from '../metrics/metrics.service.js';

import { explainDecisionPrompt } from './prompts/explainDecision.prompt.js';
import { recommendStrategyPrompt } from './prompts/recommendStrategy.prompt.js';
import { detectUnhealthyPrompt } from './prompts/detectUnhealthy.prompt.js';
import { suggestFallbackRulesPrompt } from './prompts/suggestFallbackRules.prompt.js';
import { generateConfigFromTextPrompt } from './prompts/generateConfigFromText.prompt.js';

// Initialize Groq client
// The user mentioned they will provide the key later, so we handle missing key gracefully.
let groq = null;
if (env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: env.GROQ_API_KEY });
}

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Helper to call Groq completion API
 */
const callGroq = async (prompt) => {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to .env');
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.1, // Low temp for more deterministic config generation
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error('Groq API Error:', error);
    throw new Error('Failed to generate response from AI agent.');
  }
};

export const recommendStrategy = async (capability) => {
  const metrics = await getLiveMetrics(capability);
  const prompt = recommendStrategyPrompt(capability, JSON.stringify(metrics));
  return callGroq(prompt);
};

export const explainDecision = async (logId) => {
  const logEntry = await prisma.routingLog.findUnique({ where: { id: logId } });
  if (!logEntry) throw new Error('Routing log not found');
  
  const prompt = explainDecisionPrompt(logEntry);
  return callGroq(prompt);
};

export const detectUnhealthy = async () => {
  const metrics = await getLiveMetrics();
  const prompt = detectUnhealthyPrompt(JSON.stringify(metrics));
  return callGroq(prompt);
};

export const suggestFallbackRules = async (capability) => {
  const vendors = await prisma.vendor.findMany({ where: { capability } });
  const prompt = suggestFallbackRulesPrompt(capability, vendors);
  return callGroq(prompt);
};

export const generateConfigFromText = async (text) => {
  const prompt = generateConfigFromTextPrompt(text);
  
  let result = await callGroq(prompt);
  let parsedConfig = null;

  try {
    // Basic cleanup in case model wrapped it in markdown anyway
    result = result.replace(/```json/g, '').replace(/```/g, '').trim();
    parsedConfig = JSON.parse(result);
  } catch (e) {
    // Retry once with error correction if invalid JSON
    logger.warn('Initial AI output was not valid JSON, retrying...');
    const retryPrompt = `
      Your previous output was invalid JSON. Please output STRICTLY valid JSON without any markdown formatting.
      Original requirement: "${text}"
      Previous bad output: ${result}
    `;
    const retryResult = await callGroq(retryPrompt);
    const cleaned = retryResult.replace(/```json/g, '').replace(/```/g, '').trim();
    parsedConfig = JSON.parse(cleaned); // Let this throw if it still fails
  }

  return parsedConfig;
};
