import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";

const api = supertest(app)

afterAll(async () => {
    await sequelize.close
})

describe('Comment test:', () => {
    test('Test de prueba', async () => {
        await api
            .get('/users')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });
})