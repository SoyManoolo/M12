// Función para crear usuarios al iniciar la conexión con la bbdd (debes proporcionar un json con la información de x persona)

import { Client } from 'pg';
import { env } from '../config/env';
import dbLogger from '../config/logger';

// async function createDefaultUsers() {
//     try {
//         for (const userData of DEFAULT_USERS) {
//             // Verificar si ya existe el usuario
//             const existingUser = await User.findOne({
//                 where: {
//                     [Op.or]: [
//                         { username: userData.username },
//                         { email: userData.email }
//                     ]
//                 }
//             });

//             if (!existingUser) {
//                 // Crear el usuario
//                 const hashedPassword = await hash(userData.password, 10);
//                 await User.create({
//                     ...userData,
//                     password: hashedPassword
//                 });
//                 dbLogger.info(`Default user ${userData.username} created successfully.`);
//             } else {
//                 dbLogger.info(`Default user ${userData.username} already exists.`);
//             }
//         }
//     } catch (error) {
//         dbLogger.error("Error creating default users.", { error });
//     }
// }

// Función para crear la bbdd si no existe (usado para entorno local)

export async function createDatabase(): Promise<boolean> {
    if (env.DATABASE_URL) {
        return false;
    }

    const dbName = env.DB_NAME;
    const client = new Client({
        host: env.DB_HOST,
        user: env.DB_USER,
        password: env.DB_PASS,
        port: env.DB_PORT,
        database: 'postgres',
    });

    try {
        await client.connect();

        // Verificar si la base de datos ya existe
        const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

        if (res.rowCount === 0) {
            const escapedDatabaseName = dbName.replace(/"/g, '""');
            await client.query(`CREATE DATABASE "${escapedDatabaseName}"`);
            return true;
        }

        return false; // La base de datos ya existe
    } catch (error) {
        dbLogger.error("Error creating database.", { error });
        throw error;
    } finally {
        await client.end().catch(() => undefined);
    }
}
