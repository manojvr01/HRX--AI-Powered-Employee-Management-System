import { Router, Request, Response } from 'express';
import { Announcement } from '../../models/Announcement.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission, createAnnouncementSchema } from '@hrx/shared';
import { getIO } from '../../sockets/socketManager.js';
import { logAudit } from '../../services/auditService.js';
import { UnauthorizedError } from '../../utils/errors.js';

const router = Router();
router.use(authenticate);

// List announcements
router.get('/', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const role = req.user.role;
  const filter = {
    targetRole: { $in: ['ALL', role] },
  };

  const announcements = await Announcement.find(filter).sort({ createdAt: -1 }).limit(50);
  res.status(200).json({
    success: true,
    data: announcements,
  });
});

// Create announcement: HR / Admin
router.post(
  '/',
  authorize(Permission.SETTINGS_READ),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const data = createAnnouncementSchema.parse(req.body);

    const announcement = await Announcement.create({
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetRole: data.targetRole,
      authorId: req.user.id,
      authorName: req.user.email,
    });

    await logAudit({
      userId: req.user.id,
      action: 'ANNOUNCEMENT_CREATED',
      entity: 'Announcement',
      entityId: announcement._id.toString(),
      details: { title: data.title, priority: data.priority },
      req,
    });

    // Real-time Socket.IO broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit('announcement:new', announcement);
      }
    } catch {
      // Ignore if socket server not ready
    }

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement posted and broadcasted successfully',
    });
  }
);

export const announcementRoutes = router;
