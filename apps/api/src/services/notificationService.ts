import { Notification, INotificationDocument } from '../models/Notification.js';
import { emitToUser } from '../sockets/socketManager.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' | string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createAndSendNotification(
  params: CreateNotificationParams
): Promise<INotificationDocument | null> {
  const userIdStr = params.userId.toString();

  try {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(userIdStr),
      title: params.title,
      message: params.message,
      type: params.type || 'INFO',
      link: params.link,
      metadata: params.metadata,
      isRead: false,
    });

    // Real-time broadcast to the specific user's socket room
    try {
      emitToUser(userIdStr, 'notification:new', {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      logger.error({ err, userId: userIdStr }, 'Failed to emit socket notification');
    }

    return notification;
  } catch (err) {
    logger.error({ err, userId: userIdStr, params }, 'Failed to create notification');
    return null;
  }
}

export async function getUserNotifications(
  userId: string,
  limit = 20
): Promise<{ notifications: any[]; unreadCount: number }> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: userObjectId, isRead: false }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await Notification.updateOne(
    {
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { isRead: true }
  );
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), isRead: false },
    { isRead: true }
  );
}
