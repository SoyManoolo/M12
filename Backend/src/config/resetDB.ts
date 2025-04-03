import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../config/database";
import dbLogger from "./logger";

const resetDatabase = async () => {
    if (process.env.NODE_ENV !== "test") {
        dbLogger.error("This script can only be run in a test environment!");
        process.exit(1);
    }

    try {
        dbLogger.info("Resetting test database...");

        // Desactiva las restricciones de clave foránea temporalmente
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Obtener todos los índices excepto PRIMARY
        const [indexes] = await sequelize.query(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME_TEST}'
            AND TABLE_NAME = 'users' 
            AND INDEX_NAME != 'PRIMARY'
            GROUP BY INDEX_NAME;
        `);

        // Eliminar cada índice
        for (const index of indexes as any[]) {
            if (index.INDEX_NAME) {
                await sequelize.query(`DROP INDEX ${index.INDEX_NAME} ON users`);
            }
        }

        // Elimina todos los registros de las tablas
        await sequelize.query("DELETE FROM registries");
        await sequelize.query("DELETE FROM users WHERE dni <> '74567486Z'");
        await sequelize.query("DELETE FROM logs");

        // Crea los índices necesarios
        await sequelize.query("CREATE UNIQUE INDEX idx_dni ON users(dni)");
        await sequelize.query("CREATE UNIQUE INDEX idx_email ON users(email)");

        // Reactiva las restricciones de clave foránea
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        dbLogger.info("Test database reset successfully, preserving default test user.");
        process.exit(0);
    } catch (error) {
        dbLogger.error("Error resetting test database:", { error });
        process.exit(1);
    }
};

resetDatabase();