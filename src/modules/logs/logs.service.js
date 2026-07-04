import { prisma } from '../../db/prismaClient.js';

export const getRoutingLogs = async (filters, pagination) => {
  const { capability, vendorUsed, status, startDate, endDate } = filters;
  const { page = 1, limit = 10 } = pagination;
  
  const where = {};
  if (capability) where.capability = capability;
  if (vendorUsed) where.vendorSelected = vendorUsed;
  if (status) where.status = status;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await prisma.$transaction([
    prisma.routingLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.routingLog.count({ where })
  ]);

  return {
    data: logs,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};
