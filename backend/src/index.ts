// src/index.ts
import app from './app.js';
import config from './config/index.js';
import { initMQTTService, mqttClient } from './services/mqtt/index.js';
import prisma from './utils/database.js';
import redis from './utils/redis.js';
import logger from './utils/logger.js';

const PORT = config.port;

async function startServer(): Promise<void> {
  try {
    logger.info('Starting database connection...');
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Test Redis connection (optional)
    try {
      logger.debug('Pinging Redis...');
      await redis.ping();
      logger.info('Redis connected');
    } catch (error) {
      logger.warn('Redis not available, running in degraded mode');
    }

    // Start Express server first (before MQTT)
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
    });

    // Initialize MQTT service asynchronously (non-blocking)
    initMQTTService().catch((err: unknown) => {
      logger.warn('MQTT service initialization failed (running in degraded mode)', {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Graceful shutdown
    const shutdown = (): void => {
      logger.info('Shutting down gracefully...');

      server.close(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async (): Promise<void> => {
          try {
            await prisma.$disconnect();
            logger.info('Database disconnected');

            redis.disconnect();
            logger.info('Redis disconnected');

            await mqttClient.end();
            logger.info('MQTT client disconnected');

            logger.info('Process terminated');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown', {
              error: error instanceof Error ? error.message : String(error),
            });
            process.exit(1);
          }
        })();
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown());
    process.on('SIGINT', () => shutdown());
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

void startServer();