import path from 'node:path';
import { Post } from '../models';
import { mediaDirectory, parseMediaPath } from '../utils/mediaFiles';
import { getRequiredRouteParam } from '../utils/request';
import { AppError } from '../middlewares/errors/AppError';
import { Router } from 'express';
import { adminController } from '../controllers/admin';
import { AuthToken } from '../middlewares/validation/authentication/jwt';

const router = Router();
router.use(AuthToken.verifyToken, AuthToken.isModerator);
router.get('/stats', adminController.getStats);

router.get('/posts/:id/media', async (req, res, next) => {
    const postId = getRequiredRouteParam(req.params.id, 'id');
    const post = await Post.findByPk(postId, { paranoid: false, attributes: ['post_id', 'media'] });
    const media = post?.getDataValue('media');
    const file = media && parseMediaPath(media);
    if (!file) {
        res.sendStatus(404);
        return;
    }

    res.sendFile(file.filename, {
        root: path.join(mediaDirectory, file.format.folder),
        headers: {
            'Content-Type': file.format.mime,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    }, (error) => {
        if (error) next('status' in error && error.status === 404 ? new AppError(404, 'PostNotFound') : error);
    });
});

export default router;
