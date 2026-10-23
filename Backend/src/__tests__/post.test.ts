import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";

const api = supertest(app)

let sessionCookie = '';
let registeredUsername = '';
const uploadedMedia: string[] = [];

describe('Post test:', () => {
    beforeAll(async () => {
        const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
        registeredUsername = `post-ci-${suffix}`;
        const response = await api
        .post('/auth/register')
        .send({
            email: `post-ci-${suffix}@example.com`,
            username: registeredUsername,
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

    test('Los posts de imagen y vídeo exponen el tipo y sirven el medio', async () => {
        for (const [mime, filename, expectedType] of [
            ['image/png', 'photo.png', 'image'],
            ['video/mp4', 'clip.mp4', 'video'],
        ]) {
            const created = await api
                .post('/posts')
                .set('Cookie', sessionCookie)
                .set('Origin', 'http://localhost:5173')
                .field('description', `Medio ${expectedType}`)
                .attach('media', Buffer.from('fixture'), { filename, contentType: mime })
                .expect(200);

            const { post_id, media, media_type } = created.body.newPost;
            uploadedMedia.push(path.join(process.cwd(), media.replace(/^\//, '')));
            expect(media_type).toBe(expectedType);
            expect(media).toMatch(new RegExp(`^/media/${expectedType === 'video' ? 'videos' : 'images'}/`));

            const listed = await api.get('/posts').set('Cookie', sessionCookie).expect(200);
            expect(listed.body.data.posts).toEqual(expect.arrayContaining([
                expect.objectContaining({ post_id, media, media_type: expectedType })
            ]));
            const profilePosts = await api.get('/posts/username').query({ username: registeredUsername })
                .set('Cookie', sessionCookie).expect(200);
            expect(profilePosts.body.data.posts).toEqual(expect.arrayContaining([
                expect.objectContaining({ post_id, media, media_type: expectedType })
            ]));
            await api.get(media).expect(200).expect('Content-Type', mime);
            if (expectedType === 'video') {
                const partial = await api.get(media).set('Range', 'bytes=0-2').expect(206);
                expect(partial.headers['content-range']).toBe('bytes 0-2/7');
                expect(partial.body).toEqual(Buffer.from('fix'));
            }
        }
    });

    test('Una descripción inválida no deja el vídeo subido en disco', async () => {
        const videoDir = path.join(process.cwd(), 'media', 'videos');
        const filesBefore = (await readdir(videoDir)).sort();

        await api
            .post('/posts')
            .set('Cookie', sessionCookie)
            .set('Origin', 'http://localhost:5173')
            .attach('media', Buffer.from('fixture'), { filename: 'invalid-post.mp4', contentType: 'video/mp4' })
            .expect(400);

        expect((await readdir(videoDir)).sort()).toEqual(filesBefore);
    });

    afterAll(async () => {
        await Promise.all(uploadedMedia.map(file => unlink(file)));
        await sequelize.close();
    })
})
