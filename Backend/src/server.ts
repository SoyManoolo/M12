import dotenv from "dotenv";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

import { app } from "./app";

const port = parseInt(process.env.PORT || "3000");

app.listen(port, () => {});