import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '@hrx/shared';

let io: SocketIOServer | null = null;

interface SocketUserPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate handshake
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUserPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUserPayload;
    const userRoom = `user:${user.sub}`;
    const roleRoom = `role:${user.role}`;

    socket.join(userRoom);
    socket.join(roleRoom);

    logger.info(
      { socketId: socket.id, userId: user.sub, role: user.role },
      'Socket client connected and joined rooms'
    );

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId: user.sub }, 'Socket client disconnected');
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, payload: any): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToRole(role: string, event: string, payload: any): void {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
}
