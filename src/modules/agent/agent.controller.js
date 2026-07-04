import * as agentService from './agent.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const recommendStrategyHandler = async (req, res) => {
  const { capability } = req.body;
  const result = await agentService.recommendStrategy(capability);
  sendSuccess(res, 200, { recommendation: result }, 'Strategy recommendation generated');
};

export const explainDecisionHandler = async (req, res) => {
  const { logId } = req.body;
  const result = await agentService.explainDecision(logId);
  sendSuccess(res, 200, { explanation: result }, 'Decision explained');
};

export const detectUnhealthyHandler = async (req, res) => {
  const result = await agentService.detectUnhealthy();
  sendSuccess(res, 200, { analysis: result }, 'Health analysis generated');
};

export const suggestFallbackRulesHandler = async (req, res) => {
  const { capability } = req.body;
  const result = await agentService.suggestFallbackRules(capability);
  sendSuccess(res, 200, { suggestion: result }, 'Fallback rules suggested');
};

export const generateConfigHandler = async (req, res) => {
  const { text } = req.body;
  const config = await agentService.generateConfigFromText(text);
  sendSuccess(res, 200, { config }, 'Config generated successfully');
};
