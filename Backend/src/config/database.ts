import { Sequelize, Options, Dialect } from "sequelize";
import { checkServerIdentity, type ConnectionOptions } from 'node:tls';
import { AppError } from "../middlewares/errors/AppError";
import dbLogger, { enableDatabaseLogging } from "./logger";
import { env } from './env';
import { createDatabase } from "../scripts/seedUsers";
import { runMigrations } from "../migrations";

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
    const prodOptions: Options = {
        ...baseOptions,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };

    sequelize = new Sequelize(DatabaseURL, prodOptions);
    const host = sequelize.config.host || 'localhost';
    const useSsl = env.DB_SSL && !host.toLowerCase().endsWith('.railway.internal');

    // Sequelize lee las opciones TLS de la URL antes de aplicar este hook.
    sequelize.addHook('beforeConnect', config => {
        const dialectOptions: NonNullable<typeof config.dialectOptions> & { ssl?: ConnectionOptions | boolean } = {
            ...config.dialectOptions
        };
        const urlSsl = dialectOptions.ssl;
        dialectOptions.ssl = useSsl ? {
            ...(typeof urlSsl === 'object' && urlSsl),
            rejectUnauthorized: true,
            checkServerIdentity: (_hostname, certificate) => checkServerIdentity(host, certificate)
        } : false;
        config.dialectOptions = dialectOptions;
    });
    dbLogger.info(`Database connection mode: ${useSsl ? 'External/SSL' : 'Internal network'}`);

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

        // Tests conservan su base efímera; las bases persistentes usan migraciones versionadas.
        if (dbUpdate) {
            if (isTestEnv) {
                await sequelize.sync({ force: true });
            } else {
                await runMigrations(sequelize);
            }
            dbLogger.info("Database migrations completed successfully.");
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
