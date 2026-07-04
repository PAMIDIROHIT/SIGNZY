/**
 * src/server.js
 * Application entrypoint. Starts the Express server.
 */
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import app from './app.js';

const startServer = async () => {
  try {
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
