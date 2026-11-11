import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";
import { User, VideoCalls, VideoCallRatings } from "../models";
import { VideoCallService } from "../services/videoCall";

const api = supertest(app)

afterAll(async () => {
    await sequelize.close();
})

describe('VideoCall test:', () => {
    test('Test de prueba', async () => {
        await api
            .get('/users')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });

    test('accepts one rating per participant on a persisted ended call', async () => {
        const usernames = ['rating-alice', 'rating-bob', 'rating-outsider'];
        try {
            const users = await User.bulkCreate(usernames.map(username => ({
                username,
                name: username,
                surname: 'Test',
                email: `${username}@example.com`,
                password: 'hashed-password'
            })));
            const [alice, bob, outsider] = users.map(user => user.user_id);
            const call = await VideoCalls.create({ user1_id: alice, user2_id: bob, status: 'ended' });
            const callId = call.getDataValue('call_id');
            const service = VideoCallService.getInstance();

            await expect(service.rateCall(callId, outsider, alice, 5)).resolves.toMatchObject({ success: false });
            await expect(service.rateCall(callId, alice, bob, 0)).resolves.toMatchObject({ success: false });
            await expect(service.rateCall(callId, alice, bob, 6)).resolves.toMatchObject({ success: false });
            await expect(service.rateCall(callId, alice, bob, 5)).resolves.toMatchObject({ success: true });
            await expect(service.rateCall(callId, bob, alice, 1)).resolves.toMatchObject({ success: true });
            await expect(service.rateCall(callId, alice, bob, 3)).resolves.toMatchObject({ success: false });

            const ratings = await VideoCallRatings.findAll({ where: { video_call_id: callId }, raw: true });
            expect(ratings).toHaveLength(2);
            expect(ratings).toEqual(expect.arrayContaining([
                expect.objectContaining({ rater_id: alice, rated_id: bob, rating: 5 }),
                expect.objectContaining({ rater_id: bob, rated_id: alice, rating: 1 })
            ]));
        } finally {
            await User.destroy({ where: { username: usernames }, force: true });
        }
    });
})
