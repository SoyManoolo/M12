import dotenv from "dotenv";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

import { app } from "./app";

const port = process.env.PORT;

app.listen(port, () => {});