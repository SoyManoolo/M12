import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";
import { User } from "../models";

const api = supertest(app)


describe('Auth test:', () => {

    beforeAll(async () => {
        await User.destroy({ where: { email: "erik.saldi.diaz@gmail.com" } })
    })

    test('Test de registro', async () => {
        await api
            .post('/auth/register')
            .send({
                email: "erik.saldi.diaz@gmail.com",
                username: "manolo",
                name: "Erik",
                surname: "Saldaña",
                password: "12345678"
            })
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });

    test('Test de login', async () => {
        await api
            .post('/auth/login')
            .send({
                id: "erik.saldi.diaz@gmail.com",
                password: "12345678"
            })
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });

    afterAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await sequelize.close()
    })
});