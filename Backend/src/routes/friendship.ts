import { Router } from 'express';
import { friendshipController } from '../controllers/friendship';
import { AuthToken } from '../middlewares/validation/authentication/jwt';
import { validateFriendRequest, validateFriendshipId, validateOtherUserId, validateRequestId } from '../middlewares/validation/friendshipValidation';

const router = Router();

// Todas las rutas requieren autenticación
router.use(AuthToken.verifyToken);

// Candidatos que excluyen al usuario autenticado, amistades, solicitudes y bloqueos.
router.get('/suggestions', friendshipController.getFriendSuggestions);

// Enviar solicitud de amistad
router.post('/request', validateFriendRequest, friendshipController.sendFriendRequest);

// Aceptar solicitud de amistad
router.post('/request/:request_id/accept', validateRequestId, friendshipController.acceptFriendRequest);

// Rechazar solicitud de amistad
router.post('/request/:request_id/reject', validateRequestId, friendshipController.rejectFriendRequest);

// Cancelar solicitud de amistad
router.post('/request/:request_id/cancel', validateRequestId, friendshipController.cancelFriendRequest);

// Obtener solicitudes pendientes
router.get('/requests/pending', friendshipController.getPendingFriendRequests);

// Obtener solicitudes enviadas
router.get('/requests/sent', friendshipController.getSentFriendRequests);

// Obtener lista de amigos
router.get('/friends', friendshipController.getUserFriends);

// Obtener estado de la relación con otro usuario
router.get('/status/:other_user_id', validateOtherUserId, friendshipController.getFriendshipStatus);

// Eliminar amistad
router.delete('/remove/:friend_id', validateFriendshipId, friendshipController.removeFriendship);

export default router;
