import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";
import { Post } from "../models/Post";
import { ALLOWED_ORIGINS } from "../config/cors";
import fs from "fs";
import path from "path";

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

    test('Crea una publicación con descripción y un medio multipart', async () => {
        const description = 'Publicación con imagen';
        const imageDir = path.join(process.cwd(), 'media', 'images');
        const filesBefore = new Set(fs.readdirSync(imageDir));
        const response = await api
            .post('/posts')
            .set('Cookie', sessionCookie)
            .set('Origin', ALLOWED_ORIGINS[1])
            .field('description', description)
            .attach('media', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVZkAAAAASUVORK5CYII=', 'base64'), {
                filename: 'post.png',
                contentType: 'image/png'
            });

        try {
            expect(response.status).toBe(200);
            expect(response.body.newPost).toMatchObject({ description });
            expect(response.body.newPost.media).toMatch(/^\/media\/images\/media-.*\.png$/);
            const savedPost = await Post.findByPk(response.body.newPost.post_id);
            expect(savedPost?.getDataValue('description')).toBe(description);
            expect(savedPost?.getDataValue('media')).toBe(response.body.newPost.media);
        } finally {
            try {
                if (response.body.newPost?.post_id) {
                    await Post.destroy({ where: { post_id: response.body.newPost.post_id }, force: true });
                }
            } finally {
                for (const filename of fs.readdirSync(imageDir)) {
                    if (!filesBefore.has(filename) && /^media-\d+-\d+\.png$/.test(filename)) {
                        fs.unlinkSync(path.join(imageDir, filename));
                    }
                }
            }
        }
    });

    test('Rechaza un formulario multipart sin descripción', async () => {
        const imageDir = path.join(process.cwd(), 'media', 'images');
        const filesBefore = fs.readdirSync(imageDir).sort();
        const response = await api
            .post('/posts')
            .set('Cookie', sessionCookie)
            .set('Origin', ALLOWED_ORIGINS[1])
            .attach('media', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVZkAAAAASUVORK5CYII=', 'base64'), {
                filename: 'rejected-post.png',
                contentType: 'image/png'
            })
            .expect(400);

        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.stringContaining('description')
        ]));
        expect(fs.readdirSync(imageDir).sort()).toEqual(filesBefore);
    });

    afterAll(async () => {
        await sequelize.close();
    })
})
