import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capability: z.string().min(1, 'Capability is required'),
  endpointUrl: z.string().url('Must be a valid URL'),
  priority: z.number().int().default(99),
  weight: z.number().int().min(0).max(100).default(0),
  costPerRequest: z.number().min(0).default(0.0),
  timeoutMs: z.number().int().min(100).default(5000),
  rateLimitPerMinute: z.number().int().min(1).default(60),
  supportedFeatures: z.array(z.string()).default([]),
});

export const updateVendorStatusSchema = z.object({
  isActive: z.boolean(),
});

export const getVendorsQuerySchema = z.object({
  capability: z.string().optional(),
});
