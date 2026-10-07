import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 HRX API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`🔗 Base URL: http://localhost:${env.PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start HRX server');
    process.exit(1);
  }
}

bootstrap();
