// src/index.ts
import app from './app.js';
import config from './config/index.js';
import { initMQTTService, mqttClient } from './services/mqtt/index.js';
import prisma from './utils/database.js';
import redis from './utils/redis.js';

const PORT = config.port;

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('Database connected');

    // Test Redis connection
    await redis.ping();
    // eslint-disable-next-line no-console
    console.log('Redis connected');

    // Initialize MQTT service
    await initMQTTService();

    // Start Express server
    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown
    const shutdown = (): void => {
      // eslint-disable-next-line no-console
      console.log('Shutting down gracefully...');

      server.close(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async (): Promise<void> => {
          try {
            await prisma.$disconnect();
            // eslint-disable-next-line no-console
            console.log('Database disconnected');

            redis.disconnect();
            // eslint-disable-next-line no-console
            console.log('Redis disconnected');

            await mqttClient.end();
            // eslint-disable-next-line no-console
            console.log('MQTT client disconnected');

            // eslint-disable-next-line no-console
            console.log('Process terminated');
            process.exit(0);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error during shutdown:', error);
            process.exit(1);
          }
        })();
      });

      // Force close after 10s
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown());
    process.on('SIGINT', () => shutdown());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
