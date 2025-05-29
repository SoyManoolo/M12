import { Router } from 'express';
import { friendshipController } from '../controllers/friendship.controller';
import { AuthToken } from '../middlewares/validation/authentication/jwt';

const router = Router();

// Todas las rutas requieren autenticación
router.use(AuthToken.verifyToken);

// Enviar solicitud de amistad
router.post('/request', friendshipController.sendFriendRequest);

// Aceptar solicitud de amistad
router.post('/request/:request_id/accept', friendshipController.acceptFriendRequest);

// Rechazar solicitud de amistad
router.post('/request/:request_id/reject', friendshipController.rejectFriendRequest);

// Obtener solicitudes pendientes
router.get('/requests/pending', friendshipController.getPendingFriendRequests);

// Obtener lista de amigos
router.get('/friends', friendshipController.getUserFriends);

// Eliminar amistad
router.delete('/friends/:friend_id', friendshipController.removeFriendship);

export default router; 