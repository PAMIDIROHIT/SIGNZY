/**
 * src/db/prismaClient.js
 * Exports a single shared PrismaClient instance to be used across the application.
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Optional: Log long running queries or errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

export default prisma;
