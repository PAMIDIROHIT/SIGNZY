import { Router } from 'express';
import { createVendorHandler, getVendorsHandler, updateVendorStatusHandler } from './vendor.controller.js';
import { validate } from '../../middlewares/validate.js';
import { createVendorSchema, getVendorsQuerySchema, updateVendorStatusSchema } from './vendor.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// POST /vendors - Register a vendor
router.post('/', validate(createVendorSchema, 'body'), asyncHandler(createVendorHandler));

// GET /vendors?capability=... - List vendors
router.get('/', validate(getVendorsQuerySchema, 'query'), asyncHandler(getVendorsHandler));

// PATCH /vendors/:id - Update active status
router.patch('/:id', validate(updateVendorStatusSchema, 'body'), asyncHandler(updateVendorStatusHandler));

export default router;
