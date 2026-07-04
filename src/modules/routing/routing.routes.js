import { Router } from 'express';
import { routeRequestHandler } from './routing.controller.js';
import { validate } from '../../middlewares/validate.js';
import { routeRequestSchema } from './routing.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// POST /route
router.post('/', validate(routeRequestSchema, 'body'), asyncHandler(routeRequestHandler));

export default router;
