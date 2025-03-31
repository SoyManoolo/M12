import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";

const api = supertest(app)

afterAll(async () => {
    await sequelize.close
})

describe('Auth test:', () => {
    test('Test de prueba', async () => {
        await api
            .get('/auth/login')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });
})