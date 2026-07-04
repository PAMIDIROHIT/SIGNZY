/**
 * src/app.js
 * Express application assembly. Configures middlewares and routes.
 */
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { clientRateLimiter } from './middlewares/clientRateLimiter.js';
import simulatorRoutes from './modules/simulator/simulator.routes.js';
import vendorRoutes from './modules/vendors/vendor.routes.js';
import metricsRoutes from './modules/metrics/metrics.routes.js';
import routingRoutes from './modules/routing/routing.routes.js';
import logsRoutes from './modules/logs/logs.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import agentRoutes from './modules/agent/agent.routes.js';

const app = express();

// Middleware: CORS
app.use(cors());

// Middleware: Parse JSON bodies
app.use(express.json());

// Middleware: Client Rate Limiter
app.use(clientRateLimiter);

// Middleware: Request Logger
app.use(requestLogger);

// Root endpoint for health/info
app.get('/', (req, res) => {
  res.json({
    name: 'Intelligent Vendor Routing Platform',
    status: 'Running',
    version: '1.0.0'
  });
});

// Mount routes
app.use('/simulate', simulatorRoutes);
app.use('/vendors', vendorRoutes);
app.use('/vendor-metrics', metricsRoutes);
app.use('/route', routingRoutes);
app.use('/routing-logs', logsRoutes);
app.use('/health', healthRoutes);
app.use('/agent', agentRoutes);

// Middleware: Error Handler (must be last)
app.use(errorHandler);

export default app;
