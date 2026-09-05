import { Sequelize, Options, Dialect } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import dbLogger, { enableDatabaseLogging } from "./logger";
import { env } from './env';
import { createDatabase } from "../scripts/seedUsers";

const isTestEnv = env.NODE_ENV === "test";
const DatabaseURL = isTestEnv ? env.DATABASE_URL_TEST : env.DATABASE_URL;
const dbName = isTestEnv ? env.DB_NAME_TEST : env.DB_NAME;
const dbUpdate: boolean = env.DB_UPDATE === true || false;

function assertSafeTestDatabase() {
    if (!isTestEnv) return;

    if (!dbName || dbName === env.DB_NAME) {
        throw new AppError(500, 'UnsafeTestDatabase');
    }

    if (DatabaseURL) {
        const urlDatabaseName = decodeURIComponent(new URL(DatabaseURL).pathname).replace(/^\//, '');
        if (DatabaseURL === env.DATABASE_URL || urlDatabaseName !== dbName) {
            throw new AppError(500, 'UnsafeTestDatabase');
        }
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
        assertSafeTestDatabase();
        if (!isTestEnv) {
            const databaseCreated = await createDatabase();
            if (databaseCreated) {
                dbLogger.info("Database created successfully.");
            }
        }
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
        } else {
            dbLogger.info("Skipping model synchronization (DB_UPDATE is not 'true')");
        }

        await enableDatabaseLogging();

    } catch (error) {
        dbLogger.error('Error connecting to the database', { error });
        throw new AppError(500, "FailedConnection");
    }
}

export { initializeDatabase };
