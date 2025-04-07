import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";

const api = supertest(app)

afterAll(async () => {
    await sequelize.close
})

describe('Post test:', () => {
    test('Test de prueba', async () => {
        await api
            .get('/posts')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });
})