import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASS!, {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: Number(process.env.DB_PORT) || 3306, // Usa el puerto definido o 3306 por defecto
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