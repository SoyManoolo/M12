import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";

const api = supertest(app)

let sessionCookie = '';

describe('Post test:', () => {
    beforeAll(async () => {
        const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
        const response = await api
        .post('/auth/register')
        .send({
            email: `post-ci-${suffix}@example.com`,
            username: `post-ci-${suffix}`,
            name: "CI",
            surname: "Test",
            password: "Test1234!"
        })
        .expect(200);
        sessionCookie = response.headers['set-cookie'];
    })

        test('Test de prueba', async () => {
        await api
            .get('/posts')
            .set('Cookie', sessionCookie)
            .send({

            })
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });

    afterAll(async () => {
        await sequelize.close
    })
})
