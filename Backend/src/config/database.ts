import { Sequelize } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import dbLogger from "./logger";
import { Client } from "pg"; // Importar el cliente de PostgreSQL
import { User } from "../models";
import { hash } from "bcryptjs";
import { Op } from "sequelize";

const isTestEnv = process.env.NODE_ENV === "test";
const dbName = isTestEnv ? process.env.DB_NAME_TEST : process.env.DB_NAME;
const dbUpdate: boolean = process.env.DB_UPDATE === "true" || false;

// Datos del usuario administrador por defecto
const DEFAULT_ADMIN = {
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    is_mod: true,
    name: "Admin",
    surname: "System"
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

async function createDatabase(): Promise<boolean> {
    try {
        const client = new Client({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER!,
            password: process.env.DB_PASS!,
            port: Number(process.env.DB_PORT) || 5432, // Puerto por defecto de PostgreSQL
        });

        await client.connect();

        // Verificar si la base de datos ya existe
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);

        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE "${dbName}"`);
            await client.end();
            return true;
        }

        await client.end();
        return false; // La base de datos ya existe
    } catch (error) {
        dbLogger.error("Error creating database.", { error });
        throw new AppError(500, "FailedConnection");
    }
}

export const sequelize = new Sequelize(dbName!, process.env.DB_USER!, process.env.DB_PASS!, {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: Number(process.env.DB_PORT) || 5432, // Puerto por defecto de PostgreSQL
});

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        const databaseCreated = await createDatabase();

        if (databaseCreated) {
            dbLogger.info("Database created successfully.");
        }
        console.log(`Using database: ${dbName} (Environment: ${process.env.NODE_ENV || "development"})`);

        await sequelize.authenticate();
        dbLogger.info("Connection has been established successfully.");

        // Sincroniza los modelos con la base de datos (crea las tablas si no existen con alter: true)
        if (dbUpdate) {
            await sequelize.sync({ alter: true });
            dbLogger.info("All models were synchronized successfully.");
            // Crear usuario administrador después de sincronizar
            await createDefaultAdmin();
        } else {
            dbLogger.info("Skipping model synchronization (DB_UPDATE is not 'true')");
        }

    } catch (error) {
        dbLogger.error('Error connecting to the database', { error });
        throw new AppError(500, "FailedConnection");
    }
}

initializeDatabase();