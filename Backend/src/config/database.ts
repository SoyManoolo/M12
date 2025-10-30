import { Sequelize, Options, Dialect } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import dbLogger from "./logger";
import { Client } from "pg"; // Importar el cliente de PostgreSQL
import { User } from "../models";
import { hash } from "bcryptjs";
import { Op } from "sequelize";

console.log('[DEBUG-DB] 1. database.ts cargando...');
console.log('[DEBUG-DB] 2. NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG-DB] 3. DATABASE_URL presente?:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('[DEBUG-DB] 4. DATABASE_URL primeros 50 chars:', process.env.DATABASE_URL.substring(0, 50));
}

const DatabaseURL = process.env.DATABASE_URL;
dbLogger.info("Valor de DATABASE_URL: ", { DatabaseURL })
const isTestEnv = process.env.NODE_ENV === "test";
const dbName = isTestEnv ? process.env.DB_NAME_TEST : process.env.DB_NAME;
const dbUpdate: boolean = process.env.DB_UPDATE === "true" || false;

// Datos del usuario administrador por defecto
const DEFAULT_ADMIN = {
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    is_moderator: true,
    name: "Admin",
    surname: "System",
    profile_picture: "/assets/images/profiles/admin.png"
};

async function createDefaultAdmin() {
    try {
        // Verificar si ya existe un usuario administrador
        const existingAdmin = await User.findOne({
            where: {
                [Op.or]: [
                    { username: DEFAULT_ADMIN.username },
                    { email: DEFAULT_ADMIN.email }
                ]
            }
        });

        if (!existingAdmin) {
            // Crear el usuario administrador
            const hashedPassword = await hash(DEFAULT_ADMIN.password, 10);
            await User.create({
                ...DEFAULT_ADMIN,
                password: hashedPassword
            });
            dbLogger.info("Default admin user created successfully.");
        } else {
            dbLogger.info("Default admin user already exists.");
        }
    } catch (error) {
        dbLogger.error("Error creating default admin user.", { error });
    }
}

// Función para crear usuarios al iniciar la conexión con la bbdd (debes proporcionar un json con la información de x persona)

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

// async function createDatabase(): Promise<boolean> {
//     try {
//         const client = new Client({
//             host: process.env.DB_HOST || "localhost",
//             user: process.env.DB_USER!,
//             password: process.env.DB_PASS!,
//             port: Number(process.env.DB_PORT) || 5432, // Puerto por defecto de PostgreSQL
//         });

//         await client.connect();

//         // Verificar si la base de datos ya existe
//         const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);

//         if (res.rowCount === 0) {
//             await client.query(`CREATE DATABASE "${dbName}"`);
//             await client.end();
//             return true;
//         }

//         await client.end();
//         return false; // La base de datos ya existe
//     } catch (error) {
//         dbLogger.error("Error creating database.", { error });
//         throw new AppError(500, "FailedConnection");
//     }
// }

// --- Opciones de Base ---
const baseOptions: Options = {
    dialect: "postgres" as Dialect,
    logging: false,
};

let sequelize: Sequelize;

// ----------------------------------------------------
// 2. Inicialización Condicional
// ----------------------------------------------------

if (DatabaseURL) {
    // ENTORNO DE PRODUCCIÓN (RAILWAY)

    // Detectar si es una conexión interna de Railway (no requiere SSL)
    const isRailwayInternal = DatabaseURL.includes('.railway.internal');

    // Opciones específicas para Producción
    const prodOptions: Options = {
        ...baseOptions,
        dialectOptions: isRailwayInternal ? {} : {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };

    // Overload 3: new Sequelize(uri: string, options?: Options)
    sequelize = new Sequelize(DatabaseURL, prodOptions);

    dbLogger.info(`Database connection mode: ${isRailwayInternal ? 'Railway Internal Network' : 'External/SSL'}`);

} else {
    // ENTORNO DE DESARROLLO (LOCALHOST)

    // Opciones específicas para Desarrollo (host, port)
    const devOptions: Options = {
        ...baseOptions,
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };

    // Overload 1: new Sequelize(database: string, username: string, password?: string, options?: Options)
    sequelize = new Sequelize(dbName!, process.env.DB_USER!, process.env.DB_PASS!, devOptions);
}

export { sequelize };

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        // const databaseCreated = await createDatabase();

        // if (databaseCreated) {
        //     dbLogger.info("Database created successfully.");
        // }
        console.log(`Using database: ${dbName} (Environment: ${process.env.NODE_ENV || "development"})`);

        await sequelize.authenticate();
        dbLogger.info("Connection has been established successfully.");

        // Sincroniza los modelos con la base de datos (crea las tablas si no existen con alter: true)
        if (dbUpdate) {
            // En tests usamos force para entorno controlado; en otros entornos usamos alter para evitar pérdida de datos
            if (isTestEnv) {
                await sequelize.sync({ force: true });
            } else {
                await sequelize.sync({ alter: true });
            }
            dbLogger.info("All models were synchronized successfully.");
            // Crear usuarios por defecto después de sincronizar
            await createDefaultAdmin();
            // await createDefaultUsers();
        } else {
            dbLogger.info("Skipping model synchronization (DB_UPDATE is not 'true')");
        }

    } catch (error) {
        dbLogger.error('Error connecting to the database', { error });
        throw new AppError(500, "FailedConnection");
    }
}

// NO inicializar aquí - lo haremos desde server.ts después de que el servidor HTTP esté escuchando
// initializeDatabase();

export { initializeDatabase };