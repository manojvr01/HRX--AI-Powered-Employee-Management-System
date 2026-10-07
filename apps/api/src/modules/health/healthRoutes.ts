import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

function handleHealth(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'HRX API',
    memoryUsage: process.memoryUsage(),
  });
}

function handleReady(req: Request, res: Response) {
  const isMongoReady = mongoose.connection.readyState === 1;

  if (!isMongoReady) {
    res.status(503).json({
      status: 'unready',
      message: 'Database connection is not established',
      database: 'disconnected',
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
}

// Support both /health and /
router.get('/', handleHealth);
router.get('/health', handleHealth);
router.get('/ready', handleReady);

export const healthRoutes = router;
