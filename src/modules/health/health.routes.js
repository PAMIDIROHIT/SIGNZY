import { Router } from 'express';
import { prisma } from '../../db/prismaClient.js';
import { getLiveMetrics } from '../metrics/metrics.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const vendorMetrics = await getLiveMetrics();
    const vendorHealth = vendorMetrics.map(v => ({
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      capability: v.capability,
      status: v.availabilityStatus
    }));

    sendSuccess(res, 200, {
      uptimeSeconds: process.uptime(),
      dbStatus: 'CONNECTED',
      vendors: vendorHealth
    }, 'System is healthy');
    
  } catch (err) {
    sendError(res, 503, 'System is degraded or down', {
      dbStatus: 'DISCONNECTED',
      error: err.message
    });
  }
});

export default router;
