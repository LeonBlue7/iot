// src/index.ts
import app from './app.js';
import config from './config/index.js';
import { initMQTTService } from './services/mqtt/index.js';
import prisma from './utils/database.js';
import redis from './utils/redis.js';

const PORT = config.port;

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected');

    // Test Redis connection
    await redis.ping();
    console.log('Redis connected');

    // Initialize MQTT service
    await initMQTTService();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown
    const shutdown = (): void => {
      console.log('Shutting down gracefully...');

      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        console.log('Process terminated');
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();