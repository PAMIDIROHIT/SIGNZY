import { Router } from 'express';
import { getVendorMetricsHandler } from './metrics.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// GET /vendor-metrics
// Optional query: ?capability=PAN_VERIFICATION
router.get('/', asyncHandler(getVendorMetricsHandler));

export default router;
