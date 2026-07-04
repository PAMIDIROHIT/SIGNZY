import { Router } from 'express';
import { getRoutingLogsHandler } from './logs.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// GET /routing-logs
router.get('/', asyncHandler(getRoutingLogsHandler));

export default router;
