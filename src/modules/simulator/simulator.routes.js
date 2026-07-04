import { Router } from 'express';
import { simulateVendorRequest } from './simulator.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// POST /simulate/:vendorName/verify
// e.g., /simulate/VendorA/verify?capability=PAN_VERIFICATION&failRate=0.3&latencyMs=1500
router.post('/:vendorName/verify', asyncHandler(simulateVendorRequest));

export default router;
