import { Router } from 'express';
import { notificationController } from '../controllers/notification';
import { AuthToken } from '../middlewares/validation/authentication/jwt';

const router = Router();
router.use(AuthToken.verifyToken);
router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:notification_id/read', notificationController.markRead);
router.delete('/:notification_id', notificationController.remove);

export default router;
