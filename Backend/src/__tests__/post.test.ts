import supertest from "supertest";
import { app } from "../app";
import { sequelize } from "../config/database";
import { Post, User } from "../models";
import { cleanupOldData } from "../scripts/cleanup";
import { ALLOWED_ORIGINS } from "../config/cors";
import fs from "fs";
import path from "path";

const api = supertest(app)

let sessionCookie = '';
let registeredUsername = '';

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
                    if (!filesBefore.has(filename) && /^media-[\da-f-]+\.png$/.test(filename)) {
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

    test('Los posts de vídeo exponen el tipo y sirven rangos del archivo', async () => {
        const video = Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex');
        const created = await api
            .post('/posts')
            .set('Cookie', sessionCookie)
            .set('Origin', ALLOWED_ORIGINS[1])
            .field('description', 'Publicación con vídeo')
            .attach('media', video, { filename: 'clip.mp4', contentType: 'video/mp4' })
            .expect(200);

        const { post_id, media, media_type } = created.body.newPost;
        try {
            expect(media_type).toBe('video');
            const feed = await api.get('/posts').set('Cookie', sessionCookie).expect(200);
            expect(feed.body.data.posts).toEqual(expect.arrayContaining([
                expect.objectContaining({ post_id, media, media_type: 'video' })
            ]));
            const profile = await api.get('/posts/username').query({ username: registeredUsername })
                .set('Cookie', sessionCookie).expect(200);
            expect(profile.body.data.posts).toEqual(expect.arrayContaining([
                expect.objectContaining({ post_id, media, media_type: 'video' })
            ]));
            const partial = await api.get(media).set('Range', 'bytes=0-7').expect(206);
            expect(partial.headers['content-range']).toBe('bytes 0-7/24');
            expect(partial.headers['content-type']).toBe('video/mp4');
        } finally {
            await Post.destroy({ where: { post_id }, force: true });
            fs.unlinkSync(path.join(process.cwd(), media));
        }
    });

    test('Rechaza el medio si el contenido no corresponde al formato admitido', async () => {
        const staging = path.join(process.cwd(), 'media', '.staging');
        const filesBefore = fs.readdirSync(staging).sort();
        await api
            .post('/posts')
            .set('Cookie', sessionCookie)
            .set('Origin', ALLOWED_ORIGINS[1])
            .field('description', 'Medio no compatible')
            .attach('media', Buffer.from('datos de prueba'), { filename: 'not-a-photo.png', contentType: 'image/png' })
            .expect(400);

        expect(fs.readdirSync(staging).sort()).toEqual(filesBefore);
    });

    test('Retira el medio del acceso público hasta purgarlo del disco', async () => {
        const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVZkAAAAASUVORK5CYII=', 'base64');
        const response = await api.post('/posts').set('Cookie', sessionCookie).set('Origin', ALLOWED_ORIGINS[1])
            .field('description', 'Publicación para eliminar')
            .attach('media', image, { filename: 'remove.png', contentType: 'image/png' }).expect(200);
        const { post_id, media } = response.body.newPost;
        const filename = path.join(process.cwd(), media);

        try {
            await api.get(media).expect(200);
            await api.delete(`/posts/${post_id}`).set('Cookie', sessionCookie).set('Origin', ALLOWED_ORIGINS[1]).expect(200);
            await api.get(media).expect(404);
            expect(fs.existsSync(filename)).toBe(true);
            await api.get(`/admin/posts/${post_id}/media`).set('Cookie', sessionCookie).expect(403);

            await User.update({ is_moderator: true }, { where: { username: registeredUsername } });
            await api.get(`/admin/posts/${post_id}/media`).set('Cookie', sessionCookie).expect(200);

            const old = new Date(2000, 0, 1);
            fs.utimesSync(filename, old, old);
            await Post.update({ deleted_at: old }, { where: { post_id }, paranoid: false });
            await cleanupOldData();
            expect(await Post.findByPk(post_id, { paranoid: false })).toBeNull();
            expect(fs.existsSync(filename)).toBe(false);
        } finally {
            await User.update({ is_moderator: false }, { where: { username: registeredUsername } });
            await Post.destroy({ where: { post_id }, force: true });
            fs.rmSync(filename, { force: true });
        }
    });


    afterAll(async () => {
        await sequelize.close();
    })
})
