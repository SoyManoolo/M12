import { Sequelize, Options, Dialect } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import dbLogger from "./logger";
import { User } from "../models";
import { hash } from "bcryptjs";
import { Op } from "sequelize";
import { env } from './env';

const DatabaseURL = env.DATABASE_URL;
const isTestEnv = env.NODE_ENV === "test";
const dbName = isTestEnv
    ? (env.DB_NAME_TEST || env.DB_NAME)  // Si no existe DB_NAME_TEST, usa DB_NAME
    : env.DB_NAME;
const dbUpdate: boolean = env.DB_UPDATE === true || false;

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
            dbLogger.debug("Default admin user created successfully.");
        } else {
            dbLogger.debug("Default admin user already exists.");
        }
    } catch (error) {
        dbLogger.error("Error creating default admin user.", { error });
    }
}

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
        host: env.DB_HOST,
        port: env.DB_PORT,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };

    // Overload 1: new Sequelize(database: string, username: string, password?: string, options?: Options)
    sequelize = new Sequelize(dbName!, env.DB_USER!, env.DB_PASS!, devOptions);
}

export { sequelize };

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        // const databaseCreated = await createDatabase();

        // if (databaseCreated) {
        //     dbLogger.info("Database created successfully.");
        // }
        dbLogger.info('Base de datos conectada', {
            database: dbName,
            env: env.NODE_ENV
        });

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

export { initializeDatabase };