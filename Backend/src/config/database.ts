import { Sequelize } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import dbLogger from "./logger";
import { Client } from "pg"; // Importar el cliente de PostgreSQL

const isTestEnv = process.env.NODE_ENV === "test";
const dbName = isTestEnv ? process.env.DB_NAME_TEST : process.env.DB_NAME;

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

export const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASS!, {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: Number(process.env.DB_PORT) || 5432, // Cambiar a 5432 para PostgreSQL
});

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        // Sincroniza los modelos con la base de datos (crea las tablas si no existen con alter: true)
        await sequelize.sync({ alter: false });
        console.log("All models were synchronized successfully.");

    } catch (error) {
        console.error(error)
    }
}

initializeDatabase();