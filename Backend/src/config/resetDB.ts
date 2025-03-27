import dotenv from "dotenv";
dotenv.config(); // Asegura que las variables de entorno se carguen

import { sequelize } from "../config/database";

const resetDatabase = async () => {
  if (process.env.NODE_ENV !== "test") {
    console.error("This script can only be run in a test environment!");
    process.exit(1);
  }

  console.log("DB_NAME_TEST:", process.env.DB_NAME_TEST);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_PASS:", process.env.DB_PASS);
  console.log("DB_HOST:", process.env.DB_HOST);

  try {
    console.log("Resetting test database...");

    // Desactiva las restricciones de clave foránea temporalmente
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Elimina todos los registros de la tabla `registries`
    await sequelize.query("DELETE FROM registries");

    // Elimina todos los usuarios EXCEPTO el de dni=74567486Z
    await sequelize.query("DELETE FROM users WHERE dni <> '74567486Z'");

    // Reactiva las restricciones de clave foránea
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Test database reset successfully, preserving default test user.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting test database:", error);
    process.exit(1);
  }
};

resetDatabase();
