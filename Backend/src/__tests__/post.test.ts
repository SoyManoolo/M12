import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";

const api = supertest(app)

let token = ""

describe('Post test:', () => {
    beforeAll(async () => {
        const response = await api
        .post('/auth/login')
        .send({
            id: "erik.saldi.diaz@gmail.com",
            password: "12345678"
        })
        token = response.body.token
    })

        test('Test de prueba', async () => {
        await api
            .get('/posts')
            .set({
                Authorization: `Bearer ${token}`
            })
            .send({

            })
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });

    afterAll(async () => {
        await sequelize.close
    })
})