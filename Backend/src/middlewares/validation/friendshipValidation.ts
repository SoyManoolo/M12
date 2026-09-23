import { celebrate, Joi, Segments } from 'celebrate';

const uuid = Joi.string().uuid().required();

export const validateFriendRequest = celebrate({
    [Segments.BODY]: Joi.object({
        receiver_id: uuid,
        created_from: Joi.string().valid('search', 'video_call', 'suggestion').optional()
    }).required()
});

export const validateFriendshipId = celebrate({
    [Segments.PARAMS]: Joi.object({ friend_id: uuid }).required()
});

export const validateRequestId = celebrate({
    [Segments.PARAMS]: Joi.object({ request_id: uuid }).required()
});

export const validateOtherUserId = celebrate({
    [Segments.PARAMS]: Joi.object({ other_user_id: uuid }).required()
});
