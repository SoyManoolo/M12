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