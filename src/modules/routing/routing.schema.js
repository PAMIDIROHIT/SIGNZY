import { z } from 'zod';

export const routeRequestSchema = z.object({
  capability: z.string().min(1, 'Capability is required'),
  payload: z.record(z.any()),
  requirements: z.object({
    features: z.array(z.string()).optional(),
    maxLatencyMs: z.number().optional(),
    preferLowCost: z.boolean().optional(),
  }).optional(),
});
