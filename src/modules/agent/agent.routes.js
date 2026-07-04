import { Router } from 'express';
import { 
  recommendStrategyHandler, 
  explainDecisionHandler, 
  detectUnhealthyHandler, 
  suggestFallbackRulesHandler, 
  generateConfigHandler 
} from './agent.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// POST /agent/recommend-strategy
router.post('/recommend-strategy', asyncHandler(recommendStrategyHandler));

// POST /agent/explain-decision
router.post('/explain-decision', asyncHandler(explainDecisionHandler));

// GET /agent/detect-unhealthy
router.get('/detect-unhealthy', asyncHandler(detectUnhealthyHandler));

// POST /agent/suggest-fallback-rules
router.post('/suggest-fallback-rules', asyncHandler(suggestFallbackRulesHandler));

// POST /agent/generate-config
router.post('/generate-config', asyncHandler(generateConfigHandler));

export default router;
