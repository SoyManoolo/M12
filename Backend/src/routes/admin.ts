import { Router } from 'express';
import { adminController } from '../controllers/admin';
import { AuthToken } from '../middlewares/validation/authentication/jwt';

const router = Router();
router.use(AuthToken.verifyToken, AuthToken.isModerator);
router.get('/stats', adminController.getStats);

export default router;
